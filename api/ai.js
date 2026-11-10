// Sidebar: Claude proxy. Keeps the Anthropic key on the server and streams the answer back.
export const config = { runtime: "edge" };
const MODELS = ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"];
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async function handler(req) {
  const key = process.env.ANTHROPIC_API_KEY || "";
  const pass = process.env.APP_PASSCODE || "";
  if (req.method === "GET") return json({ ai: !!key && !!pass, transcribe: !!process.env.DEEPGRAM_API_KEY && !!pass, locked: !!pass, needsPasscode: (!!key || !!process.env.DEEPGRAM_API_KEY) && !pass });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!key) return json({ error: "No ANTHROPIC_API_KEY is set on the server." }, 501);
  if (!pass) return json({ error: "Set APP_PASSCODE on the server before using the key." }, 503);
  if (req.headers.get("x-sidebar-pass") !== pass) return json({ error: "Passcode required." }, 401);
  let b;
  try { b = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  if (!b || !Array.isArray(b.messages) || !b.messages.length) return json({ error: "Bad request." }, 400);
  const body = {
    model: MODELS.includes(b.model) ? b.model : MODELS[0],
    max_tokens: Math.max(256, Math.min(Number(b.max_tokens) || 8000, 16000)),
    stream: true,
    messages: b.messages.slice(-20).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 900000) }))
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
  return new Response(r.body, { headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
}

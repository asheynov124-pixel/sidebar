// Sidebar: hands the browser a 60-second Deepgram token for live transcription, so the real key never leaves the server.
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export async function POST(req) {
  const key = process.env.DEEPGRAM_API_KEY || "", pass = process.env.APP_PASSCODE || "";
  if (!key) return json({ error: "No DEEPGRAM_API_KEY is set on the server." }, 501);
  if (!pass) return json({ error: "Set APP_PASSCODE on the server before using the key." }, 503);
  if (req.headers.get("x-sidebar-pass") !== pass) return json({ error: "Passcode required." }, 401);
  const r = await fetch("https://api.deepgram.com/v1/auth/grant", { method: "POST", headers: { Authorization: "Token " + key, "content-type": "application/json" }, body: JSON.stringify({ ttl_seconds: 60 }) });
  if (!r.ok) return json({ error: "Deepgram " + r.status + ": " + (await r.text()).slice(0, 200) }, 502);
  const d = await r.json();
  return json({ access_token: d.access_token, expires_in: d.expires_in });
}
export async function GET() { return json({ error: "Method not allowed" }, 405); }

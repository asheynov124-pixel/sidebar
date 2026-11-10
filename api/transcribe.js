// Sidebar: Studio transcription. Sends one audio part to Deepgram and returns speaker-labeled lines.
// Node runtime (not edge) so long audio parts aren't cut off by the edge first-byte limit.
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

async function listen(key, model, lang, type, audio, terms) {
  const q = new URLSearchParams({ model, smart_format: "true", punctuate: "true", diarize: "true", utterances: "true" });
  for (const k of terms || []) q.append("keyterm", k);
  if (lang === "auto") q.set("detect_language", "true"); else q.set("language", lang);
  return fetch("https://api.deepgram.com/v1/listen?" + q, { method: "POST", headers: { Authorization: "Token " + key, "Content-Type": type }, body: audio });
}

export async function POST(req) {
  const key = process.env.DEEPGRAM_API_KEY || "";
  const pass = process.env.APP_PASSCODE || "";
  if (!key) return json({ error: "No DEEPGRAM_API_KEY is set on the server." }, 501);
  if (!pass) return json({ error: "Set APP_PASSCODE on the server before using the key." }, 503);
  if (req.headers.get("x-sidebar-pass") !== pass) return json({ error: "Passcode required." }, 401);
  const lang = ((new URL(req.url)).searchParams.get("lang") || "en").replace(/[^a-zA-Z-]/g, "").slice(0, 10) || "en";
  const type = req.headers.get("content-type") || "audio/webm";
  const audio = await req.arrayBuffer();
  if (!audio.byteLength) return json({ error: "No audio received." }, 400);
  if (audio.byteLength > 4.4e6) return json({ error: "Audio part is over 4 MB." }, 413);
  const terms = ((new URL(req.url)).searchParams.get("terms") || "").split("|").map(s => s.trim()).filter(Boolean).slice(0, 60);
  let r = await listen(key, "nova-3", lang, type, audio, terms);
  if (r.status === 400 && terms.length) r = await listen(key, "nova-3", lang, type, audio);
  if (r.status === 400) r = await listen(key, "nova-2", lang, type, audio); // older model covers more languages
  if (!r.ok) return json({ error: "Deepgram " + r.status + ": " + (await r.text()).slice(0, 300) }, 502);
  const d = await r.json();
  const utt = (d && d.results && d.results.utterances) || [];
  return json({ lines: utt.filter(u => (u.transcript || "").trim()).map(u => ({ t: Math.round(u.start || 0), sp: Number(u.speaker) || 0, text: u.transcript.trim() })) });
}
export async function GET() { return json({ error: "Method not allowed" }, 405); }

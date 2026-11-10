# Sidebar

Record, transcribe and summarize, with 107 summary templates.

Live on Vercel. Recordings stay in the browser on each device; use Settings → Back up now and then.

## Turning on the AI features (Vercel → Project → Settings → Environment Variables)

| Name | What it does |
|---|---|
| `APP_PASSCODE` | Any phrase you choose. Required before the keys below are used, so strangers can't spend your credits. Type the same phrase into Sidebar's Settings. |
| `ANTHROPIC_API_KEY` | Claude writes summaries and answers questions (console.anthropic.com). |
| `DEEPGRAM_API_KEY` | Studio transcription: catches every word live and again after you stop, and tells speakers apart by voice (deepgram.com). Create the key with **Member** permission or higher. |

Redeploy after adding them. The `api/` folder holds the server pieces that keep those keys off the phone. GitHub Pages and the fly.io static server can show the app but can't run `api/`, so use the Vercel address for recording.

# VoiceSQL AI — Frontend

React + Vite dashboard for VoiceSQL AI. Lets users type or speak natural
language questions, sends them to the Flask backend, and displays the
generated SQL, results, and a basic chart.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

- `VITE_GOOGLE_CLIENT_ID` — the same Google OAuth client ID used by the
  backend's `GOOGLE_CLIENT_ID`. Required for the Google Sign-In button to
  render and work correctly.

## 3. Make sure the backend is running

This frontend expects the Flask API at **http://localhost:5000/api**
(see `API_BASE` in `Dashboard.jsx`, `Database.jsx`, `Settings.jsx`, etc.).
Follow `voice-sql-backend/README.md` to get that running first.

## 4. Run the dev server

```bash
npm run dev
```

Vite will print a local URL, usually **http://localhost:5173**. Open it in
Chrome (voice input uses the Web Speech API, which has the best support
there).

## Pages

- **Dashboard** — ask a question by voice or text, view generated SQL, query
  results, a simple chart, and recent query history
- **New Query** — same as Dashboard, focused input
- **Query History** — full list of past questions and their status
- **Database** — browse queryable tables and their columns (internal tables
  like `users` and `query_history` are hidden here — see `hiddenTables` in
  `Database.jsx`)
- **Analytics** — query counts, activity over the last 7 days, most-used
  tables, query complexity breakdown
- **Settings** — appearance, voice, live database connection info, query
  preferences

## Notes

- Voice input relies on the browser's `SpeechRecognition` /
  `webkitSpeechRecognition` API — not supported in all browsers (Chrome/Edge
  work, Firefox/Safari support is limited or absent). The app falls back to
  text input with a message if it's unavailable.
- `API_BASE` is currently hardcoded per-file rather than read from an env
  var — if you deploy this somewhere other than `localhost:5000`, you'll
  need to update it (or refactor it into a single shared config/env var).

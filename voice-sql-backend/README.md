# VoiceSQL AI — Backend

Flask API that turns natural language questions into SQL (via Gemini), runs them
against your PostgreSQL database, and returns results + keeps a history log.

## 1. Install dependencies

```bash
cd voice-sql-backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

- `DATABASE_URL` — your PostgreSQL connection string, e.g.
  `postgresql://postgres:yourpassword@localhost:5432/company_db`
- `GEMINI_API_KEY` — get a free key at https://aistudio.google.com/app/apikey
  (no credit card required)

## 3. Make sure your PostgreSQL database exists

The backend reads your existing tables automatically (via `information_schema`),
so as long as `company_db` has tables like `students` or `employees` already
created and populated, nothing else is needed. It also auto-creates one extra
table, `query_history`, to log past questions.

## 4. Run the server

```bash
python app.py
```

This starts the API on **http://localhost:5000** — matching the `API_BASE` your
React frontend already expects.

## 5. Run the frontend

In the `voice-sql-frontend` folder (separate project):

```bash
npm install
npm run dev
```

Open the Vite dev URL (usually http://localhost:5173) — the dashboard should now
be able to submit questions and get real SQL + results back.

## How it works

1. `GET /api/history` — returns the last 20 questions asked, for the "Recent
   Queries" table.
2. `POST /api/execute-query` with `{ "text": "..." }`:
   - Reads your database schema (`information_schema.columns`)
   - Sends the schema + question to Gemini, asking for a SQL `SELECT` only
   - **Safety check**: rejects anything that isn't a single, read-only `SELECT`
     statement (no `INSERT`/`UPDATE`/`DELETE`/`DROP`/etc.) before it ever
     touches your database
   - Executes the query and returns `{ sql, columns, rows }`
   - Logs the question to `query_history`

## Notes / things you may want to change later

- Rate limiting / auth aren't included — fine for local/demo use, add before
  deploying anywhere public.
- The safety filter blocks destructive SQL, but for extra protection in
  production you could also run queries against a **read-only** Postgres role.
- Switching LLM providers later just means editing `llm.py` — the rest of the
  app doesn't need to change.

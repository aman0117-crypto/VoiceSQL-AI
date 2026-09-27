VoiceSQL AI — Backend
Flask API that turns natural language questions into SQL (via Groq), runs them
against your PostgreSQL database, and returns results + keeps a history log.
Includes JWT-based auth (email/password + Google OAuth).
1. Install dependencies
```bash
cd voice-sql-backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```
2. Configure environment
```bash
cp .env.example .env
```
Then edit `.env`:
`DATABASE_URL` — your PostgreSQL connection string, e.g.
`postgresql://postgres:yourpassword@localhost:5432/voicesql_db`
`GROQ_API_KEY` — get a free key at https://console.groq.com/keys
`GROQ_MODEL` — e.g. `llama-3.3-70b-versatile`
`JWT_SECRET_KEY` — any long random string, used to sign login tokens
`GOOGLE_CLIENT_ID` — from your Google Cloud OAuth credentials, used to verify
Google Sign-In (must match the `VITE_GOOGLE_CLIENT_ID` used by the frontend)
3. Set up the database
Create an empty PostgreSQL database, point `DATABASE_URL` at it, then run the
schema file from the project root:
```bash
psql "your_database_url_here" -f ../schema.sql
```
This creates the tables the app requires — `users` and `query_history` — plus
sample `department`/`employees` data so you can test queries immediately.
`users` and `query_history` are reserved for the app itself; any other tables
you add (or already have) are what gets queried via natural language.
4. Run the server
```bash
python app.py
```
This starts the API on http://localhost:5000 and also runs
`init_history_table()` on startup as a safety net in case `query_history`
doesn't exist yet.
5. Run the frontend
See `voice-sql-frontend/README.md` (or the project root README) — in short:
```bash
cd ../voice-sql-frontend
npm install
npm run dev
```
API Endpoints
Method	Endpoint	Auth	Description
POST	`/api/auth/signup`	—	Create a local account (name, email, password)
POST	`/api/auth/login`	—	Log in with email/password
POST	`/api/auth/google`	—	Log in / sign up via Google ID token
POST	`/api/execute-query`	✅	`{ "text": "..." }` → generates + runs SQL
GET	`/api/history`	✅	Last 50 questions for the logged-in user
GET	`/api/tables`	—	List of queryable tables
GET	`/api/tables/<table_name>`	—	Column details for one table
GET	`/api/analytics`	✅	Query counts, activity, most-used tables, complexity
GET	`/api/database-info`	✅	Live DB type/name/connection status
GET	`/api/health`	—	Health check
Endpoints marked ✅ require an `Authorization: Bearer <token>` header, where
`<token>` is the JWT returned by signup/login.
How `/api/execute-query` works
Reads your database schema (`information_schema.columns`)
Sends the schema + question to Groq, asking for a single SQL `SELECT` only
Safety check: rejects anything that isn't a read-only `SELECT`
statement (no `INSERT`/`UPDATE`/`DELETE`/`DROP`/etc.) before it ever
touches your database
Executes the query and returns `{ sql, columns, rows }`
Logs the question, generated SQL, row count, and status to `query_history`,
tied to the logged-in user via `user_id`
Notes / things you may want to change later
Rate limiting isn't included — fine for local/demo use, add before
deploying anywhere public.
The safety filter blocks destructive SQL, but for extra protection in
production you could also run queries against a read-only Postgres role.
Switching LLM providers later just means editing `llm.py` — the rest of the
app doesn't need to change.
`users` and `query_history` are hidden from the frontend's Database page by
name (see `voice-sql-frontend/src/pages/Database.jsx`) since they're
internal to the app, not your queryable business data.
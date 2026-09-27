import os
import re
from datetime import datetime, date
from decimal import Decimal
from urllib.parse import urlparse

import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE_URL = os.environ.get("DATABASE_URL")

DB_TYPE_MAP = {
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mysql+pymysql": "MySQL",
    "sqlite": "SQLite",
}


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and fill in your PostgreSQL connection string."
        )
    return psycopg2.connect(DATABASE_URL)


def get_database_info():
    if not DATABASE_URL:
        return {"type": "Not configured", "name": "N/A", "connected": False}

    parsed = urlparse(DATABASE_URL)
    scheme = (parsed.scheme or "").split("+")[0].lower()
    db_type = DB_TYPE_MAP.get(parsed.scheme.lower(), DB_TYPE_MAP.get(scheme, scheme.upper() or "Unknown"))
    db_name = parsed.path.lstrip("/") or "N/A"

    try:
        conn = get_connection()
        conn.close()
        connected = True
    except Exception:
        connected = False

    return {"type": db_type, "name": db_name, "connected": connected}


def get_user_by_email(email):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, email, password_hash,
                       google_id, profile_picture, auth_provider
                FROM users
                WHERE LOWER(email) = LOWER(%s)
                """,
                (email,),
            )

            row = cur.fetchone()

    finally:
        conn.close()

    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "password_hash": row[3],
        "google_id": row[4],
        "profile_picture": row[5],
        "auth_provider": row[6],
    }


def create_local_user(name, email, password):
    conn = get_connection()

    try:
        with conn.cursor() as cur:

            password_hash = generate_password_hash(password)

            cur.execute(
                """
                INSERT INTO users
                (name, email, password_hash, auth_provider)
                VALUES (%s, %s, %s, 'local')
                RETURNING id, name, email
                """,
                (name, email, password_hash),
            )

            row = cur.fetchone()

        conn.commit()

        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
        }

    finally:
        conn.close()


def create_google_user(name, email, google_id, profile_picture=None):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    google_id,
                    profile_picture,
                    auth_provider
                )
                VALUES (%s, %s, %s, %s, 'google')
                RETURNING id, name, email
                """,
                (
                    name,
                    email,
                    google_id,
                    profile_picture,
                ),
            )

            row = cur.fetchone()

        conn.commit()

        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
        }

    finally:
        conn.close()


def update_google_user(user_id, google_id, profile_picture=None):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE users
                SET
                    google_id = %s,
                    profile_picture = %s
                WHERE id = %s
                """,
                (
                    google_id,
                    profile_picture,
                    user_id,
                ),
            )

        conn.commit()

    finally:
        conn.close()



def verify_local_user(email, password):
    user = get_user_by_email(email)

    if not user:
        return None

    if not user["password_hash"]:
        return None

    if not check_password_hash(
        user["password_hash"],
        password
    ):
        return None

    return user



def init_history_table():
    """Create the query_history table if it doesn't exist yet."""
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS query_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    question TEXT NOT NULL,
                    sql TEXT NOT NULL,
                    row_count INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'success',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )

        conn.commit()

    finally:
        conn.close()


def get_schema_description():
    """Introspect the public schema and return a plain-text description of
    tables/columns to feed the LLM as context."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    tables = {}
    for table_name, column_name, data_type in rows:
        tables.setdefault(table_name, []).append(f"{column_name} ({data_type})")

    if not tables:
        return "(no tables found in the public schema)"

    lines = []
    for table_name, columns in tables.items():
        lines.append(f"Table {table_name}: " + ", ".join(columns))
    return "\n".join(lines)


def _serialize_value(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def run_select_query(sql):
    """Execute a read-only SELECT query and return (columns, rows-as-dicts)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            columns = [desc[0] for desc in cur.description]
            raw_rows = cur.fetchall()
    finally:
        conn.close()

    rows = [
        {col: _serialize_value(val) for col, val in zip(columns, row)}
        for row in raw_rows
    ]
    return columns, rows


def save_history(user_id, question, sql, row_count, status):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO query_history
                (user_id, question, sql, row_count, status)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, question, sql, row_count, status),
            )

        conn.commit()

    finally:
        conn.close()


def get_history(user_id, limit=50):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, question, sql, row_count, status, created_at
                FROM query_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )

            rows = cur.fetchall()

    finally:
        conn.close()

    return [
        {
            "id": r[0],
            "text": r[1],
            "sql": r[2],
            "row_count": r[3],
            "status": r[4],
            "timestamp": r[5].isoformat(),
        }
        for r in rows
    ]


def get_tables():
    """Return all user tables from the public schema except query_history."""
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND LOWER(table_name) <> 'query_history'
                ORDER BY table_name
                """
            )

            rows = cur.fetchall()

    finally:
        conn.close()

    return [row[0] for row in rows]


def get_table_details(table_name):
    """Return column details for a selected table."""

    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = %s
                ORDER BY ordinal_position
                """,
                (table_name,),
            )

            rows = cur.fetchall()

    finally:
        conn.close()

    return [
        {
            "name": row[0],
            "type": row[1],
            "nullable": row[2],
            "position": row[3],
        }
        for row in rows
    ]
    
    
def get_analytics(user_id):
    """Return analytics calculated only from the logged-in user's query history."""

    conn = get_connection()

    try:
        with conn.cursor() as cur:

            # -----------------------------
            # Query activity - last 7 days
            # -----------------------------
            cur.execute(
                """
                SELECT
                    DATE(created_at) AS query_date,
                    COUNT(*) AS query_count
                FROM query_history
                WHERE user_id = %s
                  AND created_at >= CURRENT_DATE - INTERVAL '6 days'
                GROUP BY DATE(created_at)
                ORDER BY query_date
                """,
                (user_id,),
            )

            activity_rows = cur.fetchall()

            # -----------------------------
            # Total queries
            # -----------------------------
            cur.execute(
                """
                SELECT COUNT(*)
                FROM query_history
                WHERE user_id = %s
                """,
                (user_id,),
            )

            total_queries = cur.fetchone()[0]

            # -----------------------------
            # Successful queries
            # -----------------------------
            cur.execute(
                """
                SELECT COUNT(*)
                FROM query_history
                WHERE user_id = %s
                  AND status = 'success'
                """,
                (user_id,),
            )

            successful_queries = cur.fetchone()[0]

            # -----------------------------
            # Failed queries
            # -----------------------------
            cur.execute(
                """
                SELECT COUNT(*)
                FROM query_history
                WHERE user_id = %s
                  AND status = 'failed'
                """,
                (user_id,),
            )

            failed_queries = cur.fetchone()[0]

            # -----------------------------
            # Queries in last 7 days
            # -----------------------------
            cur.execute(
                """
                SELECT COUNT(*)
                FROM query_history
                WHERE user_id = %s
                  AND created_at >= CURRENT_DATE - INTERVAL '6 days'
                """,
                (user_id,),
            )

            last_7_days = cur.fetchone()[0]

            # -----------------------------
            # Recent history
            # -----------------------------
            cur.execute(
                """
                SELECT question, sql, row_count, created_at
                FROM query_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (user_id,),
            )

            history_rows = cur.fetchall()

            # -----------------------------
            # Actual database tables
            # -----------------------------
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND LOWER(table_name) <> 'query_history'
                ORDER BY table_name
                """
            )

            table_rows = cur.fetchall()

    finally:
        conn.close()

    actual_tables = [row[0] for row in table_rows]

    # =====================================================
    # Query Activity
    # =====================================================

    activity_map = {
        row[0].isoformat(): row[1]
        for row in activity_rows
    }

    activity = []

    current_date = date.today()

    for i in range(7):

        day = current_date.fromordinal(
            current_date.toordinal() - (6 - i)
        )

        activity.append(
            {
                "date": day.isoformat(),
                "day": day.strftime("%a"),
                "count": activity_map.get(
                    day.isoformat(),
                    0
                ),
            }
        )

    # =====================================================
    # Most Used Tables
    # =====================================================

    table_usage = {
        table_name: 0
        for table_name in actual_tables
    }

    for _, sql, _, _ in history_rows:

        sql_upper = sql.upper()

        for table_name in actual_tables:

            pattern = r"\b" + re.escape(
                table_name.upper()
            ) + r"\b"

            if re.search(pattern, sql_upper):
                table_usage[table_name] += 1

    most_used_tables = [
        {
            "name": table_name,
            "queries": count,
        }
        for table_name, count in table_usage.items()
        if count > 0
    ]

    most_used_tables.sort(
        key=lambda item: item["queries"],
        reverse=True
    )

    most_used_tables = most_used_tables[:5]

    # =====================================================
    # Query Complexity Analysis
    # Only successful queries of this user
    # =====================================================

    complexity = {
        "simple": 0,
        "moderate": 0,
        "complex": 0,
    }

    conn = get_connection()

    try:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT sql
                FROM query_history
                WHERE user_id = %s
                  AND status = 'success'
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (user_id,),
            )

            successful_history_rows = cur.fetchall()

    finally:
        conn.close()

    # Analyze complexity
    for (sql,) in successful_history_rows:

        sql_upper = sql.upper()

        score = 0

        # JOIN
        score += len(
            re.findall(
                r"\bJOIN\b",
                sql_upper
            )
        ) * 2

        # WHERE
        if re.search(
            r"\bWHERE\b",
            sql_upper
        ):
            score += 1

        # GROUP BY
        if re.search(
            r"\bGROUP\s+BY\b",
            sql_upper
        ):
            score += 2

        # ORDER BY
        if re.search(
            r"\bORDER\s+BY\b",
            sql_upper
        ):
            score += 1

        # HAVING
        if re.search(
            r"\bHAVING\b",
            sql_upper
        ):
            score += 2

        # Subquery
        score += max(
            0,
            len(
                re.findall(
                    r"\bSELECT\b",
                    sql_upper
                )
            ) - 1
        ) * 3

        # Classification
        if score <= 2:
            complexity["simple"] += 1

        elif score <= 5:
            complexity["moderate"] += 1

        else:
            complexity["complex"] += 1

    return {
        "total_queries": total_queries,
        "successful_queries": successful_queries,
        "failed_queries": failed_queries,
        "last_7_days": last_7_days,
        "activity": activity,
        "most_used_tables": most_used_tables,
        "query_complexity": complexity,
    }
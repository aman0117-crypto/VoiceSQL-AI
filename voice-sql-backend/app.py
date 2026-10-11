import os
import re
import traceback
from datetime import datetime, timedelta, timezone
from functools import wraps
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from database.connection import (test_connection,get_connection_from_config,get_schema_from_config,run_select_query_from_config)
from session.session_db import (create_session, set_database, remove_session)
import db
import llm

app = Flask(__name__)
CORS(app)

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set in .env")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is not set in .env")

FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|EXECUTE|CALL)\b",
    re.IGNORECASE,
)


def is_safe_select(sql):
    """Only allow a single, read-only SELECT statement through to the database."""
    if not sql:
        return False
    body = sql.strip().rstrip(";").strip()
    if not body:
        return False
    if ";" in body:
        return False  # reject stacked statements
    if not re.match(r"^\s*SELECT\b", body, re.IGNORECASE):
        return False
    if FORBIDDEN_KEYWORDS.search(body):
        return False
    return True


def create_access_token(user_id, session_id):
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm="HS256",
    )


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "Authentication required."
            }), 401

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=["HS256"],
            )

            request.user_id = payload["user_id"]
            request.session_id = payload["session_id"]

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Session expired. Please log in again."
            }), 401

        except (jwt.InvalidTokenError, KeyError):
            return jsonify({
                "error": "Invalid authentication token."
            }), 401

        return f(*args, **kwargs)

    return decorated


@app.route("/api/auth/signup", methods=["POST"])
def signup():

    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name:
        return jsonify({
            "error": "Name is required."
        }), 400

    if not email:
        return jsonify({
            "error": "Email is required."
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must be at least 8 characters."
        }), 400

    try:
        existing_user = db.get_user_by_email(email)

        if existing_user:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        user = db.create_local_user(
            name,
            email,
            password
        )

        session_id = create_session()
        token = create_access_token(user["id"], session_id)

        return jsonify({
            "message": "Account created successfully.",
            "token": token,
            "user": user
        }), 201

    except Exception as e:
        return jsonify({
            "error": f"Could not create account: {e}"
        }), 500


@app.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    try:
        user = db.verify_local_user(email, password)

        if not user:
            return jsonify({
                "error": "Invalid email or password."
            }), 401

        session_id = create_session()
        token = create_access_token(user["id"], session_id)

        return jsonify({
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"Could not log in: {e}"
        }), 500



@app.route("/api/auth/google", methods=["POST"])
def google_login():

    data = request.get_json(silent=True) or {}

    credential = data.get("credential")

    if not credential:
        return jsonify({
            "error": "Google credential is required."
        }), 400

    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Get Google user information
        google_id = idinfo.get("sub")
        email = (idinfo.get("email") or "").strip().lower()
        name = idinfo.get("name") or email.split("@")[0]

        if not google_id or not email:
            return jsonify({
                "error": "Could not retrieve Google account information."
            }), 400

        # Make sure Google has verified the email
        if not idinfo.get("email_verified"):
            return jsonify({
                "error": "Google email address is not verified."
            }), 400

        # Check whether user already exists
        user = db.get_user_by_email(email)

        if not user:

            # Create Google user
            user = db.create_google_user(
                name=name,
                email=email,
                google_id=google_id
            )

        # Create a new temporary session for this login
        session_id = create_session()

        # Generate VoiceSQL JWT containing the session ID
        token = create_access_token(user["id"], session_id)

        return jsonify({
            "message": "Google login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except ValueError:
        return jsonify({
            "error": "Invalid Google authentication credential."
        }), 401

    except Exception as e:
        return jsonify({
            "error": f"Could not complete Google login: {e}"
        }), 500



@app.route("/api/disconnect-db", methods=["POST"])
@require_auth
def disconnect_database():
    from session.session_db import clear_database

    try:
        clear_database(request.session_id)

        return jsonify({
            "success": True,
            "message": "Database disconnected successfully."
        }), 200

    except RuntimeError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Could not disconnect the database."
        }), 500


@app.route("/api/logout", methods=["POST"])
@require_auth
def logout():
    try:
        remove_session(request.session_id)

        return jsonify({
            "success": True,
            "message": "Logged out successfully."
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "error": "Could not complete logout."
        }), 500



@app.route("/api/test-db-connection", methods=["POST"])
@require_auth
def test_db_connection():
    data = request.get_json(silent=True) or {}

    db_type = data.get("db_type")
    host = data.get("host")
    port = data.get("port")
    database = data.get("database")
    username = data.get("username")
    password = data.get("password")

    try:
        # First test the database connection
        result = test_connection(
            db_type=db_type,
            host=host,
            port=port,
            database=database,
            username=username,
            password=password,
        )

        # Only save the database details if the connection succeeded
        if result.get("success"):
            database_config = {
                "db_type": db_type,
                "host": host,
                "port": port,
                "database": database,
                "username": username,
                "password": password,
            }

            set_database(
                request.session_id,
                database_config
            )

        return jsonify(result), 200
    except ValueError as e:
        print("Database connection validation error:", e)

        return jsonify({
            "success": False,
            "error": "Unable to connect to the database. Please check your connection details."
        }), 400

    except RuntimeError as e:
        print("Database connection error:", e)

        return jsonify({
            "success": False,
            "error": "Unable to connect to the database. Please check your database credentials and connection details."
        }), 400

    except Exception as e:
        print("Unexpected database connection error:", e)

        return jsonify({
            "success": False,
            "error": "Unable to connect to the database. Please try again."
        }), 500

@app.route("/api/execute-query", methods=["POST"])
@require_auth
def execute_query():
    from session.session_db import get_database

    data = request.get_json(silent=True) or {}
    question = (data.get("text") or "").strip()

    if not question:
        return jsonify({"error": "No question provided."}), 400

    # -----------------------------------------
    # 1. Get the database connected for
    #    this login session
    # -----------------------------------------
    config = get_database(request.session_id)

    if not config:
        return jsonify({
            "error": "No database is connected. "
                     "Please connect a database first."
        }), 400

    # -----------------------------------------
    # 2. Read schema from the user's
    #    currently connected database
    # -----------------------------------------
    try:
        schema = get_schema_from_config(config)
    except Exception as e:
        return jsonify({
            "error": f"Could not read database schema: {e}"
        }), 500

    # -----------------------------------------
    # 3. Generate SQL using the schema
    # -----------------------------------------
    try:
        sql = llm.generate_sql(question, schema,config["db_type"])

    except Exception as e:
        print("\n========================================")
        print("              LLM ERROR")
        print("========================================")
        print("Error:", str(e))
        traceback.print_exc()
        print("========================================\n")

        return jsonify({
            "error": f"Could not generate SQL: {e}"
        }), 500

    # -----------------------------------------
    # 4. Handle schema-related questions
    # -----------------------------------------
    schema_error_text = (
        "Question cannot be answered with the available schema"
    )

    if schema_error_text.lower() in sql.lower():

        try:
            db.save_history(
                request.user_id,
                question,
                sql,
                0,
                "failed"
            )
        except Exception:
            pass

        return jsonify({
            "error": (
                "Question cannot be answered with the "
                "available schema."
            ),
            "sql": sql,
            "status": "failed",
            "columns": [],
            "rows": []
        }), 400

    # -----------------------------------------
    # 5. Safety check
    # -----------------------------------------
    if not is_safe_select(sql):

        try:
            db.save_history(
                request.user_id,
                question,
                sql,
                0,
                "failed"
            )
        except Exception:
            pass

        return jsonify({
            "error": (
                "The generated query wasn't a safe "
                "read-only SELECT statement, so it was blocked."
            ),
            "sql": sql,
            "status": "failed",
            "columns": [],
            "rows": []
        }), 400

    # -----------------------------------------
    # 6. Execute SQL on the USER'S connected DB
    # -----------------------------------------
    try:
        columns, rows = run_select_query_from_config(
            config,
            sql
        )
    except Exception as e:
        try:
            db.save_history(
                request.user_id,
                question,
                sql,
                0,
                "failed"
            )
        except Exception:
            pass

        return jsonify({
            "error": f"Database error: {e}",
            "sql": sql,
            "status": "failed",
            "columns": [],
            "rows": []
        }), 400

    # -----------------------------------------
    # 7. Save history in the APPLICATION DB
    # -----------------------------------------
    try:
        db.save_history(
            request.user_id,
            question,
            sql,
            len(rows),
            "success"
        )
    except Exception:
        pass

    # -----------------------------------------
    # 8. Return result to frontend
    # -----------------------------------------
    return jsonify({
        "sql": sql,
        "columns": columns,
        "rows": rows,
        "status": "success"
    })



@app.route("/api/history", methods=["GET"])
@require_auth
def history():
    try:
        return jsonify({"history": db.get_history(request.user_id)})
    except Exception as e:
        return jsonify({"history": [], "error": str(e)}), 500
    

@app.route("/api/tables", methods=["GET"])
@require_auth
def tables():

    from session.session_db import get_database

    try:
        config = get_database(request.session_id)

        if not config:
            return jsonify({
                "tables": [],
                "error": (
                    "No database is connected for this login session. "
                    "Please connect a database first."
                )
            }), 400

        schema = get_schema_from_config(config)

        return jsonify({
            "tables": schema
        }), 200

    except Exception as e:
        return jsonify({
            "tables": [],
            "error": f"Could not read tables: {e}"
        }), 500



@app.route("/api/tables/<table_name>", methods=["GET"])
@require_auth
def table_details(table_name):

    from session.session_db import get_database

    try:
        # Get the database connected for this login session
        config = get_database(request.session_id)

        if not config:
            return jsonify({
                "error": (
                    "No database is connected for this login session. "
                    "Please connect a database first."
                )
            }), 400

        connection = None
        cursor = None

        try:
            connection = get_connection_from_config(config)

            db_type = (
                config.get("db_type") or ""
            ).strip().lower()

            # PostgreSQL
            if db_type in ("postgresql", "postgres", "pg"):

                cursor = connection.cursor()

                cursor.execute("""
                    SELECT
                        column_name,
                        data_type,
                        is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = %s
                    ORDER BY ordinal_position
                """, (table_name,))

                rows = cursor.fetchall()

                columns = [
                    {
                        "name": row[0],
                        "type": row[1],
                        "nullable": row[2]
                    }
                    for row in rows
                ]

            # MySQL
            elif db_type == "mysql":

                cursor = connection.cursor()

                cursor.execute("""
                    SELECT
                        column_name,
                        data_type,
                        is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = %s
                      AND table_name = %s
                    ORDER BY ordinal_position
                """, (
                    config["database"],
                    table_name
                ))

                rows = cursor.fetchall()

                columns = [
                    {
                        "name": row[0],
                        "type": row[1],
                        "nullable": row[2]
                    }
                    for row in rows
                ]

            # Oracle
            elif db_type == "oracle":

                cursor = connection.cursor()

                cursor.execute("""
                    SELECT
                        column_name,
                        data_type,
                        nullable
                    FROM user_tab_columns
                    WHERE table_name = :table_name
                    ORDER BY column_id
                """, {
                    "table_name": table_name.upper()
                })

                rows = cursor.fetchall()

                columns = [
                    {
                        "name": row[0],
                        "type": row[1],
                        "nullable": row[2]
                    }
                    for row in rows
                ]

            else:
                return jsonify({
                    "error": "Unsupported database type."
                }), 400

            if not columns:
                return jsonify({
                    "error": "Table not found."
                }), 404

            return jsonify({
                "table": table_name,
                "columns": columns
            }), 200

        finally:
            if cursor:
                cursor.close()

            if connection:
                connection.close()

    except Exception as e:

        print("\n========================================")
        print("         TABLE DETAILS ERROR")
        print("========================================")
        print("Error:", str(e))
        traceback.print_exc()
        print("========================================\n")

        return jsonify({
            "error": f"Could not read table details: {e}"
        }), 500



@app.route("/api/analytics", methods=["GET"])
@require_auth
def analytics():
    try:
        data = db.get_analytics(request.user_id)
        return jsonify(data)

    except Exception as e:
        return jsonify(
            {
                "error": f"Could not load analytics: {e}"
            }
        ), 500


@app.route("/api/database-info", methods=["GET"])
@require_auth
def database_info():

    from session.session_db import get_database

    try:
        config = get_database(request.session_id)

        # No database connected for this login session
        if not config:
            return jsonify({
                "type": "Unknown",
                "name": "No database connected",
                "connected": False
            }), 200

        return jsonify({
            "type": config.get("db_type"),
            "name": config.get("database"),
            "connected": True
        }), 200

    except Exception as e:
        return jsonify({
            "type": "Unknown",
            "name": "Unknown",
            "connected": False,
            "error": str(e)
        }), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    db.init_history_table()
    app.run(port=5000, debug=True)
    
    
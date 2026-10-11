import secrets
import threading
import time


# Stores database credentials temporarily in server memory.
#
# Key:
#     session_id
#
# Value:
#     {
#         "database": database configuration,
#         "last_activity": timestamp
#     }
#
# Nothing is written to PostgreSQL, MySQL, Oracle,
# or the users/query_history tables.

_sessions = {}
_lock = threading.Lock()

# Database session timeout in seconds.
# 30 minutes.
SESSION_TIMEOUT = 30 * 60


def create_session():
    """
    Create a unique temporary session ID.
    """

    session_id = secrets.token_urlsafe(32)

    with _lock:
        _sessions[session_id] = {
            "database": None,
            "last_activity": time.time()
        }

    return session_id


def set_database(session_id, database_config):
    """
    Attach a database configuration to the current session.
    """

    with _lock:

        session = _sessions.get(session_id)

        if not session:
            raise RuntimeError("Invalid or expired session.")

        session["database"] = database_config
        session["last_activity"] = time.time()


def get_database(session_id):
    """
    Get the database configuration for the current session.

    The session automatically expires after SESSION_TIMEOUT
    seconds of inactivity.
    """

    with _lock:

        session = _sessions.get(session_id)

        if not session:
            return None

        # Check session expiration
        if time.time() - session["last_activity"] > SESSION_TIMEOUT:

            _sessions.pop(session_id, None)

            return None

        # Update activity timestamp
        session["last_activity"] = time.time()

        return session.get("database")
    
    
def clear_database(session_id):
    with _lock:
        session = _sessions.get(session_id)

        if not session:
            raise RuntimeError("Invalid or expired session.")

        session["database"] = None
        session["last_activity"] = time.time()


def remove_session(session_id):
    """
    Completely destroy the current session.
    """

    with _lock:
        _sessions.pop(session_id, None)
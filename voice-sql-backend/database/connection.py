import psycopg2
import pymysql
import oracledb


def test_connection(db_type, host, port, database, username, password):
    """
    Test a user's database connection.

    This function does NOT modify the user's database.
    It only opens a connection and closes it after testing.
    """

    db_type = (db_type or "").strip().lower()
    host = (host or "").strip()
    database = (database or "").strip()
    username = (username or "").strip()

    if not db_type:
        raise ValueError("Database type is required.")

    if not host:
        raise ValueError("Host is required.")

    if not database:
        raise ValueError("Database name is required.")

    if not username:
        raise ValueError("Username is required.")

    if not password:
        raise ValueError("Password is required.")

    try:

        # -------------------------
        # PostgreSQL
        # -------------------------
        if db_type in ("postgres", "postgresql"):

            connection = psycopg2.connect(
                host=host,
                port=int(port or 5432),
                dbname=database,
                user=username,
                password=password,
                connect_timeout=10,
            )

            connection.close()

            return {
                "success": True,
                "database_type": "PostgreSQL",
                "message": "PostgreSQL connection successful."
            }

        # -------------------------
        # MySQL
        # -------------------------
        elif db_type == "mysql":

            connection = pymysql.connect(
                host=host,
                port=int(port or 3306),
                database=database,
                user=username,
                password=password,
                connect_timeout=10,
            )

            connection.close()

            return {
                "success": True,
                "database_type": "MySQL",
                "message": "MySQL connection successful."
            }

        # -------------------------
        # Oracle
        # -------------------------
        elif db_type == "oracle":

            connection = oracledb.connect(
                user=username,
                password=password,
                dsn=f"{host}:{int(port or 1521)}/{database}",
            )

            connection.close()

            return {
                "success": True,
                "database_type": "Oracle",
                "message": "Oracle connection successful."
            }

        else:
            raise ValueError(
                "Unsupported database type. "
                "Supported types are PostgreSQL, MySQL, and Oracle."
            )

    except ValueError:
        raise

    except Exception as e:
        raise RuntimeError(
            f"Database connection failed: {str(e)}"
        )


def get_connection_from_config(config):
    """
    Create a database connection using the configuration
    stored for the current login session.

    This function does NOT use DATABASE_URL from .env.
    """

    if not config:
        raise RuntimeError("No database is connected for this session.")

    db_type = (config.get("db_type") or "").strip().lower()

    host = config.get("host")
    port = config.get("port")
    database = config.get("database")
    username = config.get("username")
    password = config.get("password")

    if not all([host, database, username, password]):
        raise ValueError("Incomplete database connection information.")

    # -------------------------
    # PostgreSQL
    # -------------------------
    if db_type in ("postgresql", "postgres", "pg"):

        return psycopg2.connect(
            host=host,
            port=int(port or 5432),
            dbname=database,
            user=username,
            password=password,
            connect_timeout=10,
        )

    # -------------------------
    # MySQL
    # -------------------------
    elif db_type == "mysql":

        return pymysql.connect(
            host=host,
            port=int(port or 3306),
            database=database,
            user=username,
            password=password,
            connect_timeout=10,
        )

    # -------------------------
    # Oracle
    # -------------------------
    elif db_type == "oracle":

        return oracledb.connect(
            user=username,
            password=password,
            dsn=f"{host}:{int(port or 1521)}/{database}",
        )

    else:
        raise ValueError(
            f"Unsupported database type: {db_type}"
        )
        
        

def get_schema_from_config(config):
    """
    Read the schema from the user's currently connected database.

    This function does NOT modify the database.
    """

    connection = None
    cursor = None

    try:
        connection = get_connection_from_config(config)

        db_type = (config.get("db_type") or "").strip().lower()

        # ==================================================
        # PostgreSQL
        # ==================================================
        if db_type in ("postgresql", "postgres", "pg"):

            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    table_name,
                    column_name,
                    data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
            """)

            rows = cursor.fetchall()

            schema = {}

            for table_name, column_name, data_type in rows:
                schema.setdefault(table_name, [])
                schema[table_name].append(
                    f"{column_name} ({data_type})"
                )

        # ==================================================
        # MySQL
        # ==================================================
        elif db_type == "mysql":

            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    table_name,
                    column_name,
                    data_type
                FROM information_schema.columns
                WHERE table_schema = %s
                ORDER BY table_name, ordinal_position
            """, (config["database"],))

            rows = cursor.fetchall()

            schema = {}

            for table_name, column_name, data_type in rows:
                schema.setdefault(table_name, [])
                schema[table_name].append(
                    f"{column_name} ({data_type})"
                )

        # ==================================================
        # Oracle
        # ==================================================
        elif db_type == "oracle":

            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    table_name,
                    column_name,
                    data_type
                FROM user_tab_columns
                ORDER BY table_name, column_id
            """)

            rows = cursor.fetchall()

            schema = {}

            for table_name, column_name, data_type in rows:
                schema.setdefault(table_name, [])
                schema[table_name].append(
                    f"{column_name} ({data_type})"
                )

        else:
            raise ValueError(
                f"Unsupported database type: {db_type}"
            )

        # --------------------------------------------------
        # Convert schema dictionary into text for the LLM
        # --------------------------------------------------

        if not schema:
            return "No tables were found in the connected database."

        schema_text = []

        for table_name, columns in schema.items():

            schema_text.append(
                f"Table: {table_name}\n"
                + "\n".join(
                    f"  - {column}"
                    for column in columns
                )
            )

        return "\n\n".join(schema_text)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
            
            
            
def run_select_query_from_config(config, sql):
    """
    Execute a read-only SELECT query on the user's
    currently connected database.

    This function does NOT use the application's DATABASE_URL.
    """

    if not sql or not sql.strip():
        raise ValueError("SQL query is required.")

    connection = None
    cursor = None

    try:
        connection = get_connection_from_config(config)

        cursor = connection.cursor()

        cursor.execute(sql)

        # Get column names
        if cursor.description:
            columns = [
                column[0]
                for column in cursor.description
            ]
        else:
            columns = []

        # Get rows
        rows = cursor.fetchall()

        return columns, rows

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
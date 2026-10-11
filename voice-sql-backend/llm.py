import os
import re
from groq import Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

PROMPT_TEMPLATE = """
You are an expert SQL developer.

The database type is:
{database_type}

Given the database schema below and the user's natural language
question, write a single read-only SQL SELECT query that answers it.

Schema:
{schema}

Rules:

- Output ONLY the SQL query.
- Do not output explanations.
- Do not use markdown formatting.
- Do not use code fences.
- Only generate a single SELECT statement.
- Never generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE,
  GRANT, REVOKE, CREATE, EXEC, EXECUTE, CALL, or any other
  statement that modifies data or schema.
- Do not generate multiple SQL statements.
- Only reference tables and columns that exist in the schema above.

DATABASE DIALECT:

- Generate SQL using the syntax appropriate for the specified
  database type.
- PostgreSQL: use PostgreSQL syntax.
- MySQL: use MySQL syntax.
- Oracle: use Oracle SQL syntax.
- Do not use PostgreSQL-specific syntax when the database type
  is MySQL or Oracle.
- Do not use MySQL-specific syntax when the database type is
  PostgreSQL or Oracle.
- Do not use Oracle-specific syntax when the database type is
  PostgreSQL or MySQL.

IMPORTANT TEXT MATCHING RULES:

- Text comparisons must be CASE-INSENSITIVE.
- The user's capitalization may be different from the
  capitalization stored in the database.
- Never assume that the user's capitalization exactly matches
  the capitalization stored in the database.

For PostgreSQL:

- For exact text comparisons, use LOWER() on both the column
  and the user's text value.
- For partial text searches, use ILIKE.

Example:

WHERE LOWER(department) = LOWER('computer science')

Partial search:

WHERE course_name ILIKE '%machine learning%'

For MySQL:

- Text comparisons should be case-insensitive.
- Use LOWER() for exact text comparisons when necessary.
- Use LOWER() with LIKE for reliable case-insensitive partial
  text matching.

Example:

WHERE LOWER(department) = LOWER('computer science')

Partial search:

WHERE LOWER(course_name) LIKE LOWER('%machine learning%')

For Oracle:

- Use LOWER() for exact text comparisons.
- Use LOWER() with LIKE for partial text matching.

Example:

WHERE LOWER(department) = LOWER('computer science')

Partial search:

WHERE LOWER(course_name) LIKE LOWER('%machine learning%')

These case-insensitive rules apply to text/varchar columns.

Do NOT apply LOWER() or text matching functions to numeric
columns such as integer, numeric, decimal, float, etc.

Preserve normal comparisons for numeric and date columns.

If the question cannot be answered with the given schema,
output exactly:

SELECT 'Question cannot be answered with the available schema' AS error;

Question:
{question}

SQL:
"""


def generate_sql(question, schema, database_type):
    """
    Generate a read-only SQL query for the specified database type.
    """

    if not GROQ_API_KEY or client is None:
        raise RuntimeError(
            "AI service is not configured. Please contact the administrator."
        )

    database_type = (database_type or "").strip().lower()

    if database_type in ("postgres", "postgresql", "pg"):
        database_type = "PostgreSQL"

    elif database_type == "mysql":
        database_type = "MySQL"

    elif database_type == "oracle":
        database_type = "Oracle"

    else:
        raise ValueError(
            "Unsupported database type for SQL generation."
        )

    prompt = PROMPT_TEMPLATE.format(
        database_type=database_type,
        schema=schema,
        question=question
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0,
            max_tokens=1024,
        )

        text = (
            response.choices[0].message.content or ""
        ).strip()

        if not text:
            raise RuntimeError("AI_EMPTY_RESPONSE")

        return _clean_sql(text)

    except RuntimeError:
        raise

    except Exception as e:
        error_text = str(e).lower()

        if (
            "429" in error_text
            or "rate limit" in error_text
            or "quota" in error_text
        ):
            raise RuntimeError("AI_REQUEST_LIMIT")

        raise RuntimeError("AI_SERVICE_ERROR")


def _clean_sql(text):
    """
    Remove accidental markdown code fences
    and trailing semicolons.
    """

    text = re.sub(
        r"^```(?:sql)?\s*",
        "",
        text.strip(),
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text.strip()
    )

    return text.strip().rstrip(";").strip()
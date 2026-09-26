import os
import re

from groq import Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

PROMPT_TEMPLATE = """You are a PostgreSQL expert. Given the database schema below and a 
user's natural language question, write a single read-only SQL SELECT query that 
answers it.

Schema:
{schema}

Rules:

- Output ONLY the SQL query. No explanations, no markdown formatting, no code fences.
- Only use SELECT statements. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, 
  or any other statement that modifies data or schema.
- Only reference tables and columns that exist in the schema above.
- Use standard PostgreSQL syntax.

IMPORTANT TEXT MATCHING RULES:

- Text comparisons must be CASE-INSENSITIVE.
- The user's capitalization may be different from the capitalization stored in the database.
- Never assume that the user's capitalization exactly matches the database value.
- For exact text comparisons, use LOWER() on both the column and the user's text value.
- Example:
  WHERE LOWER(department) = LOWER('computer science')
- For partial text searches, use ILIKE.
- Example:
  WHERE course_name ILIKE '%machine learning%'
- These case-insensitive rules apply to ALL text/varchar columns in ALL tables.
- Do NOT apply LOWER() or ILIKE to numeric columns such as integer, numeric, decimal, etc.
- Preserve normal comparisons for numeric and date columns.

Examples:

User question:
show courses from computer science

Correct SQL:
SELECT * FROM courses
WHERE LOWER(department) = LOWER('computer science');

User question:
SHOW COURSES FROM COMPUTER SCIENCE

Correct SQL:
SELECT * FROM courses
WHERE LOWER(department) = LOWER('computer science');

User question:
show machine learning course

Correct SQL:
SELECT * FROM courses
WHERE course_name ILIKE '%machine learning%';

If the question can't be answered with the given schema, output exactly:
SELECT 'Question cannot be answered with the available schema' AS error;

Question: {question}

SQL:"""


def generate_sql(question, schema):
    if not GROQ_API_KEY or client is None:
        raise RuntimeError(
            "AI service is not configured. Please contact the administrator."
        )

    prompt = PROMPT_TEMPLATE.format(
        schema=schema,
        question=question
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=1024,
        )

        text = (response.choices[0].message.content or "").strip()

        if not text:
            raise RuntimeError(
                "AI_EMPTY_RESPONSE"
            )

        return _clean_sql(text)

    except RuntimeError:
        # Re-raise our own deliberate errors (e.g. AI_EMPTY_RESPONSE) unchanged
        raise

    except Exception as e:
        error_text = str(e).lower()

        # -----------------------------------------
        # Groq rate limit / quota errors
        # -----------------------------------------
        if "429" in error_text or "rate limit" in error_text or "quota" in error_text:
            raise RuntimeError("AI_REQUEST_LIMIT")

        # -----------------------------------------
        # Other Groq/API errors
        # -----------------------------------------
        raise RuntimeError("AI_SERVICE_ERROR")



def _clean_sql(text):
    # Strip markdown code fences in case the model adds them anyway
    text = re.sub(r"^```(?:sql)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip().rstrip(";").strip()
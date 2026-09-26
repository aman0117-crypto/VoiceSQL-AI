<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=gradient&customColorList=12&text=VoiceSQL%20AI&fontAlign=50&fontAlignY=35&fontSize=42&fontColor=ffffff&animation=fadeIn&desc=An%20AI-powered%20Voice-to-SQL%20Query%20Generator&descAlignY=55&descSize=17" width="100%"/>
</div>

## 📌 Overview

VoiceSQL AI is a web-based Voice-to-SQL application designed to make database interaction easier through natural language.

Instead of manually writing SQL queries, users can simply type or speak a question in natural language. The system processes the input, generates an appropriate SQL query, executes it against the connected PostgreSQL database, and displays the results in an easy-to-understand interface.

---

## ✨ Features

- 🎙️ Voice-based query input
- 💬 Natural language query processing
- 🤖 AI-powered Text-to-SQL conversion
- 🗄️ PostgreSQL database integration
- 🔐 User authentication
- 📊 Query analytics
- 📝 Query history
- 📋 Generated SQL query display
- 📈 Database results visualization
- 🛡️ Read-only SQL query execution
- 🖥️ Interactive and responsive dashboard

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Web Speech API
- CSS

### Backend
- Python
- Flask
- PostgreSQL
- REST API

### AI
- AI-powered Natural Language to SQL conversion

### Authentication

- JWT-based authentication
- Google OAuth

---

## 🏗️ Project Structure

```text
VoiceSQL-AI/
│
├── voice-sql-backend/
│   ├── .env.example
│   ├── app.py
│   ├── db.py
│   ├── llm.py
│   ├── requirements.txt
│   └── README.md
│
├── voice-sql-frontend/
│   ├── .env.example
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── README.md
│
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

---

## 🔄 How It Works
```text

                User
                 │
        ┌────────┴────────┐
        │                 │
   Voice Input        Text Input
        │                 │
        └────────┬────────┘
                 │
                 ▼
            VoiceSQL AI
                 │
                 ▼
      AI Text-to-SQL Processing
                 │
                 ▼
            Generated SQL
                 │
                 ▼
           SQL Validation
                 │
                 ▼
         PostgreSQL Database
                 │
                 ▼
          Query Execution
                 │
                 ▼
           Query Results
                 │
                 ▼
             Dashboard
```

---
## Query Flow
- The user enters a question using text or voice.
- Voice input is converted into text using the Web Speech API.
- The natural-language question is processed by the AI system.
- The AI generates an SQL query based on the available database schema.
- The generated query is validated before execution.
- The validated query is executed against PostgreSQL.
- The database returns the requested results.
- VoiceSQL AI displays the generated SQL and query results to the user.
- The query can also be recorded in the query history for future reference.

---
## 🚀 Getting Started
Follow the steps below to run VoiceSQL AI on your local machine.

### Prerequisites

Make sure the following are installed on your system:

- Python 3.x
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository
`git clone https://github.com/aman0117-crypto/VoiceSQL-AI.git`

Navigate into the project directory:

`cd VoiceSQL-AI`

### 2. Backend Setup

Navigate to the backend directory:

`cd voice-sql-backend`

Create a Python virtual environment:

`python -m venv venv`

Activate the Virtual Environment:

Windows

`venv\Scripts\activate`

macOS / Linux

`source venv/bin/activate`

Install the required Python dependencies:

`pip install -r requirements.txt`

### 3. Configure Backend Environment Variables

Create a `.env` file inside the voice-sql-backend directory.

Use the provided `.env.example` file as a reference.

```text
DATABASE_URL=
GROQ_API_KEY=
GROQ_MODEL=
JWT_SECRET_KEY=
GOOGLE_CLIENT_ID=
```

Add your own configuration values to the `.env` file.

### 4. Configure PostgreSQL

Make sure PostgreSQL is installed and running.

Create the database required by the application and configure the database connection using the DATABASE_URL environment variable.

Example:

```DATABASE_URL=your_database_connection_string```

The exact database configuration may depend on your local PostgreSQL setup.

### 5. Start the Backend

From the voice-sql-backend directory, run:

```python app.py```

The Flask backend will start on the configured local port.

### 6. Frontend Setup

Open a new terminal.

Navigate to the project directory:

```cd VoiceSQL-AI```

Then navigate to the frontend:

```cd voice-sql-frontend```

Install the required dependencies:

```npm install```

### 7. Configure Frontend Environment Variables

Create a .env file inside the voice-sql-frontend directory.

Use the provided .env.example file as a reference:

```VITE_GOOGLE_CLIENT_ID=```

Add your Google OAuth client ID.

### 8. Start the Frontend

Run:

```npm run dev```

Vite will provide a local development URL in the terminal.

Open the provided URL in your browser to access VoiceSQL AI.

---
## 🔐 Security

VoiceSQL AI is designed to restrict database operations to read-only queries.

The application validates generated SQL queries before sending them to the database and prevents potentially destructive SQL operations such as:

- INSERT
- UPDATE
- DELETE
- DROP
- ALTER
- TRUNCATE
- GRANT
- REVOKE
- CREATE
- EXEC
- EXECUTE
- CALL

Environment variables are also excluded from the Git repository using ```.gitignore```

The repository contains ```.env.example``` files instead of actual credentials.

---

## 📊 Dashboard

The VoiceSQL AI dashboard provides users with a centralized interface for interacting with the database.

It includes functionality such as:

- Natural language query input
- Voice query input
- Generated SQL display
- Query results
- Query history
- Database information
- Analytics
- Application navigation

---
## 📝 Query History

VoiceSQL AI maintains a history of executed queries.

The query history can include information such as:

- User question
- Generated SQL query
- Number of returned rows
- Query status
- Date and time

This allows users to review previously executed queries.

----
## 📈 Analytics

The analytics section provides insights into query activity.

It can display information such as:

- Total queries
- Recent query activity
- Successful queries
- Frequently used tables
- Query complexity

This helps users understand how the application is being used.

---
## 🤖 AI-Powered Text-to-SQL

The core functionality of VoiceSQL AI is Natural Language to SQL conversion.

For example, a user can ask:

```text
How many employees work in the HR department?
```

The system can generate an SQL query similar to:

```text
SELECT COUNT(*)
FROM employees
WHERE department = 'HR';
```

The generated SQL is then validated and executed against the PostgreSQL database.

---
## 🎙️ Voice Interaction

VoiceSQL AI supports voice-based database interaction using the browser's Web Speech API.

The general process is:

```text
Voice
  ↓
Speech Recognition
  ↓
Text
  ↓
AI Text-to-SQL
  ↓
SQL Query
  ↓
PostgreSQL
  ↓
Results
```

This allows users to interact with the database without manually typing SQL queries.

---
## 🔮 Future Development

The current version of VoiceSQL AI uses an AI-based approach for Natural Language to SQL conversion.

Future development will focus on building and integrating a custom NLP model for Text-to-SQL conversion.

Planned Improvements
- 🧠 Custom NLP-based Text-to-SQL model
- 🔍 Improved query interpretation
- 📚 Training and evaluation of the custom NLP model
- 📊 Model performance analysis
- 🗄️ Support for additional database systems
- ⚡ Improved query processing performance

---
## 🔒 Environment Files

For security reasons, actual environment files are not included in this repository.

The project provides:

```voice-sql-backend/.env.example```

```voice-sql-frontend/.env.example```

These files show the environment variables required to configure the application.

---
## 📌 Project Status
Current Version

The current version provides:

- Voice input
- Text input
- AI-powered Text-to-SQL conversion
- PostgreSQL integration
- Query execution
- Authentication
- Query history
- Analytics
- Dashboard interface

### Future Version

The project will explore a custom NLP model for Text-to-SQL conversion as a future development phase.

---
## 📬 Contact & Support

If you encounter any issues, bugs, or have questions regarding VoiceSQL AI, feel free to get in touch.

For technical issues or project-related queries, you can contact:

**Aman Gupta**

- 📧 Email: amang954817@gmail.com
- 💼 LinkedIn: www.linkedin.com/in/aman-gupta-0474122b8
- 🐙 GitHub: https://github.com/aman0117-crypto

---
## 📄 License

This project is developed as an academic project.

<br/>

<div align="center">

### If you find my projects interesting, consider giving them a ⭐.

### 🚀 Keep Building. Keep Learning. Keep Growing.

</div>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=12&section=footer" width="100%"/>

</div>
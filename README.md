# VoiceSQL AI

> AI-powered Voice-to-SQL query generator that converts natural language and voice commands into SQL queries and delivers database results through an intuitive web interface.

## 📌 Overview

VoiceSQL AI is a web-based Voice-to-SQL application designed to make database interaction easier through natural language.

Instead of manually writing SQL queries, users can simply type or speak a question in natural language. The system processes the input, generates an appropriate SQL query, executes it against the connected PostgreSQL database, and displays the results in an easy-to-understand interface.

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
-- =====================================================
-- VoiceSQL AI — Database Schema
-- Run this once against a fresh PostgreSQL database to
-- set up everything the app needs, plus sample data.
--
-- Usage:
--   psql "your_database_url_here" -f schema.sql
-- =====================================================

-- =====================================================
-- APP-INTERNAL TABLES (required — do not rename)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    password_hash     TEXT,
    google_id         TEXT,
    profile_picture   TEXT,
    auth_provider     TEXT NOT NULL DEFAULT 'local',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_history (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    sql         TEXT NOT NULL,
    row_count   INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'success',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);

-- =====================================================
-- SAMPLE BUSINESS DATA (safe to remove/replace with your own)
-- =====================================================

CREATE TABLE IF NOT EXISTS department (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    department_id   INTEGER REFERENCES department(id),
    salary          NUMERIC(10, 2) NOT NULL,
    hire_date       DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Seed departments
INSERT INTO department (name) VALUES
    ('HR'),
    ('Engineering'),
    ('Sales'),
    ('Marketing')
ON CONFLICT (name) DO NOTHING;

-- Seed employees
INSERT INTO employees (name, department_id, salary, hire_date) VALUES
    ('Aman Gupta',      (SELECT id FROM department WHERE name = 'Engineering'), 95000, '2022-03-01'),
    ('Priya Sharma',    (SELECT id FROM department WHERE name = 'HR'),          62000, '2021-07-15'),
    ('Rohit Verma',     (SELECT id FROM department WHERE name = 'Sales'),       71000, '2023-01-10'),
    ('Sneha Kapoor',    (SELECT id FROM department WHERE name = 'Marketing'),   68000, '2020-11-20'),
    ('Karan Mehta',     (SELECT id FROM department WHERE name = 'Engineering'), 105000, '2019-05-05')
ON CONFLICT DO NOTHING;

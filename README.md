# 🎓 Student Expense AI (Supabase Cloud Edition)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud_PostgreSQL-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-FF6B6B.svg?style=flat&logo=ollama&logoColor=white)](https://ollama.com/)
[![Gemma](https://img.shields.io/badge/Gemma-Open--Weight_LLM-4285F4.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Student Expense AI** is a real-world personal finance application engineered for college students. It connects a **FastAPI backend** to a **Supabase Cloud PostgreSQL database** with secure **JWT student authentication** and a modern **React 19 glassmorphism frontend**, paired with **local, on-device Google Gemma open-weight AI** via **Ollama**.

- **No Local Database Setup**: Runs directly against your remote Supabase PostgreSQL cloud instance.
- **Zero Hardcoded Data**: Expenses, budgets, and insights are 100% tied to the authenticated user. New users start with a clean slate.
- **100% AI Privacy**: Financial prompts and contextual calculations are processed locally by Ollama. No financial numbers are ever sent to commercial cloud LLMs.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Features](#-key-features)
- [Real-World User Authentication & Multi-Tenancy](#-real-world-user-authentication--multi-tenancy)
- [Supabase Cloud PostgreSQL Integration](#-supabase-cloud-postgresql-integration)
- [Technology Stack](#-technology-stack)
- [Setup & Installation](#-setup--installation)
  - [1. Supabase PostgreSQL Configuration](#1-supabase-postgresql-configuration)
  - [2. Local Ollama & Gemma Setup](#2-local-ollama--gemma-setup)
  - [3. Backend Launch](#3-backend-launch)
  - [4. Frontend Launch](#4-frontend-launch)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🏛️ Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT 19 FRONTEND (Vite)                       │
│  - JWT Bearer Interceptors & Reactive AuthContext                      │
│  - Responsive Layout (Desktop Sidebar / Tablet Compact / Mobile Nav)   │
│  - High-Contrast Light/Dark Themes & Layered Glassmorphism             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON (Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND (Python)                        │
│  - JWT Authentication & Bcrypt Password Hashing                        │
│  - User-Scoped Queries (Strict Tenant Isolation)                       │
│  - Grounded Context Builder (No AI Hallucinations)                     │
│  - Heuristic Fallback Engine for Offline Resiliency                    │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       SUPABASE POSTGRESQL CLOUD      │  │     OLLAMA ENGINE (Local)    │
│  - Remote Managed PostgreSQL Engine  │  │  - Gemma Open-Weight Model   │
│  - users, expenses, budgets Tables   │  │  - 100% Private Local Model │
│  - Foreign Key Relational Integrity  │  │  - Zero Financial Leakage    │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🔐 Real-World User Authentication & Multi-Tenancy

Every piece of data is isolated to the authenticated student account:
1. **Sign Up & Sign In**: Students create an account or sign in using their campus email and password via `POST /api/auth/register` and `POST /api/auth/login`.
2. **User-Scoped Expenses**: When a student logs in, all queries (`GET /api/expenses`, `/api/budget`, `/api/analytics`, `/api/ai/*`) are strictly filtered to `Expense.user_id == current_user.id`.
3. **No Mock or Seed Data**: There are zero hardcoded transactions. When a new user logs in, they see a clean dashboard with helpful empty states prompting them to record their real spending.
4. **Session Persistence**: JWT access tokens are safely managed in `localStorage` and automatically injected into the `Authorization: Bearer <token>` header of every outgoing Axios request.

---

## ☁️ Supabase Cloud PostgreSQL Integration

The backend connects directly to Supabase via its high-performance transaction/session pooler:
```
postgresql://postgres.[project-ref]:[url-encoded-password]@aws-0-[region].pooler.supabase.com:5432/postgres
```
- **Tables**: `users`, `expenses`, and `budgets` are automatically provisioned and linked via Foreign Keys.
- **Port 5432 / 6543**: Compatible with both direct session queries and Supavisor connection pooling.

---

## ✨ Key Features

1. **User Authentication Modal & Profile**:
   - Seamless one-click modal supporting Sign In and Account Registration.
   - Profile avatar and Logout action in both top header and sidebar.
2. **Local Gemma AI Assistant (`/ai-assistant`)**:
   - Conversational glassmorphism chat grounded in the logged-in user's database records.
   - Answers questions like *"Where did I spend the most?"*, *"Can I afford ₹500 today?"*, *"How can I save ₹1000?"*.
3. **AI Natural Language Input**:
   - Parses statements like *"Spent 180 on canteen lunch today using UPI"* into structured JSON.
   - Human confirmation modal before committing to Supabase.
4. **Receipt OCR Scanner**:
   - Drag-and-drop receipt image scanner extracting merchant, date, amount, and category with confirmation before saving.
5. **Dynamic Budget Management (`/budget`)**:
   - Set monthly targets and individual category limits.
   - Color-coded progress bars (Safe, Warning, Near Limit, Over Budget).
6. **Automated AI Insights**:
   - Real-time spending trajectory analysis on the Dashboard based on real transactions.
7. **CSV Import & Export**:
   - Bulk upload bank statements or download filtered records for spreadsheet analysis.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PyJWT, Bcrypt |
| **Database** | Supabase Cloud PostgreSQL 18 |
| **Local AI** | Ollama, Google Gemma (`gemma3` / `gemma:2b`) |

---

## 🚀 Setup & Installation

### 1. Supabase PostgreSQL Configuration

1. Set your Supabase connection string in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres.lmqfbwuligaclifdzsds:Kaman%40123%40456@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   SECRET_KEY=student_expense_ai_super_secret_jwt_key_2026
   ```
2. No local PostgreSQL database installation is required!

---

### 2. Local Ollama & Gemma Setup

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull the model:
   ```bash
   ollama pull gemma3
   ```
   *(Or `ollama pull gemma:2b` for lightweight hardware)*.

---

### 3. Backend Launch

```bash
cd student-expense-ai/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

### 4. Frontend Launch

```bash
cd student-expense-ai/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new student account in Supabase |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Fetch active user profile |

### 💰 Expenses (`/api/expenses`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses` | List expenses for authenticated user |
| `POST` | `/api/expenses` | Add new expense tied to user |
| `PUT` | `/api/expenses/{id}` | Update expense |
| `DELETE` | `/api/expenses/{id}` | Delete expense |
| `GET` | `/api/expenses/recurring` | List recurring subscriptions |
| `GET` | `/api/expenses/export-csv` | Download user expenses as CSV |
| `POST` | `/api/expenses/import-csv` | Bulk upload CSV expenses |

### 🎯 Budget (`/api/budget`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budget` | Fetch monthly budget and live category utilization |
| `POST` | `/api/budget` | Create/override monthly budget |
| `PUT` | `/api/budget` | Update budget limits |
| `PUT` | `/api/budget/category/{cat}` | Update single category quota |

### 🧠 Local AI (`/api/ai`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Conversational financial advice grounded in user's data |
| `POST` | `/api/ai/categorize-expense` | Classify expense into 9 student categories |
| `POST` | `/api/ai/parse-natural` | Parse natural language spending statement |
| `GET` | `/api/ai/insights` | Data-driven financial alerts for user |
| `POST` | `/api/ai/ocr-receipt` | Extract structured details from receipt image |

---

## 📄 License

MIT License. Open for educational and personal finance tracking.

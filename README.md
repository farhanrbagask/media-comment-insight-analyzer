# Social Media Comment Insight Analyzer

A single-user web application that fetches comments from Instagram/TikTok post URLs and runs AI-powered sentiment, topic, and keyword analysis.

## Architecture

```
React Frontend (port 5173)
    ↓
Node.js + Express REST API (port 3001)
    ↓
Python + FastAPI ML Service (port 8000)
    ↓
PostgreSQL Database
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE insight_analyzer;"

# Run migrations
cd backend
npm run migrate
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # Edit .env with your DB credentials and secrets
npm install
npm run dev                # Runs on port 3001
```

### 3. ML Service

```bash
cd ml-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> ⚠️ First run downloads ~500MB of NLP model weights. Ensure stable internet connection.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev               # Runs on port 5173
```

Open **http://localhost:5173** and login with the password set in `backend/.env`.

---

## Development Mode (Mock Data)

Set `USE_MOCK_SERVICE=true` in `backend/.env` to use realistic fake data instead of real API calls. This allows full development and testing without Instagram/TikTok API credentials.

---

## API Credentials

### Instagram Graph API
1. Create an app at https://developers.facebook.com/
2. Add Instagram product
3. Get a long-lived User Access Token
4. Set `IG_ACCESS_TOKEN` and `IG_USER_ID` in `backend/.env`

### TikTok Research API
1. Apply at https://developers.tiktok.com/
2. Request Research API access (approval required)
3. Set `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` in `backend/.env`

---

## Environment Variables

See `backend/.env.example` for all required and optional variables.

---

## Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend    | React 19, Vite, TypeScript           |
| Styling     | Vanilla CSS with CSS variables       |
| State       | Zustand + React Query                |
| Charts      | Recharts                             |
| Backend     | Node.js, Express.js                  |
| Database    | PostgreSQL (raw SQL, no ORM)         |
| ML Service  | Python, FastAPI, Uvicorn             |
| NLP         | IndoBERT, BERTopic, TF-IDF          |
| Auth        | JWT (single admin password)          |

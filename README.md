# AI Reading Companion 📚🤖

An intelligent personal reading companion that helps you track books, capture notes, and discover your next great read — powered by AI.

## Features

- **📖 Book Library** — Add books (including EPUB/PDF upload), track reading status, manage your digital bookshelf
- **📝 Smart Notes** — Capture notes with page references, organize by book
- **🧠 AI Summaries** — Generate book summaries and extract key insights with AI
- **🎯 Recommendations** — Get personalized book recommendations based on your reading history
- **🔐 User Accounts** — JWT-based authentication, each user has their own private library

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Express 4 (Node.js) |
| Database | SQLite (sql.js) |
| Auth | JWT + bcryptjs |
| AI | OpenAI / DeepSeek API |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone and enter project
git clone https://github.com/Aka-xiaosheng/ai-reading-companion.git
cd ai-reading-companion

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET for production

# 3. Install & start backend
cd backend
npm install
npm start          # → http://localhost:3005

# 4. Install & start frontend (new terminal)
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT token |
| GET | `/api/auth/me` | Yes | Get current user info |
| GET | `/api/books` | Yes | List user's books (filter: `?status=reading`) |
| GET | `/api/books/:id` | Yes | Get book details + notes count + summary |
| POST | `/api/books` | Yes | Add a new book (supports multipart EPUB/PDF upload) |
| PUT | `/api/books/:id` | Yes | Update book info |
| DELETE | `/api/books/:id` | Yes | Delete a book |
| GET | `/api/books/:id/notes` | Yes | Get notes for a book |
| POST | `/api/books/:id/notes` | Yes | Add a note |
| PUT | `/api/notes/:id` | Yes | Update a note |
| DELETE | `/api/notes/:id` | Yes | Delete a note |
| POST | `/api/books/:id/summarize` | Yes | Generate AI summary |
| GET | `/api/books/recommendations` | Yes | Get AI book recommendations |
| GET | `/api/ai-search?q=书名` | Yes | AI-powered book search |
| GET | `/api/health` | No | Health check |

## Deployment

### Architecture

```
┌──────────────┐     HTTPS      ┌──────────────────┐
│  Vercel      │ ─────────────> │  Railway         │
│  React SPA   │                │  Express + SQLite│
│  (CDN)       │ <───────────── │  (Persistent Vol)│
└──────────────┘     JSON       └──────────────────┘
```

### Prerequisites

- GitHub account (to connect Vercel & Railway)
- [Vercel](https://vercel.com) account (Hobby, free)
- [Railway](https://railway.app) account (free tier)

### Backend (Railway)

1. **Fork/clone** this repo to your GitHub
2. **Create Railway project**:
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select the repo, set **Root Directory** to `backend/`
   - Add a **Volume** (0.5 GB free) mounted at `/data`
3. **Set environment variables** in Railway dashboard:

   | Variable | Value |
   |----------|-------|
   | `PORT` | `3005` |
   | `DATABASE_PATH` | `/data/reading.db` |
   | `CORS_ORIGIN` | `https://<vercel-app>.vercel.app` (set after frontend deploy) |
   | `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `OPENAI_API_KEY` | `sk-...` (optional) |
   | `DEEPSEEK_API_KEY` | `sk-...` (optional) |
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |

4. Railway auto-deploys — **note the URL** (e.g., `https://ai-reading.up.railway.app`)

### Frontend (Vercel)

1. **Create Vercel project**:
   - Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
   - Set **Root Directory** to `frontend/`
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Set environment variable** in Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://<railway-app>.up.railway.app/api` |

3. Redeploy to pick up the env var
4. **Update `CORS_ORIGIN`** on Railway to match your Vercel domain, then redeploy Railway

### Post-Deployment Verification

1. Visit your Vercel URL — you should see the login page
2. Register a test account
3. Add a book — verify CRUD works
4. Check `https://<railway-app>.up.railway.app/api/health` — should return `{"status":"ok"}`

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3005` | Backend server port |
| `DATABASE_PATH` | No | `backend/reading.db` | SQLite database file path |
| `CORS_ORIGIN` | Production | (any origin) | Frontend URL for CORS |
| `JWT_SECRET` | **Production** | `dev-secret-...` | JWT signing secret (min 32 chars) |
| `OPENAI_API_KEY` | No | — | OpenAI key for AI summaries |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek key for AI book search |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | DeepSeek API endpoint |
| `VITE_API_URL` | Production | `/api` | Backend API URL (frontend only) |

## License

MIT

# AI Reading Companion 📚🤖

An intelligent personal reading companion that helps you track books, capture notes, and discover your next great read — powered by AI.

## Features

- **📖 Book Library** — Add books, track reading status (Want to Read / Reading / Finished), rate them
- **📝 Smart Notes** — Capture notes, highlights, and chapter-by-chapter reflections
- **🧠 AI Summaries** — Generate concise book summaries and extract key insights with AI
- **🎯 Recommendations** — Get personalized book recommendations based on your reading history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router |
| Backend | Express 4 (Node.js) |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI / Anthropic API |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone and enter project
cd ai-reading-companion

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env — add your AI API key

# 3. Install & start backend
cd backend
npm install
npm start          # → http://localhost:3001

# 4. Install & start frontend (new terminal)
cd frontend
npm install
npm start          # → http://localhost:3000
```

### API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List all books (filter: `?status=reading`) |
| GET | `/api/books/:id` | Get book details |
| POST | `/api/books` | Add a new book |
| PUT | `/api/books/:id` | Update book info |
| DELETE | `/api/books/:id` | Delete a book |
| GET | `/api/books/:id/notes` | Get notes for a book |
| POST | `/api/books/:id/notes` | Add a note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |
| POST | `/api/books/:id/summarize` | Generate AI summary |
| GET | `/api/recommendations` | Get AI book recommendations |

## License

MIT

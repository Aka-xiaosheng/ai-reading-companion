require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const booksRouter = require('./routes/books');
const notesRouter = require('./routes/notes');
const aiSearchRouter = require('./routes/ai-search');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (CORS_ORIGIN) {
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
} else {
  app.use(cors());
}
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api', notesRouter);
app.use('/api', aiSearchRouter);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'AI Reading Companion API',
    version: '1.0.0',
    docs: 'http://localhost:3000',
    endpoints: {
      health: 'GET /api/health',
      books: 'GET /api/books',
      search: 'GET /api/ai-search?q=书名',
      recommendations: 'GET /api/books/recommendations',
    },
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
async function start() {
  // Ensure uploads directory exists
  const fs = require('fs');
  const uploadsDir = require('path').join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await initDb(process.env.DATABASE_PATH);

  app.listen(PORT, () => {
    console.log(`[server] AI Reading Companion API v1.0.0`);
    console.log(`[server] listening on port ${PORT}`);
    console.log(`[server] database: ${process.env.DATABASE_PATH || 'backend/reading.db'}`);
    console.log(`[server] CORS origin: ${CORS_ORIGIN || '(any — dev mode)'}`);
    console.log(`[server] JWT secret: ${process.env.JWT_SECRET ? '***configured***' : 'WARNING: using dev fallback'}`);
    console.log(`[server] AI keys: OpenAI=${process.env.OPENAI_API_KEY ? 'yes' : 'no'}, DeepSeek=${process.env.DEEPSEEK_API_KEY ? 'yes' : 'no'}`);
  });
}

start();

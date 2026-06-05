require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const booksRouter = require('./routes/books');
const notesRouter = require('./routes/notes');
const aiSearchRouter = require('./routes/ai-search');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
  await initDb(process.env.DATABASE_PATH);
  app.listen(PORT, () => {
    console.log(`[server] running on http://localhost:${PORT}`);
  });
}

start();

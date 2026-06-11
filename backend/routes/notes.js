const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

// ---- all note routes require authentication ----
router.use(authMiddleware);

// GET /api/books/:bookId/notes — all notes for a book (optional ?page=N filter)
router.get('/books/:bookId/notes', (req, res, next) => {
  try {
    const { queryOne, queryAll } = getDb();

    const book = queryOne(
      'SELECT id FROM books WHERE id = ? AND user_id = ?',
      [req.params.bookId, req.userId]
    );
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { page } = req.query;
    let sql = 'SELECT * FROM notes WHERE book_id = ? AND user_id = ?';
    const params = [req.params.bookId, req.userId];
    if (page !== undefined) {
      sql += ' AND page_number = ?';
      params.push(Number(page));
    }
    sql += ' ORDER BY created_at DESC';

    const notes = queryAll(sql, params);
    res.json({ data: notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/books/:bookId/notes — create note
router.post('/books/:bookId/notes', (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();

    const book = queryOne(
      'SELECT id FROM books WHERE id = ? AND user_id = ?',
      [req.params.bookId, req.userId]
    );
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { content, page_number } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = run(
      'INSERT INTO notes (book_id, content, page_number, user_id) VALUES (?, ?, ?, ?)',
      [req.params.bookId, content, page_number || null, req.userId]
    );
    save();

    const note = queryOne('SELECT * FROM notes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: note });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id — update note
router.put('/notes/:id', (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();

    const existing = queryOne(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { content, page_number } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (page_number !== undefined) {
      run(
        'UPDATE notes SET content = ?, page_number = ? WHERE id = ? AND user_id = ?',
        [content, page_number, req.params.id, req.userId]
      );
    } else {
      run(
        'UPDATE notes SET content = ? WHERE id = ? AND user_id = ?',
        [content, req.params.id, req.userId]
      );
    }
    save();

    const updated = queryOne('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id — delete note
router.delete('/notes/:id', (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();

    const existing = queryOne(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    save();

    res.json({ data: { message: 'Note deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

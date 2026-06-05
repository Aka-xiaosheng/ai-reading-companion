const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/books/:bookId/notes — all notes for a book
router.get('/books/:bookId/notes', (req, res, next) => {
  try {
    const { queryOne, queryAll } = getDb();

    const book = queryOne('SELECT id FROM books WHERE id = ?', [req.params.bookId]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const notes = queryAll(
      'SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC',
      [req.params.bookId]
    );

    res.json({ data: notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/books/:bookId/notes — create note
router.post('/books/:bookId/notes', (req, res, next) => {
  try {
    const { queryOne, queryAll, run, save } = getDb();

    const book = queryOne('SELECT id FROM books WHERE id = ?', [req.params.bookId]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = run(
      'INSERT INTO notes (book_id, content) VALUES (?, ?)',
      [req.params.bookId, content]
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
    const { queryOne, queryAll, run, save } = getDb();

    const existing = queryOne('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    run('UPDATE notes SET content = ? WHERE id = ?', [content, req.params.id]);
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
    const { queryOne, queryAll, run, save } = getDb();

    const existing = queryOne('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    run('DELETE FROM notes WHERE id = ?', [req.params.id]);
    save();

    res.json({ data: { message: 'Note deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

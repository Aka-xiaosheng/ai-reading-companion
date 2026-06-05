const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDb } = require('../database');

// ---- multer config ----
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // safe filename: timestamp + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, safe);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.epub' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('仅支持 EPUB 和 PDF 格式'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ---- helper: delete old file ----
function removeUpload(filePath) {
  if (!filePath) return;
  // filePath is relative to uploads dir, e.g. "1717700000000-abc123.pdf"
  const full = path.join(UPLOADS_DIR, filePath);
  try { if (fs.existsSync(full)) fs.unlinkSync(full); } catch { /* ignore */ }
}

// ---- helper: build file URL ----
function fileUrl(req, filePath) {
  if (!filePath) return null;
  return `/api/books/file/${encodeURIComponent(filePath)}`;
}

// ======================== ROUTES ========================

// GET /api/books — list all books, optional ?status= filter
router.get('/', (req, res, next) => {
  try {
    const { queryAll } = getDb();
    const { status } = req.query;

    let sql = 'SELECT * FROM books';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY updated_at DESC';

    const books = queryAll(sql, params);
    res.json({ data: books });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/recommendations — AI book recommendations (must be before /:id)
router.get('/recommendations', async (req, res, next) => {
  try {
    const { queryAll } = getDb();

    const books = queryAll(
      "SELECT * FROM books WHERE status IN ('reading', 'finished') ORDER BY updated_at DESC"
    );

    if (books.length === 0) {
      return res.json({
        data: { recommendations: [], message: '请先添加并阅读一些书籍，系统需要阅读历史来生成推荐。' }
      });
    }

    const booksWithNotes = [];
    for (const b of books) {
      const notes = queryAll(
        'SELECT content FROM notes WHERE book_id = ? ORDER BY created_at DESC LIMIT 3',
        [b.id]
      );
      booksWithNotes.push({
        title: b.title,
        author: b.author,
        status: b.status,
        notes: notes.map(n => n.content),
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-your-')) {
      return res.status(400).json({
        error: '未配置 OpenAI API Key',
        hint: '请在项目根目录的 .env 文件中设置 OPENAI_API_KEY=sk-xxxx'
      });
    }

    const profile = booksWithNotes.map((b, i) =>
      `${i + 1}. 《${b.title}》— ${b.author}（${b.status === 'finished' ? '已读完' : '在读'}）` +
      (b.notes.length > 0 ? `\n   笔记关键词：${b.notes.join('；')}` : '')
    ).join('\n\n');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `你是一位资深图书管理员和阅读推荐专家。根据读者的阅读历史和笔记，推荐 3 本他们可能会喜欢的书。
请严格按以下 JSON 格式输出，不要包含任何其他内容：
{
  "recommendations": [
    {"title": "书名", "author": "作者", "reason": "推荐理由（一句话，50字以内）"}
  ]
}`
        },
        {
          role: 'user',
          content: `这是我的阅读历史：
${profile}

请根据我的阅读偏好，推荐 3 本类似主题或风格的书。`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return res.json({
            data: { recommendations: [], raw, message: 'AI 返回格式异常，请重试' }
          });
        }
      } else {
        return res.json({
          data: { recommendations: [], raw, message: 'AI 返回格式异常，请重试' }
        });
      }
    }

    const recs = parsed.recommendations || [];
    res.json({
      data: {
        recommendations: recs,
        based_on: booksWithNotes.length,
        model: 'gpt-3.5-turbo',
      }
    });
  } catch (err) {
    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(400).json({
        error: 'OpenAI API Key 无效',
        hint: '请检查 .env 中的 OPENAI_API_KEY 是否正确'
      });
    }
    next(err);
  }
});

// GET /api/books/file/:filename — serve uploaded ebook file
router.get('/file/:filename', (req, res, next) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id — single book + notes count + summary
router.get('/:id', (req, res, next) => {
  try {
    const { queryOne, queryAll } = getDb();
    const book = queryOne('SELECT * FROM books WHERE id = ?', [req.params.id]);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const notesCount = queryAll(
      'SELECT COUNT(*) AS count FROM notes WHERE book_id = ?', [req.params.id]
    )[0]?.count ?? 0;

    const summary = queryOne(
      'SELECT * FROM summaries WHERE book_id = ?', [req.params.id]
    );

    res.json({
      data: {
        ...book,
        notes_count: notesCount,
        summary: summary || null,
        file_url: book.file_path ? `/api/books/file/${encodeURIComponent(book.file_path)}` : null,
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/books — create book (JSON or multipart with optional ebook file)
router.post('/', upload.single('file'), (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();

    // req.body may come from JSON or multipart
    const { title, author, cover_url, total_pages, status } = req.body;

    if (!title || !author) {
      // clean up uploaded file if validation fails
      if (req.file) removeUpload(req.file.filename);
      return res.status(400).json({ error: 'title and author are required' });
    }

    const filePath = req.file ? req.file.filename : null;
    const fileType = req.file ? path.extname(req.file.originalname).toLowerCase().replace('.', '') : null;

    const result = run(
      `INSERT INTO books (title, author, cover_url, total_pages, current_page, status, file_path, file_type)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        title,
        author,
        cover_url || null,
        total_pages || null,
        status || 'want_to_read',
        filePath,
        fileType,
      ]
    );
    save();

    const book = queryOne('SELECT * FROM books WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: book });
  } catch (err) {
    if (req.file) removeUpload(req.file.filename);
    next(err);
  }
});

// PUT /api/books/:id — update book (JSON or multipart with optional ebook file)
router.put('/:id', upload.single('file'), (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();
    const existing = queryOne('SELECT * FROM books WHERE id = ?', [req.params.id]);

    if (!existing) {
      if (req.file) removeUpload(req.file.filename);
      return res.status(404).json({ error: 'Book not found' });
    }

    const { title, author, cover_url, total_pages, current_page, status } = req.body;

    // File handling: if new file uploaded, remove old one
    let filePath = existing.file_path;
    let fileType = existing.file_type;
    if (req.file) {
      removeUpload(existing.file_path); // delete old file
      filePath = req.file.filename;
      fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    }

    run(
      `UPDATE books
       SET title = ?, author = ?, cover_url = ?,
           total_pages = ?, current_page = ?, status = ?,
           file_path = ?, file_type = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        title ?? existing.title,
        author ?? existing.author,
        cover_url !== undefined ? cover_url : existing.cover_url,
        total_pages !== undefined ? total_pages : existing.total_pages,
        current_page !== undefined ? current_page : existing.current_page,
        status ?? existing.status,
        filePath,
        fileType,
        req.params.id,
      ]
    );
    save();

    const updated = queryOne('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json({ data: updated });
  } catch (err) {
    if (req.file) removeUpload(req.file.filename);
    next(err);
  }
});

// DELETE /api/books/:id — delete book (cascade notes, remove uploaded file)
router.delete('/:id', (req, res, next) => {
  try {
    const { queryOne, run, save } = getDb();
    const existing = queryOne('SELECT * FROM books WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Remove uploaded file if exists
    removeUpload(existing.file_path);

    run('DELETE FROM books WHERE id = ?', [req.params.id]);
    save();

    res.json({ data: { message: 'Book deleted' } });
  } catch (err) {
    next(err);
  }
});

// ---- multer error handling ----
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小不能超过 50MB' });
    }
    return res.status(400).json({ error: `上传错误: ${err.message}` });
  }
  if (err.message === '仅支持 EPUB 和 PDF 格式') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// POST /api/books/:id/summary — generate AI summary
router.post('/:id/summary', async (req, res, next) => {
  try {
    const { queryOne, queryAll, run, save } = getDb();
    const book = queryOne('SELECT * FROM books WHERE id = ?', [req.params.id]);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const notes = queryAll(
      'SELECT * FROM notes WHERE book_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    if (notes.length === 0) {
      return res.status(400).json({
        error: '笔记不足',
        hint: '请先为这本书添加至少一条笔记，AI 需要笔记内容作为摘要的依据。'
      });
    }

    const noteTexts = notes.map((n, i) => `[笔记${i + 1}] ${n.content}`).join('\n');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-your-')) {
      return res.status(400).json({
        error: '未配置 OpenAI API Key',
        hint: '请在项目根目录的 .env 文件中设置 OPENAI_API_KEY=sk-xxxx'
      });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    const prompt = `你是一位专业的文学分析师。请根据读者提供的笔记，为以下书籍生成摘要。

书名：《${book.title}》
作者：${book.author}
${book.total_pages ? `总页数：${book.total_pages} 页` : ''}
${book.current_page > 0 ? `当前阅读至：第 ${book.current_page} 页 (${Math.round(book.current_page / book.total_pages * 100)}%)` : ''}

读者笔记：
${noteTexts}

请按以下格式输出（不要包含任何其他内容）：

【核心观点】
1. 观点一
2. 观点二
3. 观点三

【摘要】
一段 200 字以内的总结`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一位文学分析师。请只按照要求的格式输出，不要添加额外说明。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = completion.choices[0].message.content;

    const keyPointsMatch = raw.match(/【核心观点】\s*([\s\S]*?)(?=【摘要】|$)/);
    const summaryMatch = raw.match(/【摘要】\s*([\s\S]*?)$/);

    const key_points = keyPointsMatch ? keyPointsMatch[1].trim() : '';
    const summaryText = summaryMatch ? summaryMatch[1].trim() : raw;

    const existing = queryOne('SELECT id FROM summaries WHERE book_id = ?', [req.params.id]);
    if (existing) {
      run(
        'UPDATE summaries SET content = ?, key_points = ?, created_at = datetime(\'now\') WHERE book_id = ?',
        [summaryText, key_points, req.params.id]
      );
    } else {
      run(
        'INSERT INTO summaries (book_id, content, key_points) VALUES (?, ?, ?)',
        [req.params.id, summaryText, key_points]
      );
    }
    save();

    res.json({
      data: {
        summary: summaryText,
        key_points,
        model: 'gpt-3.5-turbo',
        notes_used: notes.length,
      }
    });
  } catch (err) {
    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(400).json({
        error: 'OpenAI API Key 无效',
        hint: '请检查 .env 中的 OPENAI_API_KEY 是否正确'
      });
    }
    next(err);
  }
});

module.exports = router;

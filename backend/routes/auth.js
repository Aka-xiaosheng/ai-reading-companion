const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6位' });
    }

    const trimmed = username.trim();
    const { queryOne, run, save } = getDb();

    const existing = queryOne('SELECT id FROM users WHERE username = ?', [trimmed]);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [trimmed, hash]
    );
    save();

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      data: { token, user: { id: result.lastInsertRowid, username: trimmed } },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const { queryOne } = getDb();

    const user = queryOne('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      data: { token, user: { id: user.id, username: user.username } },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — verify token and get current user
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const { queryOne } = getDb();
    const user = queryOne(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

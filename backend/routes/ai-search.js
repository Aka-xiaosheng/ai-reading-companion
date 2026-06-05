const express = require('express');
const router = express.Router();

// GET /api/ai-search?q=书名
// 调用 DeepSeek API（OpenAI 兼容接口）进行联网图书搜索
router.get('/ai-search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        error: '请提供搜索关键词',
        hint: '用法: GET /api/ai-search?q=书名',
      });
    }

    const query = q.trim();

    // ---- 检查 API Key ----
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-your-')) {
      return res.status(400).json({
        error: '未配置 DeepSeek API Key',
        hint: '请在项目根目录的 .env 文件中设置 DEEPSEEK_API_KEY=sk-xxxx 和 DEEPSEEK_BASE_URL=https://api.deepseek.com',
      });
    }

    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    // ---- 调用 DeepSeek API（兼容 OpenAI SDK） ----
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey, baseURL });

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            `你是一个专业的图书搜索助手。请帮用户搜索图书信息，包括实体书和网络文学（网文）。
请严格以 JSON 数组格式返回，不要包含 markdown 代码块标记或其他任何文字，只输出纯 JSON：
[{"title":"书名","author":"作者","description":"200字以内的内容简介","cover_url":"封面图片URL（若能找到则提供，否则为null）","source":"信息来源"}]
如果搜索到的图书少于5条，如实返回即可。`,
        },
        {
          role: 'user',
          content: `请帮我搜索关于《${query}》的图书信息，包括网文。如果书名不完全匹配，也请返回最接近的结果。`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content;

    // ---- 解析 JSON 结果 ----
    let books;
    try {
      books = JSON.parse(raw);
    } catch {
      // 如果被 markdown 代码块包裹，尝试提取
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          books = JSON.parse(jsonMatch[0]);
        } catch {
          return res.json({
            data: { books: [], raw, message: 'AI 返回格式异常，请重试' },
          });
        }
      } else {
        return res.json({
          data: { books: [], raw, message: 'AI 返回格式异常，请重试' },
        });
      }
    }

    if (!Array.isArray(books)) {
      books = books?.books || books?.results || [];
    }

    res.json({
      data: {
        query,
        books,
        total: books.length,
        model: 'deepseek-chat',
      },
    });
  } catch (err) {
    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(400).json({
        error: 'DeepSeek API Key 无效',
        hint: '请检查 .env 中的 DEEPSEEK_API_KEY 是否正确',
      });
    }
    next(err);
  }
});

module.exports = router;

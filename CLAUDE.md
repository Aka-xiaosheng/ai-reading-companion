# 项目目标
构建一个"AI 阅读伴侣"应用，用户可以：
- 添加、编辑、删除正在阅读或已读的书籍
- 为每本书添加阅读进度（百分比）和私人笔记
- 一键生成整本书的 AI 摘要、主要人物或论点分析（通过集成 OpenAI API）
- 根据阅读历史，获得个性化的新书推荐（由 AI 推荐）

# 技术栈
- 前端：React + Tailwind CSS + Vite
- 后端：Node.js + Express
- 数据库：SQLite（better-sqlite3，文件型，无需额外安装）
- AI 接口：OpenAI API（或 Claude API，可配置切换）
- 部署：前后端可分别部署，或后端简易部署到 Railway / Render

# 项目结构
所有前端代码放在 frontend/，后端代码放在 backend/。
开发时，前端运行在 localhost:3000，后端在 localhost:3001。
前端通过 Vite proxy（vite.config.js）将 /api 请求转发到后端。

```
ai-reading-companion/
├── CLAUDE.md
├── .env.example
├── README.md
├── agents/
│   ├── book-manager.md
│   ├── ai-summarizer.md
│   └── recommender.md
├── backend/
│   ├── package.json
│   ├── server.js          ← Express 入口
│   ├── database.js        ← SQLite 初始化 + 表结构
│   └── routes/
│       ├── books.js       ← /api/books 路由骨架
│       └── notes.js       ← /api/notes 路由骨架
└── frontend/
    ├── package.json
    ├── vite.config.js     ← Vite 配置 + proxy
    ├── index.html         ← Vite 入口 HTML
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    └── src/
        ├── main.jsx       ← React 入口
        ├── App.jsx        ← 根组件 + 路由壳
        ├── index.css      ← Tailwind 指令
        ├── api.js         ← 后端 API 封装
        └── components/    ← 组件目录 (待实现)
```

# 工作流程
当用户请求某个功能时，我会调度对应的 agent 去完成：
- 所有 CRUD 操作由 book-manager agent 负责
- 需要 AI 摘要时，由 ai-summarizer agent 调用 API
- 推荐书籍时，由 recommender agent 分析阅读历史并调用 API

# 命令
```bash
# 后端
cd backend && npm install && npm run dev

# 前端
cd frontend && npm install && npm run dev
```

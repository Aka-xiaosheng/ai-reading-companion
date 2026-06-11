---
name: p0-3-deployment-ready
description: P0-3 部署上线准备工作完成，记录关键决策和配置
metadata:
  type: project
---

P0-3 部署准备工作已于 2026-06-11 完成。

**平台决策：**
- 后端：Railway (Free) — 唯一免费层有持久卷的平台，SQLite DB 文件不丢失
- 前端：Vercel (Hobby) — 100GB 带宽，自动 HTTPS
- DB 路径：`/data/reading.db`（Railway Volume 挂载点）

**代码变更：**
- `backend/server.js`：CORS 限制（`CORS_ORIGIN` 环境变量），自动创建 uploads 目录，增强启动日志
- `frontend/src/api.js`：`API_BASE` 改用 `import.meta.env.VITE_API_URL || '/api'`
- `.env.example`：新增 `JWT_SECRET`、`CORS_ORIGIN`，修正 `PORT=3005`

**新增配置文件：**
- `frontend/vercel.json` — SPA rewrite 规则
- `backend/Procfile` — `web: npm start`
- `frontend/.env.production` — `VITE_API_URL` 模板

**文档更新：**
- `README.md`：完整部署指南 + 环境变量参考表
- `CLAUDE.md`：sql.js 和端口号更正
- `MEMORY.md`：P0-3 完成标记

**实际部署需要用户操作：**
1. 在 Railway 创建项目（Root Directory: backend/, 挂载 Volume 到 /data）
2. 在 Vercel 创建项目（Root Directory: frontend/）
3. 设置环境变量（JWT_SECRET, CORS_ORIGIN, VITE_API_URL）

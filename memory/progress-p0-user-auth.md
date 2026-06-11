---
name: p0-2-user-auth-complete
description: P0-2 用户认证已完成，记录实现细节供后续参考
metadata:
  type: project
---

P0-2 用户认证已于 2026-06-11 完成。

**实现内容：**
- 后端：JWT 认证（`jsonwebtoken` + `bcryptjs`）
- `backend/middleware/auth.js`：验证 `Authorization: Bearer <token>`，解析 `userId` 附加到 `req`
- `backend/routes/auth.js`：`POST /register`、`POST /login`、`GET /me`
- `backend/database.js`：新增 `users` 表，`books` 和 `notes` 表加 `user_id` 列（含迁移逻辑）
- `backend/routes/books.js`：所有路由加 `authMiddleware` + `user_id` 过滤
- `backend/routes/notes.js`：同上
- 前端：`Login.jsx` 组件（登录/注册切换，知识花园设计语言）
- `api.js`：自动附加 `Authorization` header，`setToken()`/`isLoggedIn()` 工具函数
- `App.jsx`：认证状态管理，未登录显示 Login，已登录显示书架 + 退出按钮
- Token 存储在 `localStorage.auth_token`，7 天过期

**关键设计决策：**
- JWT_SECRET 默认值：`dev-secret-change-in-production`（生产环境需通过 .env 覆盖）
- 密码至少 6 位，bcrypt 10 轮哈希
- 旧数据库自动迁移（检测列是否存在，不存在则 ALTER TABLE ADD COLUMN）
- 退出登录时清除 token 和内存中的书籍数据

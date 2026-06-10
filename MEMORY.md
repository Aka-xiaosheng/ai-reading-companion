# AI 阅读伴侣 — 项目进度

## 当前状态（2026-06-11）

### ✅ 已完成

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0-1 | 移动端响应式适配 | iOS safe-area、100vh 修复、底部弹出、触摸手势、响应式工具栏、霞鹜文楷字体 |

### 核心功能已实现
- 书籍 CRUD（添加/编辑/删除/搜索）
- EPUB 文件上传与解析（better-sqlite3 存储）
- EPUB 阅读器（react-ebookjs / foliate-js）
  - 目录导航（TOC 侧边抽屉）
  - 夜间模式（`setStyles()` 切换）
  - 字体大小调节
  - 阅读进度持久化（localStorage，0-1 float）
  - 触摸滑动翻页（60px 阈值，横向优先）
  - 键盘翻页（← →）
  - 移动端折叠菜单（`⋮` 按钮）
  - 毛玻璃顶部栏 + 墨绿色强调色（知识花园风格）

### 技术栈
- 前端：React + Tailwind CSS + Vite（localhost:3000，proxy /api → 3005）
- 后端：Express + better-sqlite3（localhost:3005）
- EPUB 引擎：react-ebookjs（foliate-js Web Components）
- 设计语言：知识花园 — `#FBF7F0` 奶油底、`#234A3D` 墨绿强调、毛玻璃、霞鹜文楷

---

## 📋 下一步：按路线图执行

路线图详见 `docs/AI阅读伴侣-上线路线图.doc`

### 🔴 P0-2：用户认证（建议明天开始）

**目标**：支持多用户，每人独立的书架和阅读数据

**方案**（已决策）：
- **JWT 认证**（无状态，不引入 Redis）
- 登录接口：`POST /api/auth/login` → `{ token }`
- 注册接口：`POST /api/auth/register` → `{ token }`
- 中间件：`authMiddleware` 验证 `Authorization: Bearer <token>`
- 密码加密：`bcryptjs`
- 数据库改动：新增 `users` 表，`books` 和 `notes` 表加 `userId` 外键

**后端实施步骤**：
1. `npm install bcryptjs jsonwebtoken`
2. 新建 `backend/routes/auth.js`（登录/注册路由）
3. 新建 `backend/middleware/auth.js`（JWT 验证中间件）
4. 修改 `backend/database.js`：新增 `users` 表 + `books.user_id` + `notes.user_id`
5. 修改 `backend/routes/books.js`：所有路由加 `authMiddleware`，按 `userId` 过滤
6. 修改 `backend/routes/notes.js`：同上
7. 修改 `backend/server.js`：注册 `/api/auth` 路由

**前端实施步骤**：
1. 新建 `frontend/src/components/Login.jsx`（登录/注册表单）
2. 修改 `frontend/src/api.js`：加上 `Authorization` header + token 存储
3. 修改 `frontend/src/App.jsx`：未登录时显示 Login 页面
4. `localStorage` 存储 token

### 🔴 P0-3：部署上线

- 后端：Railway / Render（Node.js + SQLite）
- 前端：Vercel / Netlify（静态站点）
- 环境变量配置（API key、JWT secret）
- CORS 配置

### 🟡 P1：AI 增强
- OpenAI API 集成（书籍摘要、主要人物/论点分析）
- 个性化推荐引擎
- 笔记功能完善

### 🟡 P2：体验打磨
- 阅读统计仪表板
- 书架排序/分组
- 阅读提醒

### ⚪ P3：扩展
- 社交功能
- 多格式支持（PDF 已有 react-pdf，FB2/CBZ 可通过 foliate-js 支持）
- PWA 离线支持

---

## 开发命令

```bash
# 克隆项目
git clone https://github.com/Aka-xiaosheng/ai-reading-companion.git
cd ai-reading-companion

# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env：填入 OPENAI_API_KEY（AI 功能暂不需要，可跳过）

# 启动后端（端口 3005）
cd backend && node server.js

# 启动前端（端口 3000，新终端）
cd frontend && npm run dev
```

## 已知问题 / 注意事项

1. **Windows 上 `--watch` 会导致后端不断重启**，使用 `node server.js` 代替
2. **EPUB 语言标签**：`zh_CN`（下划线）需转为 `zh-CN`（连字符），已在 EpubReader 中处理
3. **上传目录**：`backend/uploads/` 需存在 `.gitkeep`
4. **数据库文件**：`*.db` 在 `.gitignore` 中，每台机器独立生成

---

> 💡 明天在新电脑上，直接 `git clone` 后在项目目录运行 Claude Code，把这段发给我：
> "继续昨天的工作，阅读 MEMORY.md，继续 P0-2 用户认证的开发"

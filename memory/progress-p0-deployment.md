---
name: p0-3-deployment-ready
description: P0-3 部署上线完成，记录实际部署信息和关键配置
metadata:
  type: project
---

P0-3 部署已于 2026-06-12 完成。

**实际部署信息：**
- 后端 (Railway)：https://responsible-integrity-production-8806.up.railway.app
  - Railway 项目：responsible-integrity（ID: 2231863e-6d1b-4309-b373-19134cdd4d24）
  - Volume: responsible-integrity-volume · /data · 500 MB
  - 区域: sfo (San Francisco)
- 前端 (Vercel)：https://frontend-xi-six-97.vercel.app
  - Vercel 团队：fingal-s-projects
  - 项目：frontend

**环境变量：**
- Railway: JWT_SECRET, DATABASE_PATH=/data/reading.db, CORS_ORIGIN=https://frontend-xi-six-97.vercel.app
- Vercel: VITE_API_URL=https://responsible-integrity-production-8806.up.railway.app/api

**部署中修复的问题：**
- server.js：在 initDb 前确保数据库目录存在（/data mkdir），修复 Railway Volume 挂载时目录不存在的 ENOENT
- server.js：将 /api/health 路由移到 auth 中间件之前，修复被 notesRouter 拦截的问题
- Git Bash 路径转换：使用 MSYS_NO_PATHCONV=1 防止 /data 被转为 C:/Program Files/Git/data

**Railway CLI 安装：**
- 手动从 GitHub 下载二进制（npm postinstall 不走代理）
- 安装路径：~/bin/railway.exe
- 登录方式：浏览器 OAuth

**后续部署命令：**
```bash
# 后端更新
cd backend && MSYS_NO_PATHCONV=1 ~/bin/railway.exe up

# 前端更新
cd frontend && vercel --prod
```

# MD2Card 部署说明

本文档说明如何将 MD2Card（前端 + 后端）部署到一台 Linux VPS 上。

---

## 架构概览

```
用户浏览器
     │
     ▼
 Nginx（80/443）
     ├── 静态资源（/）     → /var/www/md2card/front/dist/
     └── API 转发（/api/） → http://127.0.0.1:3747（Fastify 后端，由 PM2 管理）
```

- **前端**：Vite + React，构建后输出静态文件，由 Nginx 直接托管
- **后端**：Node.js + Fastify，监听本地 3747 端口，数据存储在 `backend/data/db.json`
- **HTTPS**：由 Let's Encrypt（certbot）签发证书，Nginx 负责 TLS 终止

---

## 系统要求

| 依赖 | 版本要求 |
| --- | --- |
| 操作系统 | Ubuntu 22.04 / Debian 12 或同等 |
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Nginx | ≥ 1.18 |
| PM2 | ≥ 5 |
| certbot | 任意稳定版 |

最低配置：1 核 CPU / 512 MB 内存 / 10 GB 磁盘

---

## 服务器目录约定

```
/var/www/md2card/          ← 项目根目录（git clone 到此）
├── front/                 ← 前端源码
│   └── dist/              ← 构建产物（Nginx 静态根目录）
├── backend/               ← 后端源码
│   └── data/
│       └── db.json        ← 用户数据（请定期备份）
└── deploy/                ← 部署脚本和配置
```

---

## 首次部署

### 1. 初始化服务器（仅首次）

以 root 或有 sudo 权限的用户执行：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/your-org/md2card/main/deploy/setup.sh)
```

或者手动执行 `deploy/setup.sh`，脚本会：
- 安装 Node.js 20、PM2、Nginx、certbot
- 创建 `/var/www/md2card` 目录并配置权限

### 2. 克隆代码

```bash
cd /var/www
git clone https://github.com/your-org/md2card.git md2card
cd md2card
```

### 3. 配置前端环境变量

```bash
cp deploy/env.frontend.example front/.env.production
# 编辑 .env.production，通常留空即可（生产用相对路径，Nginx 代理 /api）
```

### 4. 配置后端环境变量

```bash
cp deploy/env.backend.example backend/.env
# 编辑 backend/.env，至少设置 FRONTEND_ORIGIN
nano backend/.env
```

> **提示**：Node.js 20.6+ 支持 `--env-file` 加载 `.env`，可在 `package.json` 的 `dev` 脚本中加入
> `node --env-file=.env ...`。生产环境由 PM2 `ecosystem.config.cjs` 直接注入环境变量，无需 `.env`。

### 5. 构建前端

```bash
cd /var/www/md2card/front
npm ci
npm run build
```

### 6. 安装后端依赖

```bash
cd /var/www/md2card/backend
npm ci --omit=dev
```

### 7. 配置 Nginx

```bash
# 复制配置模板，替换域名
sudo cp /var/www/md2card/deploy/nginx.conf.example /etc/nginx/sites-available/md2card
sudo nano /etc/nginx/sites-available/md2card   # 将 YOUR_DOMAIN 替换为实际域名

sudo ln -s /etc/nginx/sites-available/md2card /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8. 申请 HTTPS 证书

```bash
sudo certbot --nginx -d YOUR_DOMAIN
# certbot 会自动修改 Nginx 配置并设置自动续期
```

### 9. 启动后端服务

```bash
# 修改 ecosystem.config.cjs 中的路径和域名（见文件注释）
pm2 start /var/www/md2card/deploy/ecosystem.config.cjs
pm2 save        # 保存进程列表
pm2 startup     # 生成开机自启命令（按提示执行输出的那条命令）
```

### 10. 验证

```bash
curl https://YOUR_DOMAIN/api/health
# 期望输出：{"ok":true,"service":"md2card-backend","stack":"fastify"}
```

---

## 日常更新（重新部署）

```bash
bash /var/www/md2card/deploy/deploy.sh
```

脚本会自动完成：拉取最新代码 → 安装依赖 → 重新构建前端 → 重启后端。

也可以指定分支：

```bash
bash /var/www/md2card/deploy/deploy.sh feat/some-branch
```

---

## 数据备份

后端所有用户数据存储在单个 JSON 文件中：

```
/var/www/md2card/backend/data/db.json
```

### 手动备份

```bash
cp /var/www/md2card/backend/data/db.json \
   /var/backups/md2card/db-$(date +%Y%m%d-%H%M%S).json
```

### 自动定时备份（推荐）

```bash
# 每天凌晨 3 点备份，保留最近 30 份
crontab -e
```

添加以下内容：

```cron
0 3 * * * mkdir -p /var/backups/md2card && cp /var/www/md2card/backend/data/db.json /var/backups/md2card/db-$(date +\%Y\%m\%d).json && find /var/backups/md2card -name 'db-*.json' -mtime +30 -delete
```

---

## 日志查看

```bash
# 后端实时日志
pm2 logs md2card-backend

# 后端错误日志
tail -f /var/log/md2card/backend-error.log

# Nginx 访问日志
sudo tail -f /var/log/nginx/md2card.access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/md2card.error.log
```

---

## 故障排查

| 现象 | 排查步骤 |
| --- | --- |
| 页面空白 / 404 | 检查 `front/dist/` 是否存在；`nginx -t` 是否报错 |
| API 返回 502 | `pm2 status` 查看后端是否运行；`pm2 logs` 查看错误 |
| HTTPS 证书过期 | `sudo certbot renew --dry-run` 测试续期；检查 certbot 定时任务 |
| 注册/登录失败 | 检查 `backend/.env` 中 `FRONTEND_ORIGIN` 是否与实际域名一致 |
| 数据丢失 | 从 `/var/backups/md2card/` 恢复最近一份 `db.json` |

```bash
# 快速健康检查
pm2 status
sudo systemctl status nginx
curl -s http://127.0.0.1:3747/api/health
```

---

## 安全建议

- 不要将 `backend/data/db.json` 暴露在 Web 根目录下
- 定期更新依赖：`npm audit` + `npm update`
- 服务器配置防火墙，只开放 22（SSH）、80、443 端口
- SSH 登录使用密钥认证，禁用密码登录
- 建议定期轮换 certbot 证书（certbot 默认 90 天自动续期）

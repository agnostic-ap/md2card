#!/usr/bin/env bash
# MD2Card 增量部署脚本
# 使用方式：bash deploy/deploy.sh [分支名，默认 main]
#
# 执行步骤：
#   1. 拉取最新代码
#   2. 安装/更新前端依赖并重新构建
#   3. 安装/更新后端依赖
#   4. 零停机重启后端（pm2 reload）

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${1:-main}"

info()  { echo -e "\e[32m[deploy]\e[0m $*"; }
error() { echo -e "\e[31m[error]\e[0m  $*" >&2; exit 1; }

command -v npm  &>/dev/null || error "npm 未安装"
command -v pm2  &>/dev/null || error "pm2 未安装（npm install -g pm2）"

info "项目目录：$APP_DIR"
info "目标分支：$BRANCH"
echo "──────────────────────────────────────────"

# ── 1. 拉取代码 ───────────────────────────────────────────────────────────────
info "拉取最新代码..."
cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
COMMIT=$(git rev-parse --short HEAD)
info "当前 commit：$COMMIT"

# ── 2. 构建前端 ───────────────────────────────────────────────────────────────
info "安装前端依赖..."
cd "$APP_DIR/front"
npm ci --prefer-offline

info "构建前端（Vite）..."
# 确保生产环境变量文件存在（首次可从模板复制）
[[ -f .env.production ]] || { info "未找到 .env.production，从模板复制..."; cp "$APP_DIR/deploy/env.frontend.example" .env.production; }
npm run build
info "构建产物：$APP_DIR/front/dist/"

# ── 3. 更新后端依赖 ───────────────────────────────────────────────────────────
info "安装后端依赖..."
cd "$APP_DIR/backend"
npm ci --omit=dev --prefer-offline

# ── 4. 重启后端 ───────────────────────────────────────────────────────────────
info "重启后端服务..."
cd "$APP_DIR"
if pm2 describe md2card-backend &>/dev/null; then
    pm2 reload md2card-backend --update-env
else
    info "首次启动，使用 ecosystem.config.cjs..."
    pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
    pm2 save
fi

# ── 5. 健康检查 ───────────────────────────────────────────────────────────────
info "等待服务就绪..."
sleep 2

for i in 1 2 3; do
    if curl -sf http://127.0.0.1:3747/api/health > /dev/null; then
        info "✅ 后端健康检查通过"
        break
    fi
    if [[ $i -eq 3 ]]; then
        error "后端健康检查失败，请执行 pm2 logs md2card-backend 排查"
    fi
    sleep 3
done

echo "──────────────────────────────────────────"
info "✅ 部署完成（commit: $COMMIT）"
pm2 status

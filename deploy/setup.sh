#!/usr/bin/env bash
# MD2Card 服务器初始化脚本（仅首次执行）
# 适用于 Ubuntu 22.04 / Debian 12
# 使用方式：sudo bash deploy/setup.sh

set -euo pipefail

APP_DIR="/var/www/md2card"
APP_USER="${SUDO_USER:-www-data}"
LOG_DIR="/var/log/md2card"
BACKUP_DIR="/var/backups/md2card"

info()  { echo -e "\e[32m[INFO]\e[0m  $*"; }
warn()  { echo -e "\e[33m[WARN]\e[0m  $*"; }
error() { echo -e "\e[31m[ERROR]\e[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || error "请以 root 或 sudo 执行此脚本"

# ── 1. 系统更新 ───────────────────────────────────────────────────────────────
info "更新系统包..."
apt-get update -q
apt-get upgrade -y -q

# ── 2. 安装基础工具 ───────────────────────────────────────────────────────────
info "安装基础工具..."
apt-get install -y -q curl git nginx certbot python3-certbot-nginx ufw

# ── 3. 安装 Node.js 20 ───────────────────────────────────────────────────────
if command -v node &>/dev/null && [[ $(node -v | cut -d. -f1 | tr -d 'v') -ge 20 ]]; then
    info "Node.js $(node -v) 已安装，跳过"
else
    info "安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -q nodejs
fi
info "Node.js 版本：$(node -v)  npm 版本：$(npm -v)"

# ── 4. 安装 PM2 ───────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
    info "PM2 已安装，跳过"
else
    info "安装 PM2..."
    npm install -g pm2
fi

# ── 5. 创建目录 ───────────────────────────────────────────────────────────────
info "创建应用目录..."
mkdir -p "$APP_DIR" "$LOG_DIR" "$BACKUP_DIR"

# 将目录所有权交给运行用户（非 root）
if id "$APP_USER" &>/dev/null; then
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR" "$LOG_DIR" "$BACKUP_DIR"
    info "目录所有者：$APP_USER"
else
    warn "用户 $APP_USER 不存在，目录保持 root 所有权"
fi

# ── 6. 配置防火墙 ─────────────────────────────────────────────────────────────
info "配置 UFW 防火墙..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# ── 7. 启用 Nginx ─────────────────────────────────────────────────────────────
info "启用 Nginx..."
systemctl enable nginx
systemctl start nginx

# 删除默认站点（避免与 md2card 配置冲突）
rm -f /etc/nginx/sites-enabled/default

# ── 8. 创建日志轮转配置 ───────────────────────────────────────────────────────
cat > /etc/logrotate.d/md2card <<'EOF'
/var/log/md2card/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    sharedscripts
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF
info "日志轮转配置已写入 /etc/logrotate.d/md2card"

# ── 完成 ──────────────────────────────────────────────────────────────────────
echo ""
info "✅ 服务器初始化完成！接下来请执行："
echo ""
echo "   1. 克隆代码到 $APP_DIR"
echo "      git clone https://github.com/your-org/md2card.git $APP_DIR"
echo ""
echo "   2. 按照 deploy/README.md 完成后续步骤"
echo ""

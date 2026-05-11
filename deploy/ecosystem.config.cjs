// PM2 进程配置
// 修改 APP_DIR 和 FRONTEND_ORIGIN 后执行：
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup

const APP_DIR = '/var/www/md2card'

module.exports = {
  apps: [
    {
      name: 'md2card-backend',
      script: 'src/server.js',
      cwd: `${APP_DIR}/backend`,

      // Node.js 版本要求 >= 20，ESM 模块
      interpreter: 'node',
      interpreter_args: '',

      // 单实例（数据用 JSON 文件，不支持多进程并发写）
      instances: 1,
      exec_mode: 'fork',

      // 生产环境变量
      // 也可以用 backend/.env 文件，并在此移除 env 块
      env: {
        NODE_ENV: 'production',
        PORT: 3747,
        HOST: '127.0.0.1',                    // 仅监听本地，由 Nginx 代理
        FRONTEND_ORIGIN: 'https://YOUR_DOMAIN', // 改为实际域名
      },

      // 崩溃自动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,

      // 内存超限自动重启
      max_memory_restart: '256M',

      // 日志
      error_file: '/var/log/md2card/backend-error.log',
      out_file:   '/var/log/md2card/backend-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}

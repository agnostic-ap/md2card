[中文](./README.md) | English

# MD2Card

**Turn Markdown into beautiful content cards — in three steps.**

Write Markdown → Pick a theme → Export PNG / PDF / SVG

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/agnostic-ap/md2card?style=flat)](https://github.com/agnostic-ap/md2card/stargazers)
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://agnostic-ap.github.io/md2card/)

🌐 **Live demo**: [mdcard.cn](https://mdcard.cn) *(coming soon)* · [Try it free →](https://agnostic-ap.github.io/md2card/)

![Editor screenshot](docs/screenshots/editor.png)

---

## Features

- **Live preview** — Editor and card preview render in sync; what you see is what you get
- **Multiple themes** — 15+ carefully designed color schemes with fine-grained control over fonts, colors, backgrounds, and overlays
- **Multi-card pagination** — Use `===` on its own line to split one Markdown document into multiple cards; batch export as ZIP
- **Multiple export formats** — PNG (1×/2×/3× hi-res), SVG, card PDF, A4 document PDF, raw Markdown
- **AI-assisted generation** — Works with OpenAI, Claude, Doubao, Qwen, and more; generate structured card content from a single prompt

  ![AI generation](docs/screenshots/ai-generate.png)
- **Watermark & Logo** — Customize watermark text, position, and opacity; upload a personal or brand logo
- **Share links** — Compress current content and styles into a URL; share with anyone to continue editing
- **User accounts** — Sign up to sync drafts to the cloud and pick up where you left off on any device

---

## Self-hosting

### Docker (recommended)

> Requires Docker only

```bash
git clone https://github.com/agnostic-ap/md2card.git
cd md2card
docker compose up -d
```

Open `http://localhost`. Data is persisted in a Docker volume.

### Manual

> Requires Node.js ≥ 20, Nginx, PM2

```bash
git clone https://github.com/agnostic-ap/md2card.git
cd md2card

# Build frontend
cd front && npm ci && npm run build && cd ..

# Install backend dependencies
cd backend && npm ci --omit=dev && cd ..

# Start with PM2
pm2 start deploy/ecosystem.config.cjs
```

For detailed deployment instructions (Nginx config, HTTPS, backups, etc.) see [deploy/README.md](./deploy/README.md).

---

## Project structure

```
md2card/
├── front/      # Frontend — Vite + React + TypeScript + Tailwind CSS
├── backend/    # Backend  — Node.js + Fastify (JSON file storage)
└── deploy/     # Deployment scripts and config (Nginx, PM2, automation)
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Editor | CodeMirror 6 |
| Backend | Fastify 5 + Node.js |
| Auth | Token-based (PBKDF2 password hashing, 30-day session) |

---

## Local development

```bash
# Backend (open a new terminal)
cd backend
cp ../deploy/env.backend.example .env   # set FRONTEND_ORIGIN
npm run dev

# Frontend
cd front
cp .env.example .env.local
npm run dev
```

Frontend runs at `http://localhost:5173` by default; API requests are proxied to the backend via Vite.

---

## License

[MIT](./LICENSE)

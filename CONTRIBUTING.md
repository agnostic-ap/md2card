# Contributing to MD2Card

Thanks for your interest in contributing!

## Local development

### Prerequisites

- Node.js ≥ 20
- npm

### Setup

```bash
git clone https://github.com/agnostic-ap/md2card.git
cd md2card

# Backend
cd backend
cp ../deploy/env.backend.example .env   # set FRONTEND_ORIGIN=http://localhost:5173
npm install
npm run dev

# Frontend (new terminal)
cd front
cp .env.example .env.local
npm install
npm run dev
```

Frontend: `http://localhost:5173` — API requests are proxied to the backend automatically.

## Submitting changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Make sure the frontend builds without errors: `cd front && npm run build`
4. Open a pull request with a clear description of what you changed and why

## Reporting bugs

Use the [Bug report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template.

## Suggesting features

Use the [Feature request](.github/ISSUE_TEMPLATE/feature_request.yml) issue template.

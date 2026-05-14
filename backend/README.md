# MD2Card Backend

Local Node.js backend for MD2Card user accounts and workspace sync.

## Stack

This service uses Fastify and `@fastify/cors`. It intentionally avoids the
native Node HTTP server so the API layer already looks like a real backend
project while staying small enough for local development.

Data is stored in `data/db.json` for now. The API boundaries are ready to move
to SQLite/Postgres later without changing the frontend contract.

## Run

```bash
npm run dev
```

Default API origin:

```text
http://localhost:3747
```

The frontend already proxies `/api` to this port in Vite.

## Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/me`
- `GET /api/workspace`
- `PUT /api/workspace`
- `DELETE /api/session`

Authenticated endpoints expect:

```text
Authorization: Bearer <token>
```

Data is stored in `data/db.json`, which is ignored by git.

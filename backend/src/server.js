import Fastify from 'fastify'
import cors from '@fastify/cors'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', 'data', 'db.json')
const PORT = Number.parseInt(process.env.PORT ?? '3747', 10)
const HOST = process.env.HOST ?? '127.0.0.1'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173'

const emptyDb = {
  users: [],
  sessions: [],
  workspaces: {},
}

async function ensureDb() {
  await mkdir(dirname(DB_PATH), { recursive: true })
  try {
    await readFile(DB_PATH, 'utf8')
  } catch {
    await writeFile(DB_PATH, `${JSON.stringify(emptyDb, null, 2)}\n`, 'utf8')
  }
}

async function readDb() {
  await ensureDb()
  const raw = await readFile(DB_PATH, 'utf8')
  return { ...emptyDb, ...JSON.parse(raw) }
}

async function writeDb(db) {
  await mkdir(dirname(DB_PATH), { recursive: true })
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
}

// 串行化所有需要原子读写的操作，防止并发覆盖
let dbLock = Promise.resolve()
function withDb(fn) {
  let resolve
  const next = new Promise((r) => { resolve = r })
  const prev = dbLock
  dbLock = next
  return prev.then(() => fn()).finally(() => resolve())
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt,
  }
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return { salt, hash }
}

function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.passwordSalt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(user.passwordHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

function createWorkspaceSeed(userId) {
  return {
    userId,
    updatedAt: new Date().toISOString(),
    editorState: null,
    snippets: [],
    aiTemplates: [],
    preferences: {
      cardThemeId: null,
      exportScale: 2,
      appTheme: 'light',
    },
    assets: {
      logos: [],
      brandColors: [],
    },
  }
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 天

function createSession(db, userId) {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  // 清理当前用户的过期 session
  db.sessions = db.sessions.filter(
    (s) => s.userId !== userId || now - new Date(s.createdAt).getTime() < SESSION_TTL_MS,
  )
  db.sessions.push({
    id: randomUUID(),
    userId,
    token,
    createdAt: new Date().toISOString(),
  })
  return token
}

function getBearer(request) {
  const header = request.headers.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1] ?? null
}

async function getAuthedUser(request, reply) {
  const token = getBearer(request)
  if (!token) {
    return reply.code(401).send({ error: 'unauthorized', message: '请先登录' })
  }

  const db = await readDb()
  const session = db.sessions.find(
    (item) =>
      item.token === token &&
      Date.now() - new Date(item.createdAt).getTime() < SESSION_TTL_MS,
  )
  const user = session ? db.users.find((item) => item.id === session.userId) : null

  if (!user) {
    return reply.code(401).send({ error: 'unauthorized', message: '请先登录' })
  }

  return { db, user, token }
}

function requireString(value) {
  return typeof value === 'string' ? value : ''
}

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  reply.code(500).send({
    error: 'internal_error',
    message: '服务异常，请稍后重试',
  })
})

app.get('/api/health', async () => ({
  ok: true,
  service: 'md2card-backend',
  stack: 'fastify',
}))

app.post('/api/auth/signup', async (request, reply) => {
  const body = request.body ?? {}
  const name = requireString(body.name).trim()
  const email = requireString(body.email).trim().toLowerCase()
  const password = requireString(body.password)

  if (name.length < 2) {
    return reply.code(400).send({ error: 'bad_request', message: '昵称至少需要 2 个字' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply.code(400).send({ error: 'bad_request', message: '请输入合法邮箱' })
  }
  if (password.length < 6) {
    return reply.code(400).send({ error: 'bad_request', message: '密码至少需要 6 位' })
  }

  return withDb(async () => {
    const db = await readDb()
    if (db.users.some((user) => user.email === email)) {
      return reply.code(409).send({ error: 'email_exists', message: '该邮箱已注册，请直接登录' })
    }

    const passwordInfo = hashPassword(password)
    const user = {
      id: randomUUID(),
      name,
      email,
      plan: 'free',
      createdAt: new Date().toISOString(),
      passwordSalt: passwordInfo.salt,
      passwordHash: passwordInfo.hash,
    }

    db.users.push(user)
    db.workspaces[user.id] = createWorkspaceSeed(user.id)
    const token = createSession(db, user.id)
    await writeDb(db)
    return reply.code(201).send({ user: publicUser(user), token })
  })
})

app.post('/api/auth/signin', async (request, reply) => {
  const body = request.body ?? {}
  const email = requireString(body.email).trim().toLowerCase()
  const password = requireString(body.password)

  return withDb(async () => {
    const db = await readDb()
    const user = db.users.find((item) => item.email === email)

    if (!user || !verifyPassword(password, user)) {
      return reply.code(401).send({ error: 'invalid_credentials', message: '邮箱或密码不正确' })
    }

    const token = createSession(db, user.id)
    if (!db.workspaces[user.id]) db.workspaces[user.id] = createWorkspaceSeed(user.id)
    await writeDb(db)
    return { user: publicUser(user), token }
  })
})

app.get('/api/me', async (request, reply) => {
  const auth = await getAuthedUser(request, reply)
  if (!auth) return undefined
  return { user: publicUser(auth.user) }
})

app.get('/api/workspace', async (request, reply) => {
  const auth = await getAuthedUser(request, reply)
  if (!auth) return undefined

  return withDb(async () => {
    const db = await readDb()
    const workspace = db.workspaces[auth.user.id] ?? createWorkspaceSeed(auth.user.id)
    db.workspaces[auth.user.id] = workspace
    await writeDb(db)
    return { workspace }
  })
})

app.put('/api/workspace', async (request, reply) => {
  const auth = await getAuthedUser(request, reply)
  if (!auth) return undefined

  return withDb(async () => {
    const db = await readDb()
    const current = db.workspaces[auth.user.id] ?? createWorkspaceSeed(auth.user.id)
    const body = request.body ?? {}
    const next = {
      ...current,
      ...body,
      userId: auth.user.id,
      updatedAt: new Date().toISOString(),
    }
    db.workspaces[auth.user.id] = next
    await writeDb(db)
    return { workspace: next }
  })
})

app.delete('/api/session', async (request, reply) => {
  const token = getBearer(request)
  if (!token) return reply.code(204).send()

  return withDb(async () => {
    const db = await readDb()
    db.sessions = db.sessions.filter((item) => item.token !== token)
    await writeDb(db)
    return reply.code(204).send()
  })
})

await ensureDb()
await app.listen({ port: PORT, host: HOST })

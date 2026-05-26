// Build-time prerender: load the SPA in a headless browser, capture the
// rendered DOM, and write it back to dist/index.html so non-JS crawlers
// (Baidu, older Bingbot etc.) see real landing content.
//
// Designed to run inside the existing `npm run build` step. In Docker the
// builder stage installs Chromium via apk and exports PUPPETEER_EXECUTABLE_PATH.
// Locally puppeteer's bundled Chromium is used by default.

import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const PORT = 4900 + Math.floor(Math.random() * 100)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

const server = createServer(async (req, res) => {
  let url = (req.url ?? '/').split('?')[0]
  if (url === '/' || url.endsWith('/')) url += 'index.html'
  try {
    const buf = await readFile(join(distDir, url))
    res.setHeader('Content-Type', MIME[extname(url)] ?? 'application/octet-stream')
    res.end(buf)
  } catch {
    if (url.startsWith('/api') || url === '/track') {
      res.statusCode = 204
      res.end()
      return
    }
    const buf = await readFile(join(distDir, 'index.html'))
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(buf)
  }
})

await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
console.log(`[prerender] static server listening on http://127.0.0.1:${PORT}`)

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`http://127.0.0.1:${PORT}/`, {
    waitUntil: 'networkidle0',
    timeout: 45000,
  })

  // Wait until React rendered the Landing (hero copy is a reliable signal).
  await page.waitForFunction(
    () => /MD2Card|Markdown/.test(document.body.innerText),
    { timeout: 15000 },
  )

  // Inline the rendered HTML back into dist/index.html. Vite-injected scripts
  // and stylesheets are already present, so the original SPA still boots and
  // replaces the prerendered #root content on hydration.
  let html = await page.content()

  // Strip any errant <link rel="preconnect"> noise and absolute prerender host references.
  html = html.replace(new RegExp(`http://127\\.0\\.0\\.1:${PORT}`, 'g'), '')

  writeFileSync(join(distDir, 'index.html'), html, 'utf8')
  console.log('[prerender] dist/index.html rewritten with rendered DOM')
} finally {
  await browser.close()
  server.close()
}

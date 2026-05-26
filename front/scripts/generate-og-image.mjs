// Build-time generation of the 1200x630 social-share card.
// Renders an HTML template in puppeteer, screenshots, writes to public/og-image.png.
// In Docker the Alpine Chromium installed for prerender is reused via PUPPETEER_EXECUTABLE_PATH.

import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'og-image.png')

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: "Noto Sans CJK SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif;
    background:
      radial-gradient(circle at 78% 18%, rgba(255,92,40,0.22), transparent 42%),
      radial-gradient(circle at 14% 88%, rgba(232,179,58,0.18), transparent 46%),
      linear-gradient(135deg, #fdfaf4 0%, #f6f1e7 100%);
    color: #1f1b16;
    display: flex;
    align-items: stretch;
    overflow: hidden;
    position: relative;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(31,27,22,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(31,27,22,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 75%);
  }
  .left {
    flex: 1;
    padding: 72px 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }
  .brand-row { display: flex; align-items: center; gap: 16px; }
  .brand-mark {
    width: 60px; height: 60px;
    border-radius: 14px;
    background: linear-gradient(135deg, #ff5c28 0%, #ff8a3d 100%);
    color: #fff;
    font-weight: 800;
    font-size: 26px;
    letter-spacing: -0.5px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(255,92,40,0.32);
  }
  .brand-name { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
  h1 {
    font-size: 76px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1.5px;
    color: #1f1b16;
    max-width: 600px;
  }
  h1 .accent { color: #ff5c28; }
  .features {
    display: flex; gap: 14px;
    font-size: 20px;
    color: #5b5246;
  }
  .features span {
    padding: 8px 16px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(31,27,22,0.08);
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }
  .url { font-size: 22px; font-weight: 600; color: #ff5c28; letter-spacing: 0.5px; }

  .right {
    width: 480px;
    padding: 72px 64px 72px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  .card {
    width: 360px;
    height: 480px;
    border-radius: 24px;
    background: #fff;
    box-shadow:
      0 30px 60px rgba(31,27,22,0.18),
      0 8px 16px rgba(31,27,22,0.08);
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    transform: rotate(4deg);
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 5px;
    background: linear-gradient(90deg, #ff5c28, #e8b33a);
  }
  .card-h1 {
    font-size: 28px; font-weight: 800; line-height: 1.25;
    color: #1f1b16;
  }
  .card-p {
    font-size: 16px; line-height: 1.65; color: #4a4238;
  }
  .card-block {
    background: #faf6ef;
    border-left: 3px solid #ff5c28;
    padding: 12px 14px;
    border-radius: 6px;
    font-size: 14px;
    color: #5b5246;
  }
  .card-list { font-size: 15px; color: #4a4238; line-height: 1.9; }
  .card-list li { list-style: none; padding-left: 18px; position: relative; }
  .card-list li::before {
    content: '·'; color: #ff5c28; position: absolute; left: 6px; top: -2px;
    font-size: 22px; font-weight: 700;
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="left">
    <div class="brand-row">
      <div class="brand-mark">M2</div>
      <div class="brand-name">MD2Card</div>
    </div>
    <h1>Markdown 一键生成<br/><span class="accent">小红书卡片</span></h1>
    <div class="features">
      <span>多主题</span>
      <span>AI 成稿</span>
      <span>PNG / PDF / SVG</span>
    </div>
    <div class="url">mdcard.cn</div>
  </div>
  <div class="right">
    <div class="card">
      <div class="card-h1"># 把 Markdown<br/>变成卡片</div>
      <div class="card-p">写完 Markdown 立刻得到小红书 / 公众号 / 知识卡。</div>
      <div class="card-block">支持 H1/H2、列表、引用、代码块、图片，标题自动分页。</div>
      <ul class="card-list">
        <li>多主题模板</li>
        <li>AI 成稿</li>
        <li>多格式导出</li>
      </ul>
    </div>
  </div>
</body>
</html>`

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const buf = await page.screenshot({ type: 'png', omitBackground: false, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  await writeFile(outPath, buf)
  console.log(`[og-image] wrote ${outPath} (${buf.length} bytes, 1200x630)`)
} finally {
  await browser.close()
}

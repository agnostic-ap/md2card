import { jsPDF } from 'jspdf'
import { inlineComputedColors } from './inlineComputedStyles'
import { toBlob, toPng } from 'html-to-image'

export async function exportCardsToPdf(
  nodes: HTMLElement[],
  cardWidth: number,
  cardHeight: number,
  pixelRatio = 2,
  fileName = 'cards.pdf',
): Promise<void> {
  if (nodes.length === 0) throw new Error('没有可导出的卡片')

  const pdf = new jsPDF({
    orientation: cardWidth <= cardHeight ? 'portrait' : 'landscape',
    unit: 'px',
    format: [cardWidth, cardHeight],
    hotfixes: ['px_scaling'],
  })

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const restore = inlineComputedColors(node)
    let blob: Blob | null = null
    try {
      blob = await toBlob(node, { pixelRatio, cacheBust: true })
    } finally {
      restore()
    }
    if (!blob) continue

    const dataUrl = await blobToDataUrl(blob)
    if (i > 0) pdf.addPage([cardWidth, cardHeight])
    pdf.addImage(dataUrl, 'PNG', 0, 0, cardWidth, cardHeight)
  }

  pdf.save(fileName)
}

// ── A4 document PDF ──────────────────────────────────────────────────────────
// Renders the full markdown content as a flowing A4 document (not card images).

export async function exportMarkdownToA4Pdf(
  markdown: string,
  themeVariables: Record<string, string>,
  overrides: {
    fgColor?: string | null
    headingColor?: string | null
    accentColor?: string | null
    fontFamily?: string | null
    fontScale?: number
  },
  pixelRatio = 2,
  fileName = 'document-a4.pdf',
): Promise<void> {
  const A4_W = 794
  const A4_H = 1123
  const DOC_PADDING = 56

  // Replace card split markers with visual dividers for document layout
  const docMarkdown = markdown.replace(/^===$\n?/gm, '\n---\n\n')

  // ── render container ─────────────────────────────────────────────────────
  // Wrap the capture container in a zero-size fixed wrapper so the user never
  // sees it, but the browser still fully lays out and paints the content —
  // which is required for html-to-image to produce a non-blank image.
  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0px',
    height: '0px',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: '0',
  })

  const container = document.createElement('div')
  Object.assign(container.style, {
    width: `${A4_W}px`,
    background: themeVariables['--card-bg'] ?? '#ffffff',
    boxSizing: 'border-box',
    padding: `${DOC_PADDING}px`,
  })

  // Apply theme CSS variables
  for (const [key, val] of Object.entries(themeVariables)) {
    container.style.setProperty(key, val)
  }

  // Apply user overrides
  if (overrides.fgColor)      container.style.setProperty('--card-fg', overrides.fgColor)
  if (overrides.headingColor) container.style.setProperty('--heading-color', overrides.headingColor)
  if (overrides.accentColor)  container.style.setProperty('--accent', overrides.accentColor)
  if (overrides.fontFamily) {
    container.style.setProperty('--body-font', overrides.fontFamily)
    container.style.setProperty('--heading-font', overrides.fontFamily)
  }
  container.style.setProperty('--font-scale', String(overrides.fontScale ?? 1))

  wrapper.appendChild(container)
  document.body.appendChild(wrapper)

  // ── render markdown via React ─────────────────────────────────────────────
  const [{ createRoot }, { flushSync }, React, { MarkdownCardBody }] = await Promise.all([
    import('react-dom/client'),
    import('react-dom'),
    import('react'),
    import('@/features/preview/MarkdownCardBody'),
  ])

  const root = createRoot(container)
  // flushSync forces synchronous React render before reading layout
  flushSync(() => {
    root.render(React.createElement(MarkdownCardBody, { content: docMarkdown }))
  })
  await document.fonts.ready
  // Brief wait for any remaining paint / image decode
  await new Promise(resolve => setTimeout(resolve, 100))

  const fullHeight = container.scrollHeight
  if (fullHeight === 0) {
    root.unmount()
    document.body.removeChild(wrapper)
    throw new Error('文档渲染失败，内容高度为 0')
  }

  // ── capture full document as one image ───────────────────────────────────
  // Briefly expand the wrapper so html-to-image can paint the full element.
  wrapper.style.width = `${A4_W}px`
  wrapper.style.height = `${fullHeight}px`

  const restore = inlineComputedColors(container)
  let fullDataUrl: string
  try {
    fullDataUrl = await toPng(container, {
      pixelRatio,
      cacheBust: true,
    })
  } finally {
    restore()
    wrapper.style.width = '0px'
    wrapper.style.height = '0px'
  }

  // ── slice into A4 pages using canvas ─────────────────────────────────────
  const img = new Image()
  img.src = fullDataUrl
  await new Promise<void>(resolve => { img.onload = () => resolve() })

  const pages = Math.ceil(fullHeight / A4_H)
  const physW = A4_W * pixelRatio
  const physPageH = A4_H * pixelRatio
  const physTotalH = fullHeight * pixelRatio

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [A4_W, A4_H],
    hotfixes: ['px_scaling'],
  })

  for (let i = 0; i < pages; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = physW
    canvas.height = physPageH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = themeVariables['--card-bg'] ?? '#ffffff'
    ctx.fillRect(0, 0, physW, physPageH)
    ctx.drawImage(img, 0, -(i * physPageH), physW, physTotalH)
    const pageDataUrl = canvas.toDataURL('image/png')

    if (i > 0) pdf.addPage([A4_W, A4_H])
    pdf.addImage(pageDataUrl, 'PNG', 0, 0, A4_W, A4_H)
  }

  pdf.save(fileName)

  // ── cleanup ───────────────────────────────────────────────────────────────
  root.unmount()
  document.body.removeChild(container)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

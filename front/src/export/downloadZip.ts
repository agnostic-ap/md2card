import { toBlob } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { inlineComputedColors } from './inlineComputedStyles'

export async function downloadCardsAsPngZip(
  nodes: (HTMLElement | null | undefined)[],
  baseName = 'cards',
  pixelRatio = 2,
): Promise<void> {
  const zip = new JSZip()
  let i = 0
  for (const node of nodes) {
    if (!node) continue
    i += 1
    const restore = inlineComputedColors(node)
    let blob: Blob | null = null
    try {
      blob = await toBlob(node, { pixelRatio, cacheBust: true })
    } finally {
      restore()
    }
    if (!blob) throw new Error(`第 ${i} 张卡片导出失败，请重试`)
    zip.file(`${baseName}_${String(i).padStart(2, '0')}.png`, blob)
  }
  const out = await zip.generateAsync({ type: 'blob' })
  saveAs(out, `${baseName}.zip`)
}

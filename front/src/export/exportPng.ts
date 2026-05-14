import { toPng } from 'html-to-image'
import { inlineComputedColors } from './inlineComputedStyles'

export async function exportNodeToPng(node: HTMLElement, pixelRatio = 2): Promise<string> {
  const restore = inlineComputedColors(node)
  try {
    return await toPng(node, { pixelRatio, cacheBust: true })
  } finally {
    restore()
  }
}

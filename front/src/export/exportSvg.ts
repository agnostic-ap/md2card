import { toSvg } from 'html-to-image'
import { inlineComputedColors } from './inlineComputedStyles'

export async function exportNodeToSvg(node: HTMLElement): Promise<string> {
  const restore = inlineComputedColors(node)
  try {
    return await toSvg(node, {
      cacheBust: true,
    })
  } finally {
    restore()
  }
}

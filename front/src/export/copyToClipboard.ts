import { toBlob } from 'html-to-image'
import { inlineComputedColors } from './inlineComputedStyles'

export async function copyCardPngToClipboard(node: HTMLElement, pixelRatio = 2): Promise<void> {
  const restore = inlineComputedColors(node)
  let blob: Blob | null = null
  try {
    blob = await toBlob(node, { pixelRatio, cacheBust: true })
  } finally {
    restore()
  }
  if (!blob) {
    throw new Error('无法生成图片')
  }
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('当前环境不支持复制图片到剪贴板')
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ])
}

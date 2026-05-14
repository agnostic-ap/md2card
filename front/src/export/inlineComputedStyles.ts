// 在导出前把节点子树里使用了 CSS 变量 (var(--xxx)) 的关键样式
// 按 getComputedStyle 解析为字面色值并写到 inline style，导出结束后恢复。
// 解决 html-to-image 在 SVG foreignObject 内无法继承 inline custom properties 的问题。

const COLOR_PROPS = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'box-shadow',
  'caret-color',
  'outline-color',
  'fill',
  'stroke',
] as const

type Snapshot = Map<HTMLElement, Record<string, string>>

export function inlineComputedColors(root: HTMLElement): () => void {
  const all: HTMLElement[] = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>('*')),
  ]
  const snapshots: Snapshot = new Map()

  for (const el of all) {
    const computed = window.getComputedStyle(el)
    const original: Record<string, string> = {}

    for (const prop of COLOR_PROPS) {
      original[prop] = el.style.getPropertyValue(prop)
    }
    snapshots.set(el, original)

    for (const prop of COLOR_PROPS) {
      const value = computed.getPropertyValue(prop)
      if (value) {
        el.style.setProperty(prop, value)
      }
    }
  }

  return () => {
    for (const [el, original] of snapshots) {
      for (const prop of COLOR_PROPS) {
        const orig = original[prop]
        if (orig) {
          el.style.setProperty(prop, orig)
        } else {
          el.style.removeProperty(prop)
        }
      }
    }
  }
}

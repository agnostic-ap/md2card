export type Snippet = {
  id: string
  label: string
  preview?: string
  content: string
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'page-break',
    label: '分页符（拆下一张卡片）',
    preview: '在当前位置插入 ===，下方内容变成新一张卡',
    content: `===
`,
  },
  {
    id: 'cta-actions',
    label: 'CTA · 点赞收藏关注',
    preview: '👍 点赞  🌟 收藏  💬 评论  🔔 关注',
    content: `---

👍 **点赞** 如果内容对你有帮助

🌟 **收藏** 方便下次直接查阅

💬 **评论** 你最想了解哪方面

🔔 **关注** 持续更新干货内容`,
  },
  {
    id: 'summary-quote',
    label: '总结金句',
    preview: '👉 记住一句话：...',
    content: `> 👉 **记住一句话：**
>
> ...`,
  },
]

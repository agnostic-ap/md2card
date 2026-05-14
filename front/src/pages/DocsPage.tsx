import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useEditor } from '@/state/EditorContext'
import { cn } from '@/lib/utils'
import { AdSlot } from '@/components/ads/AdSlot'
import { BrandMark } from '@/components/BrandMark'

// ── TOC definition ────────────────────────────────────────────────────────────

const TOC = [
  { id: 'shortcuts', label: '快捷键' },
  { id: 'splitting', label: '卡片分页' },
  { id: 'export',    label: '导出格式' },
  { id: 'images',    label: '图片处理' },
  { id: 'saving',    label: '分享与保存' },
  { id: 'markdown',  label: 'Markdown 速查' },
  { id: 'ai',        label: 'AI 生成' },
] as const

type TocId = typeof TOC[number]['id']

// ── active-section tracker ────────────────────────────────────────────────────

function useActiveSection(): TocId {
  const [active, setActive] = useState<TocId>(TOC[0].id)

  useEffect(() => {
    const update = () => {
      // Walk TOC backwards; first one whose top is above 40% of viewport wins
      const threshold = window.innerHeight * 0.4
      let found: TocId = TOC[0].id
      for (const { id } of TOC) {
        const top = document.getElementById(id)?.getBoundingClientRect().top ?? Infinity
        if (top <= threshold) found = id
      }
      setActive(found)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return active
}

// ── smooth scroll helper ──────────────────────────────────────────────────────

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── primitives ────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.6rem] items-center justify-center rounded-md border border-(--border) bg-(--surface-wash) px-1.5 py-[3px] font-mono text-[11px] font-semibold leading-none text-(--foreground) shadow-[0_2px_0_var(--border)]">
      {children}
    </kbd>
  )
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
    </span>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-(--border)/60 bg-(--border)/25 px-1.5 py-0.5 font-mono text-[0.8em] text-(--foreground)">
      {children}
    </code>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-(--accent-ui)/25 bg-(--accent-ui)/7 px-4 py-3 text-sm leading-relaxed text-(--muted-foreground)">
      <span className="mt-px size-5 shrink-0 rounded bg-(--accent-ui)/15 text-center text-xs leading-5 text-(--accent-ui)">i</span>
      <div>{children}</div>
    </div>
  )
}

// ── section wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    // scroll-mt: header(~52px) + mobile-bar(~44px) + breathing room → 24 = 96px
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-5 w-1 rounded-full bg-(--accent-ui)" />
        <h2 className="text-[1.1rem] font-bold tracking-tight text-(--foreground)">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ── shortcut group card ───────────────────────────────────────────────────────

type ShortcutDef = { keys: string[]; label: string; note?: string }

function ShortcutGroup({ title, items }: { title: string; items: ShortcutDef[] }) {
  return (
    <div className="app-panel overflow-hidden">
      <div className="app-panel-titlebar border-b border-(--border) px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
        {title}
      </div>
      <div className="divide-y divide-(--border)/50">
        {items.map((item, i) => (
          <div
            key={i}
            className="grid items-center gap-4 px-4 py-2.5 transition-colors hover:bg-(--border)/15"
            style={{ gridTemplateColumns: 'minmax(0, 8rem) 1fr' }}
          >
            <Keys keys={item.keys} />
            <div className="min-w-0">
              <span className="text-sm font-medium text-(--foreground)">{item.label}</span>
              {item.note && (
                <span className="ml-2 text-xs leading-snug text-(--muted-foreground)">{item.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── export card ───────────────────────────────────────────────────────────────

function ExportCard({ format, badge, desc }: { format: string; badge?: string; desc: string }) {
  return (
    <div className="app-panel flex gap-4 p-4">
      <div className="flex shrink-0 flex-col items-start gap-1.5">
        <span className="rounded-md bg-(--accent-ui)/10 px-2 py-1 font-mono text-xs font-bold text-(--accent-ui)">
          {format}
        </span>
        {badge && (
          <span className="rounded-md bg-(--border)/50 px-2 py-0.5 text-[10px] text-(--muted-foreground)">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-(--muted-foreground)">{desc}</p>
    </div>
  )
}

// ── bullet list card ──────────────────────────────────────────────────────────

function BulletCard({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <div className="app-panel overflow-hidden">
      {items.map(({ title, body }, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-4 px-4 py-3',
            i < items.length - 1 && 'border-b border-(--border)/60',
          )}
        >
          <div className="mt-0.5 size-1.5 shrink-0 translate-y-[7px] rounded-full bg-(--accent-ui)" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold text-(--foreground)">{title} </span>
            <span className="text-(--muted-foreground)">{body}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── sidebar nav ───────────────────────────────────────────────────────────────

function SidebarNav({ active }: { active: TocId }) {
  return (
    // top-[4.5rem] ≈ header height (52px) + 20px breathing room
    <nav className="sticky top-[5.25rem] space-y-1 rounded-md border border-(--border) bg-(--card-shell)/65 p-2 shadow-[var(--shadow-panel)] backdrop-blur">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
        目录
      </p>
      {TOC.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollTo(id)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
            active === id
              ? 'bg-(--accent-ui)/10 font-medium text-(--accent-ui)'
              : 'text-(--muted-foreground) hover:bg-(--border)/30 hover:text-(--foreground)',
          )}
        >
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full transition-colors',
              active === id ? 'bg-(--accent-ui)' : 'bg-(--border)',
            )}
          />
          {label}
        </button>
      ))}
    </nav>
  )
}

// ── mobile top nav bar ────────────────────────────────────────────────────────

function MobileNav({ active }: { active: TocId }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll active pill into view
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const activeEl = container.querySelector<HTMLElement>('[data-active="true"]')
    if (activeEl) {
      const { left, right } = activeEl.getBoundingClientRect()
      const { left: cl, right: cr } = container.getBoundingClientRect()
      if (left < cl) container.scrollBy({ left: left - cl - 16, behavior: 'smooth' })
      else if (right > cr) container.scrollBy({ left: right - cr + 16, behavior: 'smooth' })
    }
  }, [active])

  return (
    <div
      // top-[3.25rem] ≈ sticky header height
      className="sticky top-[3.5rem] z-10 border-b border-(--border) bg-(--background)/90 backdrop-blur supports-[backdrop-filter]:bg-(--background)/80 md:hidden"
    >
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TOC.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            data-active={active === id}
            onClick={() => scrollTo(id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
              active === id
                ? 'bg-(--accent-ui)/15 font-medium text-(--accent-ui)'
                : 'text-(--muted-foreground) hover:bg-(--border)/30 hover:text-(--foreground)',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export function DocsPage() {
  const { state, dispatch } = useEditor()
  const active = useActiveSection()

  return (
    <div
      className={cn(
        'min-h-dvh bg-(--background) text-(--foreground)',
        state.appTheme === 'dark' && 'dark',
      )}
    >
      {/* ── sticky header ── */}
      <header className="app-chrome-header sticky top-0 z-20">
        <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="#/app"
            className="flex h-8 items-center gap-1.5 rounded-md border border-(--border) bg-(--card-shell)/70 px-2.5 text-sm text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground)"
          >
            <ArrowLeft className="size-3.5" />
            返回编辑器
          </a>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <BrandMark />
            <span className="truncate text-sm font-semibold text-(--foreground)">MD2Card 文档</span>
          </div>
          <button
            type="button"
            title={state.appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            onClick={() =>
              dispatch({ type: 'setAppTheme', payload: state.appTheme === 'dark' ? 'light' : 'dark' })
            }
            className="inline-flex size-8 items-center justify-center rounded-md border border-(--border) bg-(--card-shell)/70 text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground)"
          >
            {state.appTheme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </header>

      {/* ── mobile nav bar (hidden on md+) ── */}
      <MobileNav active={active} />

      {/* ── two-column layout ── */}
      <div className="bg-[radial-gradient(circle_at_18%_8%,rgba(255,92,40,0.06),transparent_34%),radial-gradient(circle_at_82%_92%,rgba(232,179,58,0.05),transparent_42%)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:gap-10">

          {/* ── desktop sidebar (hidden below md) ── */}
          <aside className="hidden md:block md:w-48 md:shrink-0 lg:w-52">
            <SidebarNav active={active} />
          </aside>

          {/* ── main content ── */}
          <main className="min-w-0 flex-1 space-y-14 py-10 md:py-14">

            {/* hero */}
            <div className="app-panel relative overflow-hidden p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-(--accent-ui)/20 bg-(--accent-ui)/10 px-3 py-1.5 text-xs font-medium text-(--accent-ui)">
                Docs · MD2Card 工作流手册
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-(--foreground) md:text-5xl">
                使用文档
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted-foreground)">
                MD2Card 是一款把 Markdown 转换为图片、PDF 的在线工具，支持多主题和样式自定义。
                本页收录了快捷键、功能说明和常见问题。
              </p>
              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                {['Markdown 写作', '样式与导出', 'AI 生成'].map((item) => (
                  <div key={item} className="rounded-md border border-(--border) bg-(--surface-wash) px-3 py-2 font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 快捷键 ── */}
            <Section id="shortcuts" title="快捷键">
              <p className="text-sm text-(--muted-foreground)">
                快捷键在编辑器获得焦点时生效。
                <Kbd>Mod</Kbd>
                <span className="ml-1.5">
                  = macOS 上的 <Kbd>⌘ Cmd</Kbd>，Windows / Linux 上的 <Kbd>Ctrl</Kbd>。
                </span>
              </p>

              <ShortcutGroup
                title="文字格式"
                items={[
                  { keys: ['⌘', 'B'],       label: '粗体',    note: '包裹 **…**，再按取消' },
                  { keys: ['⌘', 'I'],       label: '斜体',    note: '包裹 *…*，再按取消' },
                  { keys: ['⌘', 'E'],       label: '行内代码', note: '包裹 `…`' },
                  { keys: ['⌘', '⇧', 'X'], label: '删除线',  note: '包裹 ~~…~~' },
                  { keys: ['⌘', '⇧', 'U'], label: '下划线',  note: '包裹 <u>…</u>' },
                  { keys: ['⌘', '⇧', 'M'], label: '高亮',    note: '包裹 <mark>…</mark>' },
                ]}
              />

              <ShortcutGroup
                title="插入"
                items={[
                  {
                    keys: ['⌘', 'K'],
                    label: '插入链接',
                    note: '有选区 → [选区](url)，光标跳到 URL；无选区 → 光标在标签位置',
                  },
                ]}
              />

              <ShortcutGroup
                title="通用编辑（CodeMirror 内置）"
                items={[
                  { keys: ['⌘', 'Z'],       label: '撤销' },
                  { keys: ['⌘', '⇧', 'Z'], label: '重做' },
                  { keys: ['⌘', 'A'],       label: '全选' },
                  { keys: ['⌘', '/'],       label: '切换行注释' },
                  { keys: ['Tab'],          label: '增加缩进（代码块内）' },
                  { keys: ['⇧', 'Tab'],    label: '减少缩进' },
                ]}
              />

              <Tip>
                格式快捷键均支持「切换」——对已被包裹的文字再按一次，自动去掉标记。
                未选中时按快捷键，会在光标处插入空标记并将光标置于中间，方便直接输入。
              </Tip>
            </Section>

            {/* ── 卡片分页 ── */}
            <Section id="splitting" title="卡片分页">
              <p className="text-sm leading-relaxed text-(--muted-foreground)">
                在内容中单独写一行 <Code>===</Code> 即可将文章拆成多张卡片。
                需要在控制面板「布局与排版」中开启
                <strong className="font-semibold text-(--foreground)">「横线拆分多卡片」</strong>。
              </p>
              <div className="app-panel overflow-hidden">
                <div className="app-panel-titlebar border-b border-(--border) px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
                  示例
                </div>
                <pre className="overflow-x-auto bg-(--card-shell) p-4 font-mono text-sm leading-6 text-(--foreground)">
                  <span className="text-(--muted-foreground)"># 第一张卡片标题{'\n'}</span>
                  <span>这里是第一张的正文内容……{'\n'}</span>
                  <span className="font-bold text-(--accent-ui)">{'\n'}==={'\n'}</span>
                  <span className="text-(--muted-foreground)">{'\n'}# 第二张卡片标题{'\n'}</span>
                  <span>这里是第二张的正文内容……</span>
                </pre>
              </div>
            </Section>

            {/* ── 导出格式 ── */}
            <Section id="export" title="导出格式">
              <div className="grid gap-3 sm:grid-cols-2">
                <ExportCard
                  format="PNG"
                  badge="推荐格式"
                  desc="单张直接下载，多张自动打包为 ZIP。支持 1×（普通）/ 2×（推荐）/ 3×（高清）三档分辨率。"
                />
                <ExportCard
                  format="卡片 PDF"
                  badge="每页一张"
                  desc="每张卡片占一整页，页面尺寸与卡片相同，适合发送预览或作幻灯片。"
                />
                <ExportCard
                  format="A4 PDF"
                  badge="两列排版"
                  desc="卡片自动缩放为两列排布在 A4 纸上，多张自动分页，适合打印学习资料或归档。"
                />
                <ExportCard
                  format="SVG"
                  badge="矢量格式"
                  desc="无限缩放不失真。单张直接下载，多张打包为 ZIP。"
                />
                <ExportCard
                  format=".md"
                  badge="纯文本"
                  desc="导出原始 Markdown 文件，可在其他编辑器继续编辑或作备份。"
                />
              </div>
            </Section>

            {/* ── 图片处理 ── */}
            <Section id="images" title="图片处理">
              <BulletCard items={[
                {
                  title: '粘贴图片',
                  body: <>直接将截图粘贴到编辑器，会自动转为 Base64 数据嵌入文档。图片超过 500&nbsp;KB 时会出现体积提示。</>,
                },
                {
                  title: '外链图片与跨域',
                  body: <>使用其他网站的图片链接时，导出时该图片可能因浏览器跨域限制显示为空白。建议先将图片上传至图床（如七牛云、阿里云 OSS），再使用图床提供的稳定链接。</>,
                },
                {
                  title: '插入语法',
                  body: <><Code>![图片描述](图片链接)</Code>。点击工具栏图片图标可快速插入模板，或使用 <Kbd>⌘</Kbd><Kbd>K</Kbd> 插入链接后手动改为图片格式。</>,
                },
              ]} />
            </Section>

            {/* ── 分享与保存 ── */}
            <Section id="saving" title="分享与保存">
              <BulletCard items={[
                {
                  title: '自动保存',
                  body: '内容和配置每隔约 1.5 秒自动保存到浏览器本地存储（localStorage），刷新或重新打开标签页后仍保留。',
                },
                {
                  title: '分享链接',
                  body: '点击顶栏「分享」按钮，生成包含全部内容和样式的 URL 并复制到剪贴板。对方打开链接即可看到完整卡片，无需登录。注意：链接包含完整内容，请勿分享敏感信息。',
                },
                {
                  title: '重置',
                  body: '顶栏「重置」按钮会清除所有本地内容和配置，恢复到初始示例状态，此操作不可撤销。',
                },
              ]} />
            </Section>

            {/* ── Markdown 速查 ── */}
            <Section id="markdown" title="Markdown 速查">
              <div className="app-panel overflow-hidden">
                <div className="app-panel-titlebar grid grid-cols-2 border-b border-(--border) text-[11px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
                  <div className="px-4 py-2">语法</div>
                  <div className="border-l border-(--border) px-4 py-2">效果</div>
                </div>
                {[
                  { syntax: '# 文字',    result: '一级标题' },
                  { syntax: '## 文字',   result: '二级标题（带下划线）' },
                  { syntax: '### 文字',  result: '三级标题（带竖条装饰）' },
                  { syntax: '**文字**',  result: '粗体' },
                  { syntax: '*文字*',    result: '斜体' },
                  { syntax: '~~文字~~',  result: '删除线' },
                  { syntax: '`代码`',    result: '行内代码' },
                  { syntax: '> 文字',    result: '引用块' },
                  { syntax: '- 文字',    result: '无序列表' },
                  { syntax: '1. 文字',   result: '有序列表' },
                  { syntax: '---',       result: '水平分隔线' },
                  { syntax: '===',       result: '卡片分页线（需开启拆分）' },
                ].map(({ syntax, result }, i) => (
                  <div
                    key={i}
                    className={cn(
                      'grid grid-cols-2 text-sm transition-colors hover:bg-(--border)/15',
                      i % 2 === 0 ? 'bg-(--card-shell)' : 'bg-transparent',
                    )}
                  >
                    <div className="px-4 py-2.5 font-mono text-xs text-(--foreground)">{syntax}</div>
                    <div className="border-l border-(--border) px-4 py-2.5 text-(--muted-foreground)">{result}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── AI 生成 ── */}
            <Section id="ai" title="AI 生成">
              <p className="text-sm leading-relaxed text-(--muted-foreground)">
                点击编辑器工具栏的 <strong className="text-(--foreground)">AI 生成</strong> 按钮，
                输入主题或问题，可自动生成结构化的双语图文卡片内容并填入编辑器。
                目前有两种调用方式：
              </p>

              <div className="app-panel overflow-hidden">
                <div className="app-panel-titlebar border-b border-(--border) px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
                  API Key 模式（推荐）
                </div>
                <div className="px-4 py-3 text-sm leading-relaxed text-(--muted-foreground)">
                  <p>在弹窗中填入 Anthropic API Key 即可使用，无需任何本地环境。</p>
                  <ol className="mt-2 space-y-1 pl-4 list-decimal">
                    <li>前往 <Code>console.anthropic.com/settings/keys</Code> 创建 API Key</li>
                    <li>在 AI 生成弹窗「API Key」标签页填入密钥</li>
                    <li>选择模型，输入主题，点击生成即可</li>
                  </ol>
                  <p className="mt-2 text-xs">Key 仅保存在本地浏览器，不会上传到任何服务器。</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-amber-500/25 bg-(--card-shell) shadow-[var(--shadow-panel)]">
                <div className="border-b border-amber-500/25 bg-amber-500/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  本地 Claude Code 模式（需开发环境）
                </div>
                <div className="px-4 py-3 text-sm leading-relaxed text-(--muted-foreground)">
                  <p>复用本机已登录的 Claude Code 鉴权，无需额外 API Key，但需要完整的本地开发环境。</p>
                  <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ 如果您不熟悉命令行操作，建议使用 API Key 模式。
                  </div>
                  <p className="mt-3 font-medium text-(--foreground)">前置条件：</p>
                  <ol className="mt-1 space-y-1 pl-4 list-decimal">
                    <li>已安装 <Code>Node.js</Code> 和 <Code>npm</Code></li>
                    <li>已克隆并运行本项目源码（<Code>npm install</Code> 完成）</li>
                    <li>已在本机安装并登录 <Code>Claude Code</Code>（<Code>claude</Code> 命令可用）</li>
                  </ol>
                  <p className="mt-3 font-medium text-(--foreground)">启动代理服务：</p>
                  <pre className="mt-1 overflow-x-auto rounded-md bg-(--background) px-3 py-2 font-mono text-xs text-(--foreground)">
                    {'# 在项目根目录另开一个终端\nnpm run proxy'}
                  </pre>
                  <p className="mt-2 text-xs">
                    代理启动后，AI 生成弹窗中会显示「代理运行中」，即可正常使用。
                  </p>
                </div>
              </div>
            </Section>

            <AdSlot
              placement="docs-footer"
              variant="compact"
              title="需要一套稳定的内容卡片流程？"
              description="从文案到导出都在 MD2Card 里完成，适合把资料、笔记和运营内容做成统一视觉。"
            />

          </main>
        </div>
      </div>
      </div>

      <footer className="border-t border-(--border) bg-(--card-shell)/60 py-8 text-center text-xs text-(--muted-foreground)">
        MD2Card — Markdown 转图片 / PDF
      </footer>
    </div>
  )
}

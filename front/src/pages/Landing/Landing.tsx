import { useEffect, useState, type ReactNode } from 'react'
import { AuthDialog } from '@/features/auth/AuthDialog'
import { AdSlot } from '@/components/ads/AdSlot'
import { trackEvent } from '@/lib/analytics'
import { useAuth } from '@/state/AuthContext'
import './Landing.css'

/* ───────── Icons ───────── */
const Icon = {
  arrow: (cls = 'icn') => (
    <svg
      className={cls}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
  check: (cls = 'icn') => (
    <svg
      className={cls}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  ),
  external: (cls = 'icn') => (
    <svg
      className={cls}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M6 4H4v8h8v-2M9 3h4v4M8 8l5-5" />
    </svg>
  ),
}

/* ───────── Sample cards ───────── */
const SampleMinimal = ({ idx = '01 / 04' }: { idx?: string }) => (
  <div className="card card-minimal">
    <div className="c-h">
      高效写作的
      <br />
      三个底层逻辑
    </div>
    <div className="c-rule" />
    <div className="c-li">先想清楚再动笔，结构决定一切</div>
    <div className="c-li">每段只讲一件事，越短越锋利</div>
    <div className="c-li">写完一定大声读一遍</div>
    <div className="c-foot">
      <span>MD2Card</span>
      <span>{idx}</span>
    </div>
  </div>
)
const SampleKnowledge = () => (
  <div className="card card-knowledge">
    <div className="k-tag">Knowledge · 03</div>
    <div className="k-h">
      复利不是收益率，
      <br />
      是时间的几何
    </div>
    <div className="k-num">
      <span className="n">01</span>
      <span className="t">每天进步 1%，一年后是 37 倍</span>
    </div>
    <div className="k-num">
      <span className="n">02</span>
      <span className="t">每天退步 1%，一年后只剩 0.03</span>
    </div>
    <div className="k-num">
      <span className="n">03</span>
      <span className="t">差距不在天赋，在持续</span>
    </div>
    <div className="k-foot">
      <span>@md2card</span>
      <span>03 / 06</span>
    </div>
  </div>
)
const SampleRedbook = () => (
  <div className="card card-redbook">
    <div className="r-eyebrow">📌 收藏向</div>
    <div className="r-h">
      让人 <span className="hl">一眼记住</span> 的标题，
      <br />
      都有这 3 个套路
    </div>
    <div className="r-tip">
      <span className="num">1</span>
      <span>带数字：3 个、5 步、7 天</span>
    </div>
    <div className="r-tip">
      <span className="num">2</span>
      <span>制造反差：越写越…，反而…</span>
    </div>
    <div className="r-tip">
      <span className="num">3</span>
      <span>给身份感：90 后的、新手的</span>
    </div>
    <div className="r-foot">
      <span>左滑看更多 →</span>
      <span>1 / 6</span>
    </div>
  </div>
)
const SampleDark = () => (
  <div className="card card-dark">
    <div className="d-mark">— Note 042</div>
    <div className="d-h">
      把复杂的事
      <br />
      说得 <span className="it">很简单</span>
    </div>
    <div className="d-quote">
      如果你不能简单地解释一件事，说明你还没有真正理解它。
    </div>
    <div className="d-meta">
      <span>费曼</span>
      <span>2024</span>
    </div>
  </div>
)
const SampleZhongshi = () => (
  <div className="card card-zhongshi">
    <div className="z-mark">壹 · 笔记</div>
    <div className="z-seal">印</div>
    <div className="z-h">
      慢即
      <br />
      是快
    </div>
    <div className="z-body">
      <p>急于求成是这个时代的通病。</p>
      <p>
        真正的成长，是把一件小事，
        <br />
        做到第一千遍。
      </p>
    </div>
    <div className="z-foot">— 摘自《长期主义笔记》</div>
  </div>
)

/* ───────── Nav ───────── */
const Nav = ({ onSignIn }: { onSignIn: () => void }) => {
  const [scrolled, setScrolled] = useState(false)
  const { user, loading } = useAuth()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="container nav-inner">
        <a href="#/" className="brand">
          <span className="brand-mark">M2</span>
          <span>MD2Card</span>
        </a>
        <div className="nav-links">
          <a href="#features">功能</a>
          <a href="#workflow">流程</a>
          <a href="#scenes">场景</a>
          <a href="#/docs">文档</a>
        </div>
        <div className="nav-spacer" />
        <div className="nav-cta">
          {!loading && (user ? (
            <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', opacity: 0.7 }}>
              {user.name}
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onSignIn}>
              登录
            </button>
          ))}
          <a
            href="#/app"
            className="btn btn-nav-primary btn-sm"
            onClick={() =>
              trackEvent('cta_click', { placement: 'nav', target: 'app' })
            }>
            进入工作台 {Icon.arrow('icn-sm')}
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ───────── Hero ───────── */
const ToolBtn = ({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) => (
  <span className="mk-tool" title={label}>
    {children}
  </span>
)
const HeroMockup = () => {
  const [theme, setTheme] = useState(0)
  const themes = [
    { nm: '经典图文', bg: '#FFFFFF', ink: '#2563EB' },
    { nm: '苹果备忘', bg: '#FFFAEC', ink: '#B45309' },
    { nm: 'Instagram', bg: '#FCE7F3', ink: '#BE185D' },
    { nm: '线圈笔记', bg: '#F4F4F5', ink: '#3F3F46' },
    { nm: '波普艺术', bg: '#FACC15', ink: '#0A0A0A' },
    { nm: '暗黑科技', bg: '#0F172A', ink: '#06B6D4' },
  ]
  const cur = themes[theme]
  return (
    <div className="mockup">
      <div className="mk-chrome">
        <div className="dots">
          <span className="dot" style={{ background: '#FF6058' }} />
          <span className="dot" style={{ background: '#FFBE2F' }} />
          <span className="dot" style={{ background: '#28C941' }} />
        </div>
        <span className="url">
          md2card<span className="accent">.app</span> / 工作台
        </span>
      </div>
      <div className="mk-body">
        <div className="mk-ed">
          <div className="mk-toolbar">
            <ToolBtn label="H1">H1</ToolBtn>
            <ToolBtn label="Bold">B</ToolBtn>
            <ToolBtn label="Italic">
              <i>I</i>
            </ToolBtn>
            <ToolBtn label="Strike">
              <s>S</s>
            </ToolBtn>
            <ToolBtn label="Underline">
              <u>U</u>
            </ToolBtn>
            <span className="mk-tool-sep" />
            <ToolBtn label="Link">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6">
                <path d="M6 9l4-4M5 11l-1 1a2 2 0 11-3-3l1-1M11 5l1-1a2 2 0 113 3l-1 1" />
              </svg>
            </ToolBtn>
            <ToolBtn label="Code">
              <span style={{ fontSize: 9 }}>{'<>'}</span>
            </ToolBtn>
            <ToolBtn label="Quote">"</ToolBtn>
            <ToolBtn label="List">≡</ToolBtn>
            <span className="mk-tool-spacer" />
            <span className="mk-tool-pill">
              <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0l1.2 3.8L11 5l-3.8 1.2L6 10 4.8 6.2 1 5l3.8-1.2L6 0z" />
              </svg>
              AI 生成
            </span>
            <span className="mk-tool-pill alt" style={{ marginLeft: 4 }}>
              常用 ▾
            </span>
          </div>
          <div className="mk-code">
            <div className="ln">
              <span className="tk-h1"># MD2Card 使用入门</span>
            </div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-q">{'>'}</span> 把 Markdown 变成精美图片或 PDF
            </div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-st">**粘贴文字**</span>{' '}
              <span className="tk-mu">→</span>{' '}
              <span className="tk-st">**选主题**</span>{' '}
              <span className="tk-mu">→</span>{' '}
              <span className="tk-st">**导出图片**</span>
            </div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-hr">- - -</span>
            </div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-h2">### 文字格式</span>
            </div>
            <div className="ln" />
            <div className="ln">支持常见 Markdown 语法：</div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-li">-</span>{' '}
              <span className="tk-st">**粗体**</span>{' '}
              <span className="tk-em">*斜体*</span>{' '}
              <span className="tk-ic">`代码`</span>
            </div>
            <div className="ln">
              <span className="tk-li">-</span> 插入链接{' '}
              <span className="tk-lk">[文字](url)</span>
            </div>
            <div className="ln" />
            <div className="ln">
              <span className="tk-h2">## 多卡片分页</span>
            </div>
            <div className="ln" />
            <div className="ln">
              单独一行 <span className="tk-ic">`===`</span> 即可分页。
            </div>
          </div>
        </div>
        <div className="mk-pv">
          <div className="mk-pv-head">
            预览 <span className="accent">·</span> 2 张卡片
          </div>
          <div className="mk-pv-themes">
            {themes.map((th, i) => (
              <span
                key={i}
                className={'mk-pv-chip' + (i === theme ? ' active' : '')}
                onClick={() => setTheme(i)}
                style={{
                  background: th.bg,
                  color: th.ink,
                  borderColor: i === theme ? '#5BA8FF' : 'transparent',
                }}
                title={th.nm}>
                Aa
              </span>
            ))}
          </div>
          <div
            className="mk-card"
            style={{
              background: cur.bg,
              color: cur.ink === '#06B6D4' ? '#E2E8F0' : undefined,
            }}>
            <div className="border-top" style={{ background: cur.ink }} />
            <div className="mk-logo">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 12 L8 4 L13 12 L11 12 L8 7.5 L5 12 Z" />
                <circle cx="8" cy="3" r="1" />
              </svg>
            </div>
            <h3 style={{ color: cur.ink }}>MD2Card 使用入门</h3>
            <div
              className="mk-quote"
              style={{
                borderLeftColor: cur.ink,
                background: theme === 5 ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                color: theme === 5 ? '#94A3B8' : '#334155',
              }}>
              把 Markdown 变成精美图片或 PDF，三步搞定
            </div>
            <p style={{ color: theme === 5 ? '#94A3B8' : '#475569' }}>
              <span
                className="mk-link"
                style={{ color: cur.ink, textDecorationColor: cur.ink + '55' }}>
                粘贴文字
              </span>{' '}
              →{' '}
              <span
                className="mk-link"
                style={{ color: cur.ink, textDecorationColor: cur.ink + '55' }}>
                选主题
              </span>{' '}
              →{' '}
              <span
                className="mk-link"
                style={{ color: cur.ink, textDecorationColor: cur.ink + '55' }}>
                导出图片
              </span>
              ，就这么简单。
            </p>
            <div
              className="mk-rule"
              style={{
                background: theme === 5 ? 'rgba(148,163,184,0.18)' : '#E2E8F0',
              }}
            />
            <p
              style={{
                color: theme === 5 ? '#CBD5E1' : '#1F2937',
                fontWeight: 600,
                margin: 0,
                fontSize: 12,
              }}>
              文字格式
            </p>
            <p
              style={{
                color: theme === 5 ? '#94A3B8' : '#475569',
                marginTop: 6,
              }}>
              支持加粗、斜体、引用、列表、表格⋯
            </p>
            <div className="mk-foot">1 / 2</div>
          </div>
          <div className="mk-pager">
            <span className="pg active">1</span>
            <span className="pg">2</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const Hero = () => (
  <section className="hero">
    <div className="container hero-grid">
      <div>
        <div className="hero-tag">
          <span className="hero-tag-pill">v0.9</span>
          <span>从 Markdown 到可发布的内容卡片，几分钟搞定</span>
        </div>
        <h1 className="hero-title">
          写 Markdown，
          <br />
          得到<span className="accent underline"> 可以直接发 </span>的<br />
          内容卡片。
        </h1>
        <p className="hero-sub">
          MD2Card 是一个为内容创作者打造的 <strong>卡片工作台</strong>。
          把草稿粘进去，挑一套主题，导出 PNG / PDF / SVG —— 不再为排版反复折腾
          Figma。
        </p>
        <div className="hero-actions">
          <a
            href="#/app"
            className="btn btn-accent btn-lg"
            onClick={() =>
              trackEvent('cta_click', { placement: 'hero', target: 'app' })
            }>
            进入工作台 {Icon.arrow()}
          </a>
          <a href="#workflow" className="btn btn-outline btn-lg">
            看看流程
          </a>
        </div>
        <div className="hero-meta">
          <span className="check">
            {Icon.check('icn-sm')} 浏览器内运行，零安装
          </span>
          <span className="check">
            {Icon.check('icn-sm')} 草稿与模板本地保存
          </span>
        </div>
      </div>
      <div>
        <HeroMockup />
      </div>
    </div>
  </section>
)

/* ───────── Template strip ───────── */
const TemplateStrip = () => (
  <section
    id="templates"
    className="section-tight"
    style={{ paddingBottom: 32 }}>
    <div className="container" style={{ marginBottom: 24 }}>
      <div className="eyebrow">
        <span className="dot" />
        模板预览 / Templates
      </div>
      <h2 className="section-title" style={{ fontSize: 34, marginTop: 12 }}>
        每张卡片，<em>都已经为发布准备好</em>。
      </h2>
    </div>
    <div className="cards-strip-wrap">
      <div className="cards-strip">
        <SampleMinimal idx="极简 · Minimal" />
        <SampleKnowledge />
        <SampleRedbook />
        <SampleDark />
        <SampleZhongshi />
        <SampleMinimal idx="还有 12 套 →" />
      </div>
    </div>
  </section>
)

/* ───────── Features ───────── */
const Features = () => (
  <section id="features" className="section">
    <div className="container">
      <div className="eyebrow">
        <span className="dot" />
        核心能力 / Capabilities
      </div>
      <h2 className="section-title">
        一个工作台，<em>覆盖</em> 内容卡片的
        <br />
        全部生产环节。
      </h2>
      <p className="section-sub">
        从写、改、排、导，到品牌资产复用 —— 把以前散落在
        Notion、ChatGPT、Figma、Photoshop 之间的步骤合成一条流。
      </p>
      <div className="feat-grid">
        <div className="feat-card col-7">
          <div className="f-num">01 / WRITE</div>
          <h3 className="f-h">Markdown 是最快的内容容器</h3>
          <p className="f-d">
            标题、列表、粗体、引用、表格、分隔符分页 ——
            你已经会的语法，全部可用。一份 Markdown 同步出多张卡片。
          </p>
          <div className="f-art">
            <div className="f-art-md">
              <div>
                <span className="h"># 标题</span> ── 大封面
              </div>
              <div>
                <span className="h">## 小标题</span> ── 卡片标题
              </div>
              <div>
                正文 <span className="b">**加粗**</span> 与{' '}
                <span className="em">*斜体*</span>
              </div>
              <div>{'> 引用块自动应用模板样式'}</div>
              <div>{'---  或  ===  →  分页'}</div>
            </div>
          </div>
        </div>
        <div className="feat-card col-5">
          <div className="f-num">02 / DRAFT WITH AI</div>
          <h3 className="f-h">把粗想法变成成稿</h3>
          <p className="f-d">
            连接你自己的 OpenAI / Claude / 自托管模型 key。一句话描述选题，AI
            给到结构化的 Markdown 草稿。
          </p>
          <div className="f-art">
            <div className="f-art-ai">
              <div className="f-bubble user">
                写一篇关于"长期主义"的 6 张知识卡
              </div>
              <div className="f-bubble ai">
                <span className="pulse" />
                正在生成 6 段 Markdown，每段一张卡⋯
              </div>
            </div>
          </div>
        </div>
        <div className="feat-card col-5">
          <div className="f-num">03 / TEMPLATES</div>
          <h3 className="f-h">视觉模板，一秒切换</h3>
          <p className="f-d">
            内置极简、知识卡、小红书、深色、新中式等模板。自定义字体、字号、Logo、水印、页码。
          </p>
          <div className="f-art">
            <div className="f-art-template">
              <div className="f-tmp t-min">
                <span className="tt">极简</span>
              </div>
              <div className="f-tmp t-dark">
                <span className="tt">深色</span>
              </div>
              <div className="f-tmp t-red">
                <span className="tt">小红书</span>
              </div>
            </div>
          </div>
        </div>
        <div className="feat-card col-7">
          <div className="f-num">04 / EXPORT</div>
          <h3 className="f-h">PNG · SVG · PDF，一键打包 ZIP</h3>
          <p className="f-d">
            小红书选 PNG、公众号配图选 SVG、课程讲义选 PDF。多张卡片可批量打包成
            ZIP，按文件名命名。
          </p>
          <div className="f-art">
            <div className="f-art-export">
              <span className="f-pill">
                <span className="swatch" style={{ background: '#FF5C28' }} />
                PNG · 1242×1660
              </span>
              <span className="f-pill">
                <span className="swatch" style={{ background: '#1F6FB0' }} />
                SVG · 矢量
              </span>
              <span className="f-pill">
                <span className="swatch" style={{ background: '#2F8F5A' }} />
                PDF · 多页
              </span>
              <span className="f-pill">
                <span className="swatch" style={{ background: '#14110D' }} />
                ZIP · 批量
              </span>
              <span className="f-pill">3:4 · 1:1 · 9:16</span>
            </div>
          </div>
        </div>
        <div className="feat-card col-12">
          <div className="f-num">05 / BRAND</div>
          <h3 className="f-h">品牌资产复用 —— 让你的卡片有"自己的样子"</h3>
          <p className="f-d" style={{ maxWidth: 560 }}>
            自定义
            Logo、字体、主色、签名、二维码，全部存在浏览器本地。团队配置（即将上线）允许把品牌资产同步给整个内容组。
          </p>
          <div
            className="f-art"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              borderTop: '1px dashed var(--line)',
              paddingTop: 22,
            }}>
            <div className="f-art-brand">
              <div className="f-brand-mark">墨</div>
              <div className="f-brand-meta">
                <div style={{ fontWeight: 600, fontSize: 13 }}>墨工坊</div>
                <div className="f-brand-row">
                  <span
                    className="f-brand-sw"
                    style={{ background: '#FF5C28' }}
                  />
                  #FF5C28
                </div>
              </div>
            </div>
            <div className="f-art-brand">
              <div className="f-brand-mark" style={{ background: '#1F6FB0' }}>
                知
              </div>
              <div className="f-brand-meta">
                <div style={{ fontWeight: 600, fontSize: 13 }}>知识折叠</div>
                <div className="f-brand-row">
                  <span
                    className="f-brand-sw"
                    style={{ background: '#1F6FB0' }}
                  />
                  #1F6FB0
                </div>
              </div>
            </div>
            <div className="f-art-brand">
              <div
                className="f-brand-mark"
                style={{ background: '#2A1E12', color: '#F0E8D6' }}>
                朱
              </div>
              <div className="f-brand-meta">
                <div style={{ fontWeight: 600, fontSize: 13 }}>朱砂笔记</div>
                <div className="f-brand-row">
                  <span
                    className="f-brand-sw"
                    style={{ background: '#B33A2A' }}
                  />
                  #B33A2A
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

/* ───────── Workflow ───────── */
const Workflow = () => (
  <section id="workflow" className="section section-divider">
    <div className="container">
      <div className="eyebrow">
        <span className="dot" />
        工作流 / Workflow
      </div>
      <h2 className="section-title">
        从一段草稿到一组卡片，<em>四步</em>。
      </h2>
      <p className="section-sub">
        没有上传、没有等待、没有云渲染队列 —— 全部在浏览器里完成。
      </p>
      <div className="flow-wrap">
        <div className="flow-steps">
          <div className="flow-step">
            <div className="s-num">
              <span className="bullet" />
              STEP 01
            </div>
            <h3 className="s-h">写</h3>
            <p className="s-d">把草稿粘进左侧编辑器，或直接 Markdown 写。</p>
            <div className="s-art">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                  padding: '0 12px',
                }}>
                <div>
                  <span style={{ color: 'var(--accent)' }}># </span>标题
                </div>
                <div style={{ color: 'var(--ink-3)' }}>
                  正文 **加粗** *斜体*
                </div>
                <div style={{ color: 'var(--ink-4)' }}>- - -</div>
              </div>
            </div>
          </div>
          <div className="flow-step">
            <div className="s-num">
              <span className="bullet" />
              STEP 02
            </div>
            <h3 className="s-h">改</h3>
            <p className="s-d">用 AI 优化标题、改写口吻、扩成多张卡。</p>
            <div className="s-art">
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  color: 'var(--ink-2)',
                }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  AI · 改写中
                </span>
              </div>
            </div>
          </div>
          <div className="flow-step">
            <div className="s-num">
              <span className="bullet" />
              STEP 03
            </div>
            <h3 className="s-h">排</h3>
            <p className="s-d">
              挑模板、调字号、加 Logo、加水印 —— 实时看效果。
            </p>
            <div
              className="s-art"
              style={{ display: 'flex', gap: 6, padding: 8 }}>
              <div className="f-tmp t-min" style={{ flex: 1 }}>
                <span className="tt">A</span>
              </div>
              <div className="f-tmp t-dark" style={{ flex: 1 }}>
                <span className="tt">B</span>
              </div>
              <div className="f-tmp t-red" style={{ flex: 1 }}>
                <span className="tt">C</span>
              </div>
            </div>
          </div>
          <div className="flow-step">
            <div className="s-num">
              <span className="bullet" />
              STEP 04
            </div>
            <h3 className="s-h">导</h3>
            <p className="s-d">PNG / PDF / SVG / ZIP，一键拿走，直接发。</p>
            <div className="s-art" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="f-pill" style={{ height: 22, fontSize: 10 }}>
                card-01.png
              </span>
              <span className="f-pill" style={{ height: 22, fontSize: 10 }}>
                card-02.png
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

/* ───────── Scenes ───────── */
const Scenes = () => (
  <section id="scenes" className="section">
    <div className="container">
      <div className="eyebrow">
        <span className="dot" />
        使用场景 / Built for
      </div>
      <h2 className="section-title">
        在你已经习惯的<em>发布渠道</em>里，
        <br />
        卡片只是更省事的版式。
      </h2>
      <div className="scene-grid">
        <div className="scene">
          <div className="s-tag">小红书</div>
          <h3 className="s-h">图文笔记</h3>
          <p className="s-d">3:4 默认尺寸，自动分页，配备小红书风模板。</p>
          <div className="s-meta">
            <span>3:4</span>
            <span>·</span>
            <span>多张轮播</span>
          </div>
        </div>
        <div className="scene">
          <div className="s-tag">公众号</div>
          <h3 className="s-h">文中配图</h3>
          <p className="s-d">把要点摘成知识卡片，提升完读率与转发率。</p>
          <div className="s-meta">
            <span>16:9</span>
            <span>·</span>
            <span>SVG / PNG</span>
          </div>
        </div>
        <div className="scene">
          <div className="s-tag">课程</div>
          <h3 className="s-h">讲义 & 金句</h3>
          <p className="s-d">课件配套金句卡，PDF 导出，直接放进直播间。</p>
          <div className="s-meta">
            <span>PDF</span>
            <span>·</span>
            <span>多页</span>
          </div>
        </div>
        <div className="scene">
          <div className="s-tag">社群</div>
          <h3 className="s-h">运营素材</h3>
          <p className="s-d">日报、周报、活动海报、引流图统一品牌。</p>
          <div className="s-meta">
            <span>批量 ZIP</span>
          </div>
        </div>
        <div className="scene">
          <div className="s-tag">知识博主</div>
          <h3 className="s-h">读书 / 笔记</h3>
          <p className="s-d">读完一本书，顺手发一组卡片，沉淀成专栏。</p>
          <div className="s-meta">
            <span>系列模板</span>
          </div>
        </div>
      </div>
    </div>
  </section>
)

/* ───────── Account ───────── */
const Account = () => (
  <section id="account" className="section section-divider">
    <div className="container">
      <div className="eyebrow">
        <span className="dot" />
        账号 / Workspace
      </div>
      <h2 className="section-title">
        登录之后，<em>你的卡片有家了</em>。
      </h2>
      <p className="section-sub">
        现在已经能登录、注册、本地保存草稿；接下来会陆续打开模板云端、品牌资产、团队协作。
      </p>
      <div className="account">
        <div>
          <div className="acc-list">
            <div className="acc-item">
              <span className="icon">✓</span>
              <span className="label">
                登录 / 注册<span className="sub">本地账号体系</span>
              </span>
              <span className="badge now">已上线</span>
            </div>
            <div className="acc-item">
              <span className="icon">✓</span>
              <span className="label">
                草稿自动保存<span className="sub">浏览器本地</span>
              </span>
              <span className="badge now">已上线</span>
            </div>
            <div className="acc-item">
              <span className="icon">✓</span>
              <span className="label">
                分享链接<span className="sub">把当前内容编码进 URL</span>
              </span>
              <span className="badge now">已上线</span>
            </div>
            <div className="acc-item">
              <span className="icon">→</span>
              <span className="label">
                模板与品牌资产云同步<span className="sub">跨设备复用</span>
              </span>
              <span className="badge">即将</span>
            </div>
            <div className="acc-item">
              <span className="icon">→</span>
              <span className="label">
                团队工作区<span className="sub">编辑组共享品牌库</span>
              </span>
              <span className="badge">规划中</span>
            </div>
          </div>
        </div>
        <div className="acc-card">
          <div className="acc-card-head">
            <div className="acc-avatar">墨</div>
            <div style={{ flex: 1 }}>
              <div className="name">墨工坊 · 内容组</div>
              <div className="role">@inkstudio · Owner</div>
            </div>
            <span className="f-pill" style={{ height: 26, fontSize: 10.5 }}>
              Pro
            </span>
          </div>
          <div className="acc-stats">
            <div className="acc-stat">
              <div className="v">128</div>
              <div className="l">已生成卡片</div>
            </div>
            <div className="acc-stat">
              <div className="v">14</div>
              <div className="l">草稿</div>
            </div>
            <div className="acc-stat">
              <div className="v">6</div>
              <div className="l">品牌资产</div>
            </div>
          </div>
          <div className="acc-drafts">
            <div className="acc-draft">
              <div className="doc accent" />
              <div className="meta">
                <div className="t">长期主义的 6 个误解</div>
                <div className="s">6 张 · 知识卡 · 2 分钟前</div>
              </div>
              <span className="f-pill" style={{ height: 22, fontSize: 10 }}>
                编辑
              </span>
            </div>
            <div className="acc-draft">
              <div className="doc" />
              <div className="meta">
                <div className="t">读完《卡片笔记法》后我做了什么</div>
                <div className="s">4 张 · 极简 · 昨天</div>
              </div>
              <span className="f-pill" style={{ height: 22, fontSize: 10 }}>
                编辑
              </span>
            </div>
            <div className="acc-draft">
              <div className="doc" />
              <div className="meta">
                <div className="t">小红书爆款标题的 3 个套路</div>
                <div className="s">3 张 · 小红书 · 上周</div>
              </div>
              <span className="f-pill" style={{ height: 22, fontSize: 10 }}>
                编辑
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

/* ───────── CTA + Footer ───────── */
const CTA = () => (
  <section className="section" style={{ paddingBottom: 0 }}>
    <div className="container">
      <div className="cta">
        <div className="cta-grid">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(250,250,247,0.5)' }}>
              <span className="dot" />
              开始使用
            </div>
            <h2>
              下一篇内容，
              <br />
              <span className="accent">不要</span>再为排版折腾。
            </h2>
            <p>
              MD2Card 不收费、不上传、不锁定 ——
              你的草稿、你的模板、你的品牌资产，全部留在你自己的浏览器里。
            </p>
          </div>
          <div className="cta-actions">
            <a
              href="#/app"
              className="btn btn-accent btn-lg"
              onClick={() =>
                trackEvent('cta_click', {
                  placement: 'footer_cta',
                  target: 'app',
                })
              }>
              进入工作台 {Icon.arrow()}
            </a>
            <a href="#/docs" className="btn btn-ghost-dark btn-lg">
              阅读文档 {Icon.external()}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-col">
          <a href="#/" className="brand" style={{ marginBottom: 14 }}>
            <span className="brand-mark">M2</span>
            <span>MD2Card</span>
          </a>
          <p style={{ maxWidth: 320, lineHeight: 1.6, color: 'var(--ink-3)' }}>
            为内容创作者打造的卡片工作台。把 Markdown、AI
            文案、视觉模板和多格式导出，整合在一条流里。
          </p>
        </div>
        <div className="footer-col">
          <div className="h">产品</div>
          <a href="#features">核心能力</a>
          <a href="#workflow">工作流</a>
          <a href="#scenes">使用场景</a>
          <a href="#/app">进入工作台</a>
        </div>
        <div className="footer-col">
          <div className="h">资源</div>
          <a href="#/docs">使用文档</a>
          {/* <a href="#/docs">使用文档</a><a href="#changelog">更新日志</a><a href="#templates">模板库</a><a href="#shortcuts">快捷键</a> */}
        </div>
        <div className="footer-col">
          <div className="h">联系</div>
          <a href="#feedback">反馈与建议</a>
          <a href="#community">用户社群</a>
          <a href="#twitter">小红书</a>
        </div>
      </div>
      <div className="footer-bot">
        <span>© 2026 MD2Card · 用 Markdown 把内容写好</span>
        <span>v0.9.4 · Built in browser, runs in browser.</span>
      </div>
      <div className="footer-beian">
        <a href="http://beian.miit.gov.cn/" target="_blank" rel="noreferrer noopener">
          沪ICP备2026021880号
        </a>
      </div>
    </div>
  </footer>
)

/* ───────── Page ───────── */
export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="md2card-landing shell">
      <Nav onSignIn={() => setAuthOpen(true)} />
      <main>
        <Hero />
        <TemplateStrip />
        <Features />
        <section className="section-tight">
          <div className="container">
            <AdSlot placement="landing-middle" />
          </div>
        </section>
        <Workflow />
        <Scenes />
        <Account />
        <CTA />
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        defaultMode="signin"
        onOpenChange={setAuthOpen}
      />
    </div>
  )
}

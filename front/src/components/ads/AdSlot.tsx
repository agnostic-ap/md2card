import { Megaphone } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED !== 'false'
const DEFAULT_AD_URL = import.meta.env.VITE_AD_CLICK_URL ?? '#/app'
const DEFAULT_AD_TITLE = import.meta.env.VITE_AD_TITLE ?? '把下一篇内容做成一组卡片'
const DEFAULT_AD_DESC =
  import.meta.env.VITE_AD_DESCRIPTION ??
  'MD2Card 支持 Markdown 写作、AI 成稿、主题模板和多格式导出。'

type AdSlotProps = {
  placement: string
  variant?: 'banner' | 'compact'
  title?: string
  description?: string
  href?: string
}

export function AdSlot({
  placement,
  variant = 'banner',
  title = DEFAULT_AD_TITLE,
  description = DEFAULT_AD_DESC,
  href = DEFAULT_AD_URL,
}: AdSlotProps) {
  if (!ADS_ENABLED) return null

  const compact = variant === 'compact'

  return (
    <aside
      className={
        compact
          ? 'rounded-md border border-dashed border-(--border) bg-(--surface-wash) p-4 text-sm'
          : 'rounded-md border border-dashed border-(--border) bg-(--surface-wash) p-5'
      }
      aria-label="广告"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground)">
        <Megaphone className="size-3.5" />
        Sponsor · {placement}
      </div>
      <div className={compact ? 'space-y-2' : 'flex flex-col gap-4 sm:flex-row sm:items-center'}>
        <div className="min-w-0 flex-1">
          <h3 className={compact ? 'font-semibold text-(--foreground)' : 'text-lg font-semibold text-(--foreground)'}>
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-(--muted-foreground)">{description}</p>
        </div>
        <a
          href={href}
          onClick={() => trackEvent('ad_click', { placement, href })}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-(--accent-ui)/25 bg-(--accent-ui)/10 px-3 text-sm font-medium text-(--accent-ui) transition-colors hover:bg-(--accent-ui)/15"
        >
          了解一下
        </a>
      </div>
    </aside>
  )
}

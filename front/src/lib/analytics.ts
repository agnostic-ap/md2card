type AnalyticsProvider = 'none' | 'ga' | 'plausible'

type AnalyticsEvent = {
  name: string
  path: string
  title?: string
  props?: Record<string, string | number | boolean | null | undefined>
  ts: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void
  }
}

const LOCAL_EVENTS_KEY = 'md2card.analytics.events'
const provider = (import.meta.env.VITE_ANALYTICS_PROVIDER ?? 'none') as AnalyticsProvider
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined

function appendScript(src: string, attrs: Record<string, string | boolean> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return
  const script = document.createElement('script')
  script.src = src
  script.async = true
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) script.setAttribute(key, '')
    else if (value !== false) script.setAttribute(key, value)
  }
  document.head.appendChild(script)
}

function persistLocalEvent(event: AnalyticsEvent) {
  try {
    const raw = window.localStorage.getItem(LOCAL_EVENTS_KEY)
    const events = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : []
    events.push(event)
    window.localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(-100)))
  } catch {
    // Analytics must never break the product experience.
  }
}

export function initAnalytics() {
  if (provider === 'ga' && gaMeasurementId) {
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`)
    window.dataLayer = window.dataLayer ?? []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', gaMeasurementId, { send_page_view: false })
  }

  if (provider === 'plausible' && plausibleDomain) {
    appendScript('https://plausible.io/js/script.js', {
      defer: true,
      'data-domain': plausibleDomain,
    })
  }
}

export function trackPageView(path: string, title = document.title) {
  persistLocalEvent({ name: 'page_view', path, title, ts: new Date().toISOString() })

  if (provider === 'ga' && gaMeasurementId && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      send_to: gaMeasurementId,
    })
  }

  if (provider === 'plausible' && window.plausible) {
    window.plausible('pageview', { props: { path, title } })
  }
}

export function trackEvent(
  name: string,
  props: Record<string, string | number | boolean | null | undefined> = {},
) {
  const path = `${window.location.pathname}${window.location.hash}`
  persistLocalEvent({ name, path, props, ts: new Date().toISOString() })

  if (provider === 'ga' && window.gtag) {
    window.gtag('event', name, props)
  }

  if (provider === 'plausible' && window.plausible) {
    window.plausible(name, { props })
  }
}

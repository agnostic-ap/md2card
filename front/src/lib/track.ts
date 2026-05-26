// Lightweight first-party beacon. Posts to /track on the same origin
// (Caddy reverse-proxies that path to the admin-backend ingest service).
// Failures are swallowed — we never want analytics to disturb the app.

const VISITOR_KEY = 'mdcard-visitor-id'
const ENDPOINT = '/track'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export function track(type: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({
      type,
      visitorId: getVisitorId(),
      path: window.location.hash || window.location.pathname,
      referrer: document.referrer || undefined,
      props,
    })
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(ENDPOINT, blob)
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // swallowed
  }
}

export function trackPageView() {
  track('page_view')
}

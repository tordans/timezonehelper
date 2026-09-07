const INDEXABLE_ROBOTS = 'index, follow'
const LEGAL_ROBOTS = 'noindex, follow'

/** Drop `legal` so the Impressum URL is not treated as the canonical app page. */
export function hrefWithoutLegal(href: string) {
  const url = new URL(href)
  const params = url.search
    .replace(/^\?/, '')
    .split('&')
    .filter((part) => {
      if (part === '') {
        return false
      }

      const key = decodeURIComponent(part.split('=')[0] ?? '')
      return key !== 'legal'
    })
  const search = params.length > 0 ? `?${params.join('&')}` : ''
  return `${url.origin}${url.pathname}${search}${url.hash}`
}

function ensureMeta(name: string) {
  const existing = document.querySelector(`meta[name="${name}"]`)
  if (existing) {
    return existing
  }

  const meta = document.createElement('meta')
  meta.setAttribute('name', name)
  document.head.append(meta)
  return meta
}

function ensureCanonicalLink() {
  const existing = document.querySelector('link[rel="canonical"]')
  if (existing) {
    return existing
  }

  const link = document.createElement('link')
  link.setAttribute('rel', 'canonical')
  document.head.append(link)
  return link
}

export function applyLegalIndexing(isLegalOpen: boolean, href: string) {
  ensureMeta('robots').setAttribute('content', isLegalOpen ? LEGAL_ROBOTS : INDEXABLE_ROBOTS)
  ensureCanonicalLink().setAttribute('href', hrefWithoutLegal(href))
}

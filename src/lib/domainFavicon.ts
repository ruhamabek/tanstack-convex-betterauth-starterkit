/**
 * Domain Favicon Utility
 * Resolves high-resolution app icons instantly from a website URL using Google's Favicon API
 * with zero storage cost.
 */

export function getFaviconFromUrl(websiteUrl: string, size: number = 128): string {
  if (!websiteUrl) return ''
  try {
    let clean = websiteUrl.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    const parsed = new URL(clean)
    const hostname = parsed.hostname.replace(/^www\./, '')
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`
  } catch {
    return ''
  }
}

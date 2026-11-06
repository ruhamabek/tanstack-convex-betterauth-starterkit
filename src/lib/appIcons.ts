/**
 * App Icon Resolver & Local Fallbacks
 * Provides reliable, high-resolution SVG and PNG icons for core catalog products
 * with automatic fallback if external favicons fail to load or are blocked by CORS.
 */

export const LOCAL_APP_ICONS: Record<string, string> = {
  raycast: '/assets/raycast_favicon.png',
  'arc-browser-v2': '/assets/arc_favicon.png',
  arc: '/assets/arc_favicon.png',
  'arc browser': '/assets/arc_favicon.png',
  'arc browser (v2)': '/assets/arc_favicon.png',
  cron: '/assets/notion_logo.png',
  'notion-calendar': '/assets/notion_logo.png',
  'notion calendar': '/assets/notion_logo.png',
  linear: '/assets/linear_icon.png',
  supabase: '/assets/supabase_icon.svg',
  notion: '/assets/notion_logo.png',
}

export function resolveAppIcon(
  app?: { name?: string; slug?: string; iconUrl?: string } | null,
  fallbackUrl?: string,
): string {
  if (!app) return fallbackUrl || ''

  const slug = app.slug?.trim().toLowerCase()
  const name = app.name?.trim().toLowerCase()

  if (slug && LOCAL_APP_ICONS[slug]) return LOCAL_APP_ICONS[slug]
  if (name && LOCAL_APP_ICONS[name]) return LOCAL_APP_ICONS[name]

  if (app.iconUrl) {
    const urlLower = app.iconUrl.toLowerCase()
    if (urlLower.includes('raycast.com')) return '/assets/raycast_favicon.png'
    if (urlLower.includes('arc.net')) return '/assets/arc_favicon.png'
    if (urlLower.includes('notion.so') || urlLower.includes('notion.com')) return '/assets/notion_logo.png'
    if (urlLower.includes('linear.app') && !urlLower.includes('.png')) return '/assets/linear_icon.png'
    return app.iconUrl
  }

  return fallbackUrl || ''
}

export function handleAppIconError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  appName?: string,
  appSlug?: string,
) {
  const target = e.currentTarget
  const fallback = resolveAppIcon({ name: appName, slug: appSlug })

  if (fallback && !target.src.endsWith(fallback)) {
    target.src = fallback
    return
  }
  target.style.display = 'none'
}

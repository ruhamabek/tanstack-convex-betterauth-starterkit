import { createServerFn } from '@tanstack/react-start'

export type SpecimenPlatform =
  | 'dribbble'
  | 'mobbin'
  | 'figma'
  | 'pinterest'
  | 'x_twitter'
  | 'product'

export interface UnfurledMetadata {
  url: string
  platform: SpecimenPlatform
  title: string
  description?: string
  image?: string
  author?: string
  category?: string
}

export function detectPlatform(hostname: string): {
  platform: SpecimenPlatform
  category: string
} {
  const host = hostname.toLowerCase()
  if (host.includes('dribbble.com')) {
    return { platform: 'dribbble', category: 'Micro-interactions' }
  }
  if (host.includes('mobbin.com') || host.includes('mobbin.design')) {
    return { platform: 'mobbin', category: 'Mobile Interaction' }
  }
  if (host.includes('figma.com')) {
    return { platform: 'figma', category: 'Design System' }
  }
  if (
    host.includes('pinterest.com') ||
    host.includes('pin.it') ||
    host.includes('pinimg.com')
  ) {
    return { platform: 'pinterest', category: 'Typography & Layout' }
  }
  if (
    host.includes('x.com') ||
    host.includes('twitter.com') ||
    host.includes('t.co')
  ) {
    return { platform: 'x_twitter', category: 'Micro-interactions' }
  }
  return { platform: 'product', category: 'Desktop Flow' }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
}

function parseTagAttributes(tagStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  let match: RegExpExecArray | null
  while ((match = attrRegex.exec(tagStr)) !== null) {
    const key = match[1].toLowerCase()
    const val = match[2] ?? match[3] ?? match[4] ?? ''
    attrs[key] = decodeHtmlEntities(val)
  }
  return attrs
}

export function inferCategory(
  title: string,
  description: string,
  fallbackCategory: string,
): string {
  const text = `${title} ${description}`.toLowerCase()
  if (
    /\b(dashboard|crm|erp|saas|web app|admin|analytics|data viz|visualization|table|desktop)\b/i.test(
      text,
    )
  ) {
    return 'Desktop Flow'
  }
  if (
    /\b(design system|figma|tokens?|components?|primitives?|ui kit|guidelines)\b/i.test(
      text,
    )
  ) {
    return 'Design System'
  }
  if (
    /\b(mobile|ios|android|haptics?|bottom sheet|navigation bar|app flow)\b/i.test(
      text,
    )
  ) {
    return 'Mobile Interaction'
  }
  if (
    /\b(dark mode|oled|high-contrast|surface depth|glow|luminance)\b/i.test(text)
  ) {
    return 'Dark Mode Surfaces'
  }
  if (
    /\b(micro-interaction|animation|spring|fluid|motion|hover state|micro)\b/i.test(
      text,
    )
  ) {
    return 'Micro-interactions'
  }
  if (
    /\b(typography|layout|editorial|poster|grid|fraunces|kerning|font)\b/i.test(
      text,
    )
  ) {
    return 'Typography & Layout'
  }
  return fallbackCategory
}

function extractSmartTitleFromUrl(
  urlObj: URL,
  platform: SpecimenPlatform,
): {
  title: string
  author?: string
} {
  const pathname = urlObj.pathname.replace(/\/$/, '')
  const segments = pathname.split('/').filter(Boolean)

  if (platform === 'dribbble') {
    const lastSeg = segments[segments.length - 1] || ''
    const clean = lastSeg.replace(/^\d+-/, '').replace(/[-_]+/g, ' ').trim()
    if (clean) {
      return {
        title: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
        author: '@dribbble_creator',
      }
    }
  }

  if (platform === 'mobbin') {
    const lastSeg = segments[segments.length - 1] || ''
    const clean = lastSeg.replace(/[-_]+/g, ' ').trim()
    if (clean) {
      return {
        title: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
        author: 'Product Team',
      }
    }
  }

  if (platform === 'figma') {
    const lastSeg = segments[segments.length - 1] || ''
    const clean = lastSeg.replace(/[-_]+/g, ' ').trim()
    if (clean && !clean.match(/^\d+$/)) {
      return {
        title: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
        author: 'Figma Community',
      }
    }
  }

  if (platform === 'pinterest') {
    const lastSeg = segments[segments.length - 1] || ''
    const clean = lastSeg.replace(/--\d+$/, '').replace(/[-_]+/g, ' ').trim()
    if (clean && clean.length > 3) {
      return {
        title: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
        author: '@pinterest_creator',
      }
    }
  }

  if (segments.length > 0) {
    const lastSeg = segments[segments.length - 1] || ''
    const clean = lastSeg.replace(/[-_]+/g, ' ').trim()
    if (clean && clean.length > 2) {
      return {
        title: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
      }
    }
  }

  const name =
    urlObj.hostname.replace(/^www\./, '').split('.')[0] || 'Curated Specimen'
  return {
    title: name.charAt(0).toUpperCase() + name.slice(1),
  }
}

// In-memory specimen unfurl cache (24 hour TTL)
const unfurlCache = new Map<
  string,
  { data: UnfurledMetadata; expiresAt: number }
>()

export const unfurlUrlFn = createServerFn({ method: 'POST' })
  .inputValidator((url: string) => url)
  .handler(async ({ data: inputUrl }): Promise<UnfurledMetadata> => {
    let cleanUrl = (inputUrl || '').trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    }

    // Check memory cache first
    const cached = unfurlCache.get(cleanUrl)
    if (cached && cached.expiresAt > Date.now() && cached.data.image) {
      return cached.data
    }

    let urlObj: URL
    try {
      urlObj = new URL(cleanUrl)
    } catch {
      throw new Error(
        'Please enter a valid URL (e.g. https://pin.it/..., https://dribbble.com/...)',
      )
    }

    let { platform, category } = detectPlatform(urlObj.hostname)
    const smartParsed = extractSmartTitleFromUrl(urlObj, platform)

    let title = smartParsed.title
    let author = smartParsed.author
    let description: string | undefined
    let image: string | undefined

    // 1. Direct OpenGraph Fetch (for Pinterest, Mobbin, Products, X)
    // We skip direct fetch for Dribbble and Figma because their CDNs block direct crawlers with AWS/CloudFront WAF challenges.
    if (platform !== 'dribbble' && platform !== 'figma') {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4500)

        const response = await fetch(cleanUrl, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent':
              'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })
        clearTimeout(timeoutId)

        if (response.url) {
          try {
            const finalUrlObj = new URL(response.url)
            const finalPlatformInfo = detectPlatform(finalUrlObj.hostname)
            if (finalPlatformInfo.platform !== 'product') {
              platform = finalPlatformInfo.platform
            }
          } catch {
            // Keep original platform
          }
        }

        if (response.ok) {
          const html = await response.text()

          const metaTags = html.match(/<meta\s+[^>]+>/gi) || []
          for (const tag of metaTags) {
            const attrs = parseTagAttributes(tag)
            const prop = (
              attrs['property'] ||
              attrs['name'] ||
              attrs['itemprop'] ||
              ''
            ).toLowerCase()
            const content = attrs['content']
            if (!content) continue

            if (
              !image &&
              (prop === 'og:image' ||
                prop === 'twitter:image' ||
                prop === 'twitter:image:src' ||
                prop === 'thumbnail' ||
                prop === 'image')
            ) {
              image = content
            }

            if (
              !title &&
              (prop === 'og:title' ||
                prop === 'twitter:title' ||
                prop === 'title')
            ) {
              title = content
            }

            if (
              !description &&
              (prop === 'og:description' ||
                prop === 'twitter:description' ||
                prop === 'description')
            ) {
              description = content
            }

            if (
              !author &&
              (prop === 'author' ||
                prop === 'twitter:creator' ||
                prop === 'pinterestapp:pinner' ||
                prop === 'pinterestapp:source')
            ) {
              author = content
            }
          }

          const linkTags = html.match(/<link\s+[^>]+>/gi) || []
          for (const tag of linkTags) {
            const attrs = parseTagAttributes(tag)
            const rel = (attrs['rel'] || '').toLowerCase()
            const href = attrs['href']
            if (!href) continue

            if (
              !image &&
              (rel === 'image_src' ||
                (rel === 'preload' && attrs['as'] === 'image'))
            ) {
              image = href
            }
          }

          if (!title) {
            const rawTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
            if (rawTitle) title = decodeHtmlEntities(rawTitle)
          }

          if (image) {
            if (image.startsWith('//')) {
              image = `https:${image}`
            } else if (image.startsWith('/')) {
              image = `${urlObj.origin}${image}`
            }
          }
        }
      } catch {
        // Direct fetch failed or timed out — proceed to reader fallback
      }
    }

    // 2. Intelligent Reader Fallback (for Dribbble & WAF-protected artifacts)
    if (!image || platform === 'dribbble') {
      try {
        const readerRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
          signal: AbortSignal.timeout(22000),
        })

        if (readerRes.ok) {
          const readerJson = await readerRes.json()
          const d = readerJson.data || {}

          if (d.title && (!title || title === smartParsed.title)) {
            title = d.title
          }
          if (d.description && !description) {
            description = d.description
          }

          if (platform === 'dribbble' && d.description) {
            const authorMatch = d.description.match(/designed by\s+([^.,]+)/i)
            if (authorMatch) {
              const raw = authorMatch[1].trim()
              author = raw.startsWith('@') ? raw : `@${raw}`
            }
          }

          if (platform === 'figma') {
            const authorMatch = (d.content || '').match(
              /\[([^\n\]]+)\]\(https:\/\/www\.figma\.com\/@([a-zA-Z0-9_-]+)\)/,
            )
            if (authorMatch) {
              author = `${authorMatch[1].trim()} (@${authorMatch[2]})`
            }
          }

          const content = d.content || ''
          if (!image) {
            if (platform === 'dribbble') {
              const cdnMedia =
                content.match(
                  /https:\/\/cdn\.dribbble\.com\/userupload\/[^\s\)\"\']+/g,
                ) || []
              // Filter out direct video files for the static preview frame
              const cdnImgs = cdnMedia.filter(
                (u: string) => !u.endsWith('.mp4') && !u.endsWith('.webm'),
              )
              if (cdnImgs.length > 0) {
                const best =
                  cdnImgs.find(
                    (u: string) =>
                      u.includes('resize=752x') || u.includes('/original-'),
                  ) || cdnImgs[0]
                image = best
              }
            } else if (platform === 'figma') {
              const allImages = [
                ...content.matchAll(/!\[(.*?)\]\((https?:\/\/[^\s\)\"\']+)\)/g),
              ].map((m) => m[2])
              const figmaImg = allImages.find(
                (u) =>
                  u.includes('s3-figma-hubfile') ||
                  u.includes('s3-alpha.figma.com/hub/file') ||
                  u.includes('figma.com/cdn-cgi/image') ||
                  /\.(png|jpe?g|webp)(\?|$)/i.test(u),
              )
              if (figmaImg) {
                image = figmaImg
              }
            }

            if (!image) {
              // Ensure we only match real raster or vector images, not webpage anchors converted to markdown images
              const mdImg = content.match(
                /!\[.*?\]\((https?:\/\/[^\s\)\"\']+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^\s\)\"\']*)?)\)/i,
              )?.[1]
              if (
                mdImg &&
                !mdImg.includes('avatar') &&
                !mdImg.includes('icon')
              ) {
                image = mdImg
              }
            }
          }
        }
      } catch {
        // Reader fallback failed — proceed with smart parsed metadata
      }
    }

    // 3. Normalization and Polish
    if (title) {
      if (title.includes('|')) {
        const primaryPart = title.split('|')[0].trim()
        if (primaryPart.length > 3) {
          title = primaryPart
        }
      }
      title = title
        .replace(
          /\s*[•-]\s*(Dribbble|Mobbin|Figma|Pinterest|Twitter|X|Product Hunt).*$/i,
          '',
        )
        .trim()
    }

    if (description) {
      description = description
        .replace(/^\d{2}-[a-zA-Z]{3}-\d{4}\s*[—–-]\s*/, '')
        .replace(/^[a-zA-Z]{3}\s+\d{1,2},?\s+\d{4}\s*[•·—–-]\s*/, '')
        .trim()
    }

    if (author) {
      if (author.includes('pinterest.com/')) {
        const handleMatch = author.match(/pinterest\.com\/([^/?#]+)/)?.[1]
        if (handleMatch && handleMatch !== 'pin') {
          author = `@${handleMatch}`
        }
      } else if (author.includes('twitter.com/') || author.includes('x.com/')) {
        const handleMatch = author.match(/(?:twitter|x)\.com\/([^/?#]+)/)?.[1]
        if (handleMatch) {
          author = `@${handleMatch}`
        }
      } else if (author.includes('ui8.net/')) {
        const handleMatch = author.match(/ui8\.net\/([^/?#-]+)/)?.[1]
        if (handleMatch) {
          author = `@${handleMatch}`
        }
      } else if (!author.startsWith('@') && !author.includes(' ')) {
        author = `@${author}`
      }
    }

    category = inferCategory(title, description || '', category)

    const result: UnfurledMetadata = {
      url: cleanUrl,
      platform,
      title,
      description,
      image,
      author,
      category,
    }

    // Cache successful extractions (24 hr TTL)
    if (image || title) {
      unfurlCache.set(cleanUrl, {
        data: result,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      })
    }

    return result
  })

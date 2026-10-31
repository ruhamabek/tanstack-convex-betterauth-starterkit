// =============================================================================
// SCREENLOG CRITIC AVATAR ENGINE
// Deterministic avatar generation supporting hand-drawn Notionist sketches,
// modern craft portraits, playful bots, and a zero-network offline Bauhaus SVG generator.
// =============================================================================

export type AvatarStyleId = 'notionists' | 'micah' | 'bauhaus' | 'bottts' | 'lorelei' | 'shapes'

export interface AvatarStyleOption {
  id: AvatarStyleId
  name: string
  description: string
  icon: string
  isOffline?: boolean
}

export const AVATAR_STYLES: AvatarStyleOption[] = [
  {
    id: 'notionists',
    name: 'Notionist',
    description: 'Minimalist hand-drawn tech critic sketch',
    icon: 'pencil',
  },
  {
    id: 'micah',
    name: 'Designer',
    description: 'Clean modern product crafter portrait',
    icon: 'palette',
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    description: 'Tactile geometric design shapes',
    icon: 'boxes',
    isOffline: true,
  },
  {
    id: 'bottts',
    name: 'Retro Bot',
    description: 'Playful computing automaton',
    icon: 'bot',
  },
  {
    id: 'lorelei',
    name: 'Sketch',
    description: 'Expressive personality avatar',
    icon: 'smile',
  },
  {
    id: 'shapes',
    name: 'Abstract',
    description: 'Modern algorithmic art composition',
    icon: 'shapes',
  },
]

// -----------------------------------------------------------------------------
// Deterministic PRNG & Hash for Bauhaus SVG Generator
// -----------------------------------------------------------------------------

function hashSeed(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seedNumber: number) {
  let state = seedNumber
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const WARM_PALETTES = [
  { bg: '#FAF8F2', primary: '#B45309', secondary: '#111215', accent: '#EDEAE3' }, // Amber terracotta
  { bg: '#F5F9F6', primary: '#15803D', secondary: '#111215', accent: '#BBF7D0' }, // Craft emerald
  { bg: '#FFF7ED', primary: '#EA580C', secondary: '#1E293B', accent: '#FED7AA' }, // Tangerine clay
  { bg: '#F8FAFC', primary: '#4338CA', secondary: '#0F172A', accent: '#C7D2FE' }, // Modern indigo
  { bg: '#FEF2F2', primary: '#B91C1C', secondary: '#111215', accent: '#FECACA' }, // Crimson tomato
  { bg: '#FDFBF7', primary: '#0D9488', secondary: '#111215', accent: '#99F6E4' }, // Studio teal
]

/**
 * Generates an authentic Bauhaus geometric craft SVG string deterministically from any seed.
 * 100% self-contained, zero network calls, instant render.
 */
export function generateBauhausSvg(seed: string): string {
  const hash = hashSeed(seed || 'critic')
  const rng = createRng(hash)

  const palette = WARM_PALETTES[Math.floor(rng() * WARM_PALETTES.length)]

  // Choose distinct shapes to composite inside 80x80 canvas
  const shapeTypes = ['circle', 'arch', 'stripes', 'halfCircle', 'rect', 'cross']
  const s1 = shapeTypes[Math.floor(rng() * shapeTypes.length)]
  const s2 = shapeTypes[Math.floor(rng() * shapeTypes.length)]

  const rot1 = [0, 90, 180, 270][Math.floor(rng() * 4)]
  const rot2 = [0, 90, 180, 270][Math.floor(rng() * 4)]

  const renderShape = (type: string, color: string, rot: number) => {
    switch (type) {
      case 'circle':
        return `<circle cx="40" cy="40" r="26" fill="${color}" />`
      case 'arch':
        return `<path d="M 16 64 A 24 24 0 0 1 64 64 Z" fill="${color}" transform="rotate(${rot} 40 40)" />`
      case 'halfCircle':
        return `<path d="M 40 16 A 24 24 0 0 1 40 64 Z" fill="${color}" transform="rotate(${rot} 40 40)" />`
      case 'stripes':
        return `<g transform="rotate(${rot} 40 40)">
          <rect x="20" y="24" width="40" height="6" rx="3" fill="${color}" />
          <rect x="20" y="37" width="40" height="6" rx="3" fill="${color}" />
          <rect x="20" y="50" width="40" height="6" rx="3" fill="${color}" />
        </g>`
      case 'rect':
        return `<rect x="22" y="22" width="36" height="36" rx="8" fill="${color}" transform="rotate(${rot} 40 40)" />`
      case 'cross':
        return `<g transform="rotate(${rot} 40 40)">
          <rect x="34" y="18" width="12" height="44" rx="6" fill="${color}" />
          <rect x="18" y="34" width="44" height="12" rx="6" fill="${color}" />
        </g>`
      default:
        return `<circle cx="40" cy="40" r="22" fill="${color}" />`
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="100%" height="100%">
    <rect width="80" height="80" rx="20" fill="${palette.bg}" />
    <g clip-path="url(#clip-${hash})">
      <clipPath id="clip-${hash}">
        <rect width="80" height="80" rx="20" />
      </clipPath>
      ${renderShape(s1, palette.accent, rot1)}
      ${renderShape(s2, palette.primary, rot2)}
      <circle cx="40" cy="40" r="7" fill="${palette.secondary}" />
    </g>
  </svg>`.replace(/\s+/g, ' ').trim()

  return svg
}

export function generateBauhausDataUri(seed: string): string {
  const svg = generateBauhausSvg(seed)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Builds the canonical avatar URL for a given style and seed.
 */
export function getAvatarUrl(style: AvatarStyleId, seed: string): string {
  const cleanSeed = (seed || 'critic').trim().toLowerCase()
  if (style === 'bauhaus') {
    return generateBauhausDataUri(cleanSeed)
  }
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(cleanSeed)}`
}

/**
 * Resolves any profile's avatar URL.
 * If none is stored, deterministically defaults to 'notionists' style with their handle as seed.
 */
export function resolveAvatarUrl(avatarUrl: string | undefined | null, seed: string): string {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    if (avatarUrl.startsWith('bauhaus:')) {
      const bauhausSeed = avatarUrl.replace(/^bauhaus:/, '')
      return generateBauhausDataUri(bauhausSeed)
    }
    return avatarUrl
  }

  // Default fallback: Notionist critic sketch for their handle
  return getAvatarUrl('notionists', seed || 'critic')
}

/**
 * Parses style and seed from an avatar URL if it matches known patterns.
 */
export function parseAvatarUrl(url?: string | null): { style: AvatarStyleId; seed: string } | null {
  if (!url) return null

  if (url.startsWith('bauhaus:')) {
    return { style: 'bauhaus', seed: url.replace(/^bauhaus:/, '') }
  }

  const diceBearMatch = url.match(/api\.dicebear\.com\/9\.x\/([a-z-]+)\/svg\?seed=([^&]+)/)
  if (diceBearMatch) {
    const styleCandidate = diceBearMatch[1] as AvatarStyleId
    const seed = decodeURIComponent(diceBearMatch[2])
    const validStyle = AVATAR_STYLES.some((s) => s.id === styleCandidate)
    if (validStyle) {
      return { style: styleCandidate, seed }
    }
  }

  return null
}

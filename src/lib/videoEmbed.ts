/**
 * Zero-Storage Video Embed Utility
 * Detects Loom, YouTube, CleanShot, and direct video links to render responsive video embeds
 * with 0 bytes used on Cloudflare R2 storage.
 */

export interface ParsedVideo {
  type: 'loom' | 'youtube' | 'direct_video' | 'external'
  embedUrl: string
  originalUrl: string
}

export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  const url = (rawUrl || '').trim()
  if (!url) return null

  // 1. Loom: https://www.loom.com/share/abc123xyz -> https://www.loom.com/embed/abc123xyz
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i)
  if (loomMatch) {
    const videoId = loomMatch[1]
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${videoId}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`,
      originalUrl: url,
    }
  }

  // 2. YouTube: https://www.youtube.com/watch?v=abc123 or https://youtu.be/abc123
  const ytMatch =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch) {
    const videoId = ytMatch[1]
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      originalUrl: url,
    }
  }

  // 3. Direct Video URLs: .mp4, .webm, .mov
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return {
      type: 'direct_video',
      embedUrl: url,
      originalUrl: url,
    }
  }

  // 4. Any other public video link
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      type: 'external',
      embedUrl: url,
      originalUrl: url,
    }
  }

  return null
}

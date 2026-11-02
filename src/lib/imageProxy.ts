import { createServerFn } from '@tanstack/react-start'
import https from 'node:https'
import http from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function guessMimeType(buffer: Buffer, fallbackUrl: string): string {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png'
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg'
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif'
    }
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp'
    }
  }

  const clean = fallbackUrl.toLowerCase().split('?')[0]
  if (clean.endsWith('.png')) return 'image/png'
  if (clean.endsWith('.webp')) return 'image/webp'
  if (clean.endsWith('.gif')) return 'image/gif'
  if (clean.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

export const proxyImageAsDataUrl = createServerFn({ method: 'POST' })
  .inputValidator((url: string) => url)
  .handler(async ({ data: imageUrl }): Promise<string | null> => {
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      return null
    }

    let referer = 'https://www.google.com/'
    try {
      const parsed = new URL(imageUrl)
      referer = `${parsed.protocol}//${parsed.host}/`
    } catch {
      // Ignore
    }

    const browserHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: referer,
    }

    // Tier 1: Direct native fetch with Referer header & timeout
    try {
      const res = await fetch(imageUrl, {
        headers: browserHeaders,
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok) {
        const rawBuf = await res.arrayBuffer()
        if (rawBuf.byteLength > 0) {
          const buf = Buffer.from(rawBuf)
          const contentType = res.headers.get('content-type') || guessMimeType(buf, imageUrl)
          return `data:${contentType};base64,${buf.toString('base64')}`
        }
      }
    } catch {
      // Direct fetch failed or timed out — proceed to Tier 2
    }

    // Tier 2: Node https.get with IPv4 family to avoid IPv6 hanging
    try {
      const result = await new Promise<string | null>((resolve) => {
        const parsed = new URL(imageUrl)
        const client = parsed.protocol === 'http:' ? http : https
        const req = client.get(
          imageUrl,
          {
            family: 4,
            timeout: 6000,
            headers: browserHeaders,
          },
          (res) => {
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              resolve(null)
              return
            }
            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
              resolve(null)
              return
            }
            const chunks: Buffer[] = []
            res.on('data', (c) => chunks.push(Buffer.from(c)))
            res.on('end', () => {
              const buf = Buffer.concat(chunks)
              if (buf.length > 0) {
                const contentType =
                  (res.headers['content-type'] as string) || guessMimeType(buf, imageUrl)
                resolve(`data:${contentType};base64,${buf.toString('base64')}`)
              } else {
                resolve(null)
              }
            })
          },
        )
        req.on('error', () => resolve(null))
        req.on('timeout', () => {
          req.destroy()
          resolve(null)
        })
      })

      if (result) return result
    } catch {
      // Tier 2 failed — proceed to Tier 3
    }

    // Tier 3: curl subprocess with TLS & full redirect resolution
    try {
      const { stdout } = await execFileAsync(
        'curl',
        [
          '-sL',
          '--max-time',
          '8',
          '-A',
          browserHeaders['User-Agent'],
          '-e',
          referer,
          imageUrl,
        ],
        { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024 },
      )
      if (stdout && stdout.length > 0) {
        const mime = guessMimeType(stdout, imageUrl)
        return `data:${mime};base64,${stdout.toString('base64')}`
      }
    } catch {
      // Tier 3 failed — proceed to Tier 4
    }

    // Tier 4: Fetch via wsrv.nl proxy (works through Akamai/Cloudflare/Pinterest hotlink blocks)
    try {
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=webp`
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const rawBuf = await res.arrayBuffer()
        if (rawBuf.byteLength > 0) {
          const buf = Buffer.from(rawBuf)
          const contentType = res.headers.get('content-type') || 'image/webp'
          return `data:${contentType};base64,${buf.toString('base64')}`
        }
      }
    } catch {
      // All proxy strategies exhausted
    }

    return null
  })


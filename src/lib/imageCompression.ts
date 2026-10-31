/**
 * Client-Side Image Compression Utility
 * Compresses raw retina/4K screenshots (often 5MB - 10MB) down to ~80KB - 140KB WebP
 * before saving or uploading, preserving Cloudflare R2's 10 GB free tier budget.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface CompressedImageResult {
  blob: Blob
  dataUrl: string
  sizeBytes: number
  originalBytes: number
  compressionRatio: string
}

export async function compressImageToWebP(
  file: File | Blob,
  options: CompressionOptions = {},
): Promise<CompressedImageResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options
  const originalBytes = file.size

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to decode image data.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale while preserving exact aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable.'))
          return
        }

        // High quality bicubic image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to WebP format
        let dataUrl = canvas.toDataURL('image/webp', quality)
        const exportMime = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'

        // Fallback to JPEG if browser doesn't support WebP export
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        canvas.toBlob(
          (blob) => {
            const finalBlob = blob || new Blob([], { type: exportMime })
            const sizeBytes = finalBlob.size
            const ratio = ((1 - sizeBytes / originalBytes) * 100).toFixed(1) + '%'

            resolve({
              blob: finalBlob,
              dataUrl,
              sizeBytes,
              originalBytes,
              compressionRatio: ratio,
            })
          },
          exportMime,
          quality,
        )
      }

      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}

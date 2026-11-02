import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Palette,
  Pencil,
  Sparkles,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'
import { proxyImageAsDataUrl } from '../../lib/imageProxy'

export interface TasteCardExportModalProps {
  isOpen: boolean
  onClose: () => void
  review: (Doc<'reviews'> & { app?: Doc<'apps'> | null }) | null
}

// Canvas text wrapping helper
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
): number {
  const words = text.split(' ')
  let line = ''
  let linesDrawn = 0

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y)
      line = words[n] + ' '
      y += lineHeight
      linesDrawn++
      if (linesDrawn >= maxLines - 1) {
        const remaining = words.slice(n).join(' ')
        let truncated = remaining
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1)
        }
        ctx.fillText((truncated + '...').trim(), x, y)
        return y + lineHeight
      }
    } else {
      line = testLine
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y)
    y += lineHeight
  }
  return y
}

// Load image into HTMLImageElement
function loadLocalImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img)
      } else {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
    if (img.complete && img.naturalWidth) resolve(img)
  })
}

// Resilient multi-tier safe image resolver for canvas export
async function resolveSafeExportImage(url: string): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:') || url.startsWith('blob:')) return url

  // If already hosted on Convex CDN, it natively sets CORS headers
  if (url.includes('.convex.cloud') || url.includes('.convex.site')) {
    const test = await loadLocalImage(url)
    if (test) return url
  }

  // Tier 1: Backend server function proxy (returns base64 data URL)
  try {
    const proxied = await proxyImageAsDataUrl({ data: url })
    if (proxied) {
      const test = await loadLocalImage(proxied)
      if (test) return proxied
    }
  } catch (err) {
    console.warn('proxyImageAsDataUrl failed:', err)
  }

  // Tier 2: Client-side CORS proxy cache via wsrv.nl
  try {
    const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp`
    const test = await loadLocalImage(wsrvUrl)
    if (test) return wsrvUrl
  } catch (err) {
    console.warn('wsrv fallback failed:', err)
  }

  // Tier 3: Direct URL if CORS happens to be supported
  const direct = await loadLocalImage(url)
  if (direct) return url

  return null
}

export default function TasteCardExportModal({
  isOpen,
  onClose,
  review,
}: TasteCardExportModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPreparingMedia, setIsPreparingMedia] = useState(false)
  const [clipboardWarning, setClipboardWarning] = useState<string | null>(null)
  const [safeImageDataUrl, setSafeImageDataUrl] = useState<string | null>(null)
  const [precomputedBlob, setPrecomputedBlob] = useState<Blob | null>(null)

  const rawMediaUrl = review?.mediaUrl || review?.app?.mediaUrl

  // As soon as modal opens, resolve safe image so CORS never blocks canvas export
  useEffect(() => {
    if (!isOpen || !review) {
      setSafeImageDataUrl(null)
      setPrecomputedBlob(null)
      setClipboardWarning(null)
      setIsPreparingMedia(false)
      return
    }

    let active = true

    const loadSafe = async () => {
      if (!rawMediaUrl) {
        setSafeImageDataUrl(null)
        setIsPreparingMedia(false)
        return
      }

      setIsPreparingMedia(true)
      const safe = await resolveSafeExportImage(rawMediaUrl)
      if (active) {
        setSafeImageDataUrl(safe || rawMediaUrl)
        setIsPreparingMedia(false)
      }
    }

    loadSafe()

    return () => {
      active = false
    }
  }, [isOpen, review, rawMediaUrl])

  // Draw card on HTML5 canvas and export as PNG blob matching the timeline card layout!
  const generateCardBlob = useCallback(
    async (overrideImageUrl?: string | null): Promise<Blob | null> => {
      if (!review) return null

      let mediaUrlToUse = overrideImageUrl !== undefined ? overrideImageUrl : safeImageDataUrl
      if (!mediaUrlToUse && rawMediaUrl) {
        mediaUrlToUse = await resolveSafeExportImage(rawMediaUrl)
      }

      // Load specimen image if attached
      let specimenImg: HTMLImageElement | null = null
      if (mediaUrlToUse) {
        specimenImg = await loadLocalImage(mediaUrlToUse)
      }

      // Load distressed rubber stamp
      let stampUrl = '/assets/stamp_certified_lgtm.png'
      if (review.verdict === 'mixed') stampUrl = '/assets/stamp_needs_polish.png'
      if (review.verdict === 'rotten') stampUrl = '/assets/stamp_certified_rotten.png'
      const stampImg = await loadLocalImage(stampUrl)

      // Calculate dynamic canvas dimensions
      const canvasWidth = 840
      const cardPaddingX = 28
      const innerContentX = 64
      const innerContentW = canvasWidth - innerContentX * 2 // 712px

      // Header height: avatar + handles (~110px)
      // Title + attribution + quote heights
      let textHeight = 70 // title
      if (review.app?.sourceAuthor || review.app?.sourceType) textHeight += 26
      if (review.headline) textHeight += 32
      if (review.quote) textHeight += 36

      // Media frame height (contained aspect ratio, capped between 240px and 520px)
      let mediaFrameH = 0
      if (specimenImg) {
        const imgW = specimenImg.naturalWidth || specimenImg.width || 1
        const imgH = specimenImg.naturalHeight || specimenImg.height || 1
        const aspect = imgW / imgH
        mediaFrameH = Math.min(520, Math.max(260, Math.round(innerContentW / aspect)))
      }

      // Scores box: 150px
      const scoresBoxH = 150

      // Watermark footer: 50px
      const footerH = 50

      // Total Card Height
      const innerCardH = 120 + textHeight + (mediaFrameH ? mediaFrameH + 24 : 0) + scoresBoxH + footerH
      const canvasHeight = innerCardH + 56

      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Background Warm Ambient Atmosphere
      ctx.fillStyle = '#F4F1EA'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Inner Card White Container with Rounded Corners & Subtle Border
      const cardX = cardPaddingX
      const cardY = 28
      const cardW = canvasWidth - cardPaddingX * 2
      const cardH = innerCardH

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, 24)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      let curY = cardY + 40

      // 1. Top Header Row: Critic Avatar, Handle, Living Scorecard Label & Category Tag
      // Critic Avatar circle
      ctx.fillStyle = '#EBE7DE'
      ctx.beginPath()
      ctx.roundRect(innerContentX, curY - 14, 44, 44, 14)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Avatar Initial Letter
      ctx.fillStyle = '#78716C'
      ctx.font = 'bold 20px sans-serif'
      const initialChar = (review.authorHandle || 'C')[0].toUpperCase()
      ctx.fillText(initialChar, innerContentX + 15, curY + 16)

      // Critic Handle
      ctx.fillStyle = '#171717'
      ctx.font = '900 18px sans-serif'
      ctx.fillText(`@${review.authorHandle}`, innerContentX + 56, curY + 4)

      // Subtitle
      ctx.fillStyle = '#B45309' // amber-700
      ctx.font = 'bold 11px monospace'
      ctx.fillText('SCREENLOG LIVING SCORECARD', innerContentX + 56, curY + 22)

      // Category Pill (Right-aligned)
      const categoryText = (review.app?.category ?? 'SOFTWARE').toUpperCase()
      ctx.font = 'bold 11px monospace'
      const catWidth = ctx.measureText(categoryText).width + 24
      const catX = innerContentX + innerContentW - catWidth

      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
      ctx.beginPath()
      ctx.roundRect(catX, curY - 12, catWidth, 24, 12)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#525252'
      ctx.fillText(categoryText, catX + 12, curY + 4)

      curY += 56

      // 2. App Title
      ctx.fillStyle = '#171717'
      ctx.font = '900 30px sans-serif'
      ctx.fillText(review.app?.name ?? 'Software Appraisal', innerContentX, curY)
      curY += 26

      // 3. Source Attribution (if any)
      if (review.app?.sourceAuthor || review.app?.sourceType) {
        ctx.fillStyle = '#737373'
        ctx.font = '500 14px sans-serif'
        const srcText = `${review.app?.sourceType ?? 'Software'}${review.app?.sourceAuthor ? ` by ${review.app.sourceAuthor}` : ''}`
        ctx.fillText(srcText, innerContentX, curY)
        curY += 26
      }

      // 4. Headline & Quote
      if (review.headline) {
        ctx.fillStyle = '#171717'
        ctx.font = 'bold 18px sans-serif'
        curY = wrapText(ctx, `"${review.headline}"`, innerContentX, curY, innerContentW, 24, 2)
        curY += 6
      }

      if (review.quote) {
        ctx.fillStyle = '#525252'
        ctx.font = 'normal 15px sans-serif'
        curY = wrapText(ctx, review.quote, innerContentX, curY, innerContentW, 22, 3)
        curY += 14
      }

      // 5. Visual Proof Media (Hero Centerpiece)
      if (specimenImg) {
        const frameX = innerContentX
        const frameY = curY
        const frameW = innerContentW
        const frameH = mediaFrameH

        ctx.save()
        ctx.beginPath()
        ctx.roundRect(frameX, frameY, frameW, frameH, 18)
        ctx.clip()

        // Background white container
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(frameX, frameY, frameW, frameH)

        // Draw image contained with natural aspect ratio
        const imgW = specimenImg.naturalWidth || specimenImg.width || 1
        const imgH = specimenImg.naturalHeight || specimenImg.height || 1
        const aspect = imgW / imgH

        const pad = 10
        const availW = frameW - pad * 2
        const availH = frameH - pad * 2

        let drawW = availW
        let drawH = availH
        let drawX = frameX + pad
        let drawY = frameY + pad

        if (aspect > availW / availH) {
          drawW = availW
          drawH = availW / aspect
          drawX = frameX + pad
          drawY = frameY + pad + (availH - drawH) / 2
        } else {
          drawH = availH
          drawW = availH * aspect
          drawX = frameX + pad + (availW - drawW) / 2
          drawY = frameY + pad
        }

        ctx.drawImage(specimenImg, drawX, drawY, drawW, drawH)
        ctx.restore()

        // Outer stroke border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(frameX, frameY, frameW, frameH, 18)
        ctx.stroke()

        // Overlay Distressed Rubber Stamp in Top-Right Corner of the image
        if (stampImg) {
          ctx.save()
          ctx.translate(frameX + frameW - 75, frameY + 68)
          ctx.rotate((3.5 * Math.PI) / 180)
          ctx.drawImage(stampImg, -70, -70, 140, 140)
          ctx.restore()
        }

        curY += frameH + 24
      } else {
        // Fallback stamp in top right corner if no image
        if (stampImg) {
          ctx.save()
          ctx.translate(innerContentX + innerContentW - 75, cardY + 110)
          ctx.rotate((3.5 * Math.PI) / 180)
          ctx.drawImage(stampImg, -60, -60, 120, 120)
          ctx.restore()
        }
      }

      // 6. Dual Scores Box
      const scoreX = innerContentX
      const scoreY = curY
      const scoreW = innerContentW
      const scoreH = scoresBoxH

      ctx.fillStyle = '#FAF8F3'
      ctx.beginPath()
      ctx.roundRect(scoreX, scoreY, scoreW, scoreH, 18)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const colW = (scoreW - 60) / 2

      // Left Column: Craft Score
      const craftX = scoreX + 30
      ctx.fillStyle = '#059669' // emerald-600
      ctx.font = 'bold 12px monospace'
      ctx.fillText('CRAFT', craftX, scoreY + 36)

      ctx.fillStyle = '#171717'
      ctx.font = '900 36px sans-serif'
      ctx.fillText(`${review.craftScore}%`, craftX, scoreY + 78)

      // Craft progress bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.beginPath()
      ctx.roundRect(craftX, scoreY + 92, colW, 6, 3)
      ctx.fill()

      ctx.fillStyle = '#059669'
      ctx.beginPath()
      ctx.roundRect(craftX, scoreY + 92, Math.max(6, colW * (review.craftScore / 100)), 6, 3)
      ctx.fill()

      ctx.fillStyle = '#737373'
      ctx.font = '500 12px sans-serif'
      ctx.fillText('Polish and attention to detail', craftX, scoreY + 120)

      // Right Column: Utility Score
      const utilX = scoreX + 30 + colW + 30
      ctx.fillStyle = '#D97706' // amber-600
      ctx.font = 'bold 12px monospace'
      ctx.fillText('UTILITY', utilX, scoreY + 36)

      ctx.fillStyle = '#171717'
      ctx.font = '900 36px sans-serif'
      ctx.fillText(`${review.utilityScore}%`, utilX, scoreY + 78)

      // Utility progress bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.beginPath()
      ctx.roundRect(utilX, scoreY + 92, colW, 6, 3)
      ctx.fill()

      ctx.fillStyle = '#D97706'
      ctx.beginPath()
      ctx.roundRect(utilX, scoreY + 92, Math.max(6, colW * (review.utilityScore / 100)), 6, 3)
      ctx.fill()

      ctx.fillStyle = '#737373'
      ctx.font = '500 12px sans-serif'
      ctx.fillText('How useful it is in real work', utilX, scoreY + 120)

      curY += scoreH + 24

      // 7. Footer Watermark
      ctx.fillStyle = '#A3A3A3'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('VERIFIED INDEPENDENT CRITIQUE • SCREENLOG.DESIGN', innerContentX, curY + 12)

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      })
    },
    [review, safeImageDataUrl, rawMediaUrl],
  )

  // Precompute blob in background only when safeImageDataUrl is ready or if there is no image
  useEffect(() => {
    if (!isOpen || !review) return
    // Never precompute while media is still unresolved!
    if (rawMediaUrl && !safeImageDataUrl) return

    let active = true

    generateCardBlob(safeImageDataUrl).then((blob) => {
      if (active && blob) {
        setPrecomputedBlob(blob)
      }
    })

    return () => {
      active = false
    }
  }, [isOpen, review, rawMediaUrl, safeImageDataUrl, generateCardBlob])

  if (!isOpen || !review) return null

  const shareText = `My appraisal for ${review.app?.name ?? 'Software'}: ${review.craftScore}% Craft / ${review.utilityScore}% Utility. "${review.headline}" via @screenlog`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://screenlog.design'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareUrl}#review-${review._id}`)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleShareToX = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(shareUrl)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadImage = async () => {
    setIsExporting(true)
    try {
      let blob = precomputedBlob
      if (!blob || (rawMediaUrl && !safeImageDataUrl)) {
        blob = await generateCardBlob()
      }
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `screenlog-${review.authorHandle}-${review.app?.slug ?? 'critique'}-tastecard.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyImageToClipboard = async () => {
    setIsExporting(true)
    setClipboardWarning(null)

    try {
      let blob = precomputedBlob
      if (!blob || (rawMediaUrl && !safeImageDataUrl)) {
        blob = await generateCardBlob()
      }
      if (!blob) throw new Error('Could not render taste card image.')

      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 2000)
      } else {
        setClipboardWarning('Clipboard image copying is not supported on this browser. Use Save PNG instead.')
      }
    } catch (err: any) {
      console.warn('Clipboard write error:', err)
      // Do NOT silently download! Explain what happened so user has complete control.
      setClipboardWarning(
        'Clipboard write was blocked by browser permissions. Click "Save PNG" to download directly.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-7 border border-black/10 shadow-2xl z-10 select-none overflow-hidden my-auto max-h-[95vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-black/10 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="size-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  Export Taste Card
                </h3>
                <p className="text-xs text-neutral-400 font-medium">
                  High-res editorial appraisal card for X, Discord, or Figma
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-400 hover:text-foreground transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable Preview Area */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-none">
            {/* Card Visual Preview (Centered vertical layout matching timeline post!) */}
            <div
              ref={cardRef}
              className="w-full rounded-3xl bg-white border border-black/10 p-5 sm:p-6 shadow-xs relative overflow-hidden mb-4"
            >
              {/* Top Row: Critic Avatar, Handle & Scope Tag */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <CriticAvatar seed={review.authorHandle} size="md" rounded="squircle" />
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-foreground leading-tight">
                      @{review.authorHandle}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] font-mono text-amber-700 font-bold tracking-wider">
                      SCREENLOG LIVING SCORECARD
                    </p>
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-black/[0.04] text-neutral-700 border border-black/5">
                  {review.app?.category ?? 'DESIGN SYSTEM'}
                </span>
              </div>

              {/* Title & Attribution */}
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
                {review.app?.name ?? 'Software Appraisal'}
              </h3>

              {(review.app?.sourceAuthor || review.app?.sourceType) && (
                <p className="text-xs text-neutral-500 font-normal mb-2.5">
                  {review.app?.sourceType ?? 'Specimen'}{' '}
                  {review.app?.sourceAuthor ? (
                    <>
                      by{' '}
                      <span className="font-semibold text-neutral-700">
                        {review.app.sourceAuthor}
                      </span>
                    </>
                  ) : null}
                </p>
              )}

              {/* Headline and Quote */}
              {review.headline && (
                <p className="text-xs sm:text-sm font-bold text-neutral-800 mb-1">
                  &ldquo;{review.headline}&rdquo;
                </p>
              )}
              {review.quote && (
                <p className="text-xs text-neutral-700 leading-relaxed mb-4">
                  {review.quote}
                </p>
              )}

              {/* Visual Proof Media (Centered Hero with Rubber Stamp) */}
              {rawMediaUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-black/10 bg-white relative flex items-center justify-center p-2 shadow-2xs min-h-[160px]">
                  {isPreparingMedia && !safeImageDataUrl ? (
                    <div className="py-14 w-full flex flex-col items-center justify-center gap-2 text-neutral-400 bg-neutral-50/50 rounded-xl">
                      <LoaderCircle className="size-6 animate-spin text-amber-700" />
                      <span className="text-xs font-mono font-medium text-neutral-600">
                        Preparing export-ready specimen...
                      </span>
                    </div>
                  ) : (
                    <img
                      src={safeImageDataUrl || rawMediaUrl}
                      alt={review.app?.name ?? 'Visual proof'}
                      className="w-full h-auto max-h-[460px] object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Distressed Stamp Overlaid in Top-Right Corner of the Specimen */}
                  <div className="absolute top-3 right-3 select-none pointer-events-none z-10">
                    {review.verdict === 'lgtm' && (
                      <img
                        src="/assets/stamp_certified_lgtm.png"
                        alt="Certified LGTM"
                        className="w-24 sm:w-28 rotate-[3deg] drop-shadow-md"
                      />
                    )}
                    {review.verdict === 'mixed' && (
                      <img
                        src="/assets/stamp_needs_polish.png"
                        alt="Needs Polish"
                        className="w-24 sm:w-28 rotate-[-2deg] drop-shadow-md"
                      />
                    )}
                    {review.verdict === 'rotten' && (
                      <img
                        src="/assets/stamp_certified_rotten.png"
                        alt="Certified Rotten"
                        className="w-24 sm:w-28 rotate-[4deg] drop-shadow-md"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Fallback Stamp if no media */}
              {!rawMediaUrl && (
                <div className="absolute top-5 right-14 select-none pointer-events-none">
                  {review.verdict === 'lgtm' && (
                    <img
                      src="/assets/stamp_certified_lgtm.png"
                      alt="Certified LGTM"
                      className="w-20 sm:w-24 rotate-[3deg] drop-shadow-2xs"
                    />
                  )}
                  {review.verdict === 'mixed' && (
                    <img
                      src="/assets/stamp_needs_polish.png"
                      alt="Needs Polish"
                      className="w-20 sm:w-24 rotate-[-2deg] drop-shadow-2xs"
                    />
                  )}
                  {review.verdict === 'rotten' && (
                    <img
                      src="/assets/stamp_certified_rotten.png"
                      alt="Certified Rotten"
                      className="w-20 sm:w-24 rotate-[4deg] drop-shadow-2xs"
                    />
                  )}
                </div>
              )}

              {/* Dual Scores Box */}
              <div className="rounded-2xl bg-[#FAF8F3] border border-black/[0.06] p-4 sm:p-5 mb-3">
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  {/* Craft Score */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Palette className="size-3.5 text-emerald-600 stroke-[2.5]" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-800 uppercase">
                        CRAFT
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                      {review.craftScore}
                      <span className="text-lg sm:text-xl font-bold text-neutral-500">%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mt-2 mb-1.5">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${review.craftScore}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Polish and attention to detail
                    </p>
                  </div>

                  {/* Utility Score */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Pencil className="size-3.5 text-amber-600 stroke-[2.5]" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-amber-800 uppercase">
                        UTILITY
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                      {review.utilityScore}
                      <span className="text-lg sm:text-xl font-bold text-neutral-500">%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mt-2 mb-1.5">
                      <div
                        className="h-full bg-amber-500/80 rounded-full transition-all duration-500"
                        style={{ width: `${review.utilityScore}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      How useful it is in real work
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Watermark */}
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400">
                <span>VERIFIED INDEPENDENT CRITIQUE</span>
                <span>SCREENLOG.DESIGN</span>
              </div>
            </div>
          </div>

          {/* Warning / Notification Banner (if any) */}
          {clipboardWarning && (
            <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-700 shrink-0" />
              <span>{clipboardWarning}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 shrink-0">
            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-neutral-600" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {/* Share to X */}
            <button
              type="button"
              onClick={handleShareToX}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="size-3.5 text-neutral-600" />
              <span>Share to X</span>
            </button>

            {/* Copy Taste Card Image */}
            <button
              type="button"
              disabled={isExporting || isPreparingMedia}
              onClick={handleCopyImageToClipboard}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting || isPreparingMedia ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  <span>{isPreparingMedia ? 'Preparing...' : 'Copying...'}</span>
                </>
              ) : copiedImage ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Copied PNG!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-neutral-600" />
                  <span>Copy Card</span>
                </>
              )}
            </button>

            {/* Download PNG */}
            <button
              type="button"
              disabled={isExporting || isPreparingMedia}
              onClick={handleDownloadImage}
              className="px-3.5 py-2.5 rounded-xl bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isExporting || isPreparingMedia ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  <span>{isPreparingMedia ? 'Preparing...' : 'Exporting...'}</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>Save PNG</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

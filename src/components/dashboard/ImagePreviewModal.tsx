import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ExternalLink,
  Check,
} from 'lucide-react'

export interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  appName?: string
  authorHandle?: string
  sourceUrl?: string
  sourceAuthor?: string
  sourceType?: string
  verdict?: string
  craftScore?: number
  utilityScore?: number
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  appName = 'Software Specimen',
  authorHandle,
  sourceUrl,
  sourceAuthor,
  sourceType = 'Specimen',
  verdict,
  craftScore,
  utilityScore,
}: ImagePreviewModalProps) {
  // 'fit' = scaled to fit screen (contain), 'actual' = 100% natural dimensions with scroll
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit')
  const [isCopied, setIsCopied] = useState(false)

  // Reset zoom mode when opened
  useEffect(() => {
    if (isOpen) {
      setZoomMode('fit')
      setIsCopied(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key.toLowerCase() === 'z') {
        setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 text-white shrink-0 z-20">
            {/* Left: Specimen Details & Attributions */}
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                    {appName}
                  </h3>
                  
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 font-medium truncate">
                  {authorHandle && <span>Reviewed by @{authorHandle}</span>}
                  {sourceAuthor && (
                    <>
                      <span>&bull;</span>
                      <span>
                        {sourceType} by {sourceAuthor}
                      </span>
                    </>
                  )}
                  {craftScore !== undefined && utilityScore !== undefined && (
                    <>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="hidden sm:inline font-mono text-[11px] text-neutral-300">
                        {craftScore}% Craft / {utilityScore}% Utility
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions (Zoom Mode, Source, Copy, Close) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom Mode Toggle */}
              <button
                type="button"
                onClick={() =>
                  setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))
                }
                title={
                  zoomMode === 'fit'
                    ? 'Actual Size (100% natural resolution) [Z]'
                    : 'Fit to Viewport [Z]'
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
              >
                {zoomMode === 'fit' ? (
                  <>
                    <Maximize2 className="size-3.5" />
                    <span className="hidden sm:inline">Actual Size</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="size-3.5" />
                    <span className="hidden sm:inline">Fit Screen</span>
                  </>
                )}
              </button>

              {/* View Original Source Link */}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View original specimen page"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                >
                  <ArrowUpRight className="size-3.5 text-white/80" />
                  <span className="hidden sm:inline text-white">Source</span>
                </a>
              )}

              {/* Copy image link */}
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Image URL"
                className="size-8.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                {isCopied ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <ExternalLink className="size-4 text-white/80" />
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Close Preview [Esc]"
                className="size-8.5 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer ml-1"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Central Image Canvas Area */}
          <div
            onClick={(e) => {
              // Click backdrop to dismiss
              if (e.target === e.currentTarget) {
                onClose()
              }
            }}
            className={`flex-1 w-full overflow-auto relative p-4 sm:p-6 flex ${
              zoomMode === 'fit'
                ? 'items-center justify-center'
                : 'items-start justify-center'
            }`}
          >
            <div
              className={`relative transition-all duration-200 ${
                zoomMode === 'fit' ? 'max-w-full max-h-full flex items-center justify-center' : 'w-auto'
              }`}
            >
              <img
                src={imageUrl}
                alt={appName}
                referrerPolicy="no-referrer"
                onClick={() =>
                  setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))
                }
                className={`rounded-xl shadow-2xl transition-all duration-200 select-none ${
                  zoomMode === 'fit'
                    ? 'max-h-[82vh] max-w-[92vw] object-contain cursor-zoom-in ring-1 ring-white/15'
                    : 'w-auto h-auto max-w-none cursor-zoom-out ring-1 ring-white/20 my-4'
                }`}
              />

              {/* Rubber Stamp overlay on the preview image if verdict is present */}
              {verdict && (
                <div className="absolute top-4 right-4 pointer-events-none select-none z-10">
                  {verdict === 'lgtm' && (
                    <img
                      src="/assets/stamp_certified_lgtm.png"
                      alt="Certified LGTM"
                      className="w-24 sm:w-32 rotate-[3deg] drop-shadow-2xl"
                    />
                  )}
                  {verdict === 'mixed' && (
                    <img
                      src="/assets/stamp_needs_polish.png"
                      alt="Needs Polish"
                      className="w-24 sm:w-32 rotate-[-2deg] drop-shadow-2xl"
                    />
                  )}
                  {verdict === 'rotten' && (
                    <img
                      src="/assets/stamp_certified_rotten.png"
                      alt="Certified Rotten"
                      className="w-24 sm:w-32 rotate-[4deg] drop-shadow-2xl"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtle Bottom Controls Hint Bar */}
          <div className="py-2.5 px-4 text-center border-t border-white/5 bg-black/40 text-[11px] font-mono text-neutral-400 shrink-0 select-none">
            <span>
              Click image or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Z</kbd> to {zoomMode === 'fit' ? 'zoom 100%' : 'fit to screen'} &bull; Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Esc</kbd> to close
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

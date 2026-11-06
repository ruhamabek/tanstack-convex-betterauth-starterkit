import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Share2,
  Trophy,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { resolveAppIcon } from '../../lib/appIcons'
import {
  downloadAllStories,
  shareAllStories,
  type ShowreelExportData,
} from '../../lib/showreelExport'

export interface CriticShowreelModalProps {
  isOpen: boolean
  onClose: () => void
  profile?: {
    handle: string
    displayName: string
    avatarUrl?: string | null
    criticNumber?: number
    role?: string
    badge?: string
  } | null
  issueNumber?: number
  items?: Array<{
    name: string
    slug: string
    craftScore: number
    utilityScore: number
    status: string
    iconUrl?: string
    category?: string
  }>
}

const TOTAL_SLIDES = 5
const SLIDE_DURATION_MS = 6000

export default function CriticShowreelModal({
  isOpen,
  onClose,
  profile,
  issueNumber = 4,
  items,
}: CriticShowreelModalProps) {
  // Query accurate live showreel data for this critic
  const showreelData = useQuery(
    api.showreel.getCriticShowreelData,
    isOpen ? { handle: profile?.handle } : 'skip',
  )

  const activeProfile = showreelData?.profile || profile || {
    handle: 'critic',
    displayName: 'Founding Critic',
    role: 'Software Critic',
    badge: 'Founding Critic',
    criticNumber: 1,
    avatarUrl: null,
  }

  const issueNum = showreelData?.issueNumber || issueNumber || 4

  const champion = showreelData?.champion || {
    name: 'Raycast',
    slug: 'raycast',
    category: 'Productivity & Launcher',
    craftScore: 98,
    utilityScore: 94,
    status: 'Certified LGTM',
    iconUrl: '/assets/raycast_favicon.png',
    headline: 'The Gold Standard of Keyboard-First Native Desktop Software',
    quote: 'Raycast completely replaced Spotlight on day one. Hotkey response times are consistently under 16ms.',
    verdict: 'lgtm',
  }

  const activeItems = showreelData?.topSpecimens || items || [
    {
      name: 'Raycast',
      slug: 'raycast',
      craftScore: 98,
      utilityScore: 94,
      status: 'Certified LGTM',
      category: 'Productivity & Launcher',
      iconUrl: '/assets/raycast_favicon.png',
    },
    {
      name: 'Linear',
      slug: 'linear',
      craftScore: 96,
      utilityScore: 89,
      status: 'Certified LGTM',
      category: 'Issue Tracking',
      iconUrl: '/assets/linear_icon.png',
    },
    {
      name: 'Arc Browser (v2)',
      slug: 'arc-browser-v2',
      craftScore: 92,
      utilityScore: 48,
      status: 'Needs Polish',
      category: 'Web Browser',
      iconUrl: '/assets/arc_favicon.png',
    },
  ]

  const archetype = showreelData?.archetype || {
    title: 'The Subgrid Purist',
    narrative:
      'You evaluated desktop specimens with microscopic motion sensitivity, strict 8pt spatial discipline, and zero ergonomic tolerance.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Micro-motion sensitivity', score: 94 },
      { label: 'Subgrid layout discipline', score: 98 },
      { label: 'Ergonomic tolerance', score: 48 },
    ],
  }

  const allSpecimensCount = showreelData?.allSpecimensCount || activeItems.length

  const exportData: ShowreelExportData = {
    handle: activeProfile.handle,
    displayName: activeProfile.displayName,
    role: activeProfile.role,
    issueNumber: issueNum,
    allSpecimensCount,
    champion: {
      name: champion.name,
      craftScore: champion.craftScore,
      utilityScore: champion.utilityScore,
      category: champion.category,
      headline: champion.headline,
      quote: champion.quote,
      status: champion.status,
    },
    topSpecimens: activeItems.map((item) => ({
      name: item.name,
      craftScore: item.craftScore,
      utilityScore: item.utilityScore,
      category: item.category || 'Product',
      status: item.status,
    })),
    archetype: {
      title: archetype.title,
      narrative: archetype.narrative,
      sliders: archetype.sliders,
    },
  }

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isSharing, setIsSharing] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0)
      setSlideProgress(0)
      setIsPaused(false)
      setDownloadComplete(false)
    }
  }, [isOpen])

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((curr) => {
      if (curr < TOTAL_SLIDES - 1) {
        return curr + 1
      }
      onClose()
      return curr
    })
    setSlideProgress(0)
  }, [onClose])

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((curr) => Math.max(0, curr - 1))
    setSlideProgress(0)
  }, [])

  // Slide timer tick
  useEffect(() => {
    if (!isOpen || isPaused || isDownloading || isSharing) return

    const tickMs = 50
    const step = (tickMs / SLIDE_DURATION_MS) * 100

    const timer = window.setInterval(() => {
      setSlideProgress((prev) => Math.min(100, prev + step))
    }, tickMs)

    return () => clearInterval(timer)
  }, [isOpen, isPaused, isDownloading, isSharing, currentSlide])

  // Advance slide when progress completes
  useEffect(() => {
    if (slideProgress >= 100) {
      goToNextSlide()
    }
  }, [slideProgress, goToNextSlide])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToNextSlide()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevSlide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose])

  const handlePointerDown = () => setIsPaused(true)
  const handlePointerUp = () => setIsPaused(false)

  // High-Res Story PNG Export for ALL 5 SLIDES (1080x1920)
  const handleDownloadAll = async () => {
    setIsDownloading(true)
    setDownloadProgress(1)
    try {
      await downloadAllStories(exportData, (curr) => {
        setDownloadProgress(curr)
      })
      setDownloadComplete(true)
      setTimeout(() => setDownloadComplete(false), 3500)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  // Share all 5 stories via Web Share API or Twitter intent + batch download
  const handleShareAll = async () => {
    setIsSharing(true)
    try {
      await shareAllStories(exportData)
    } finally {
      setIsSharing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4">
        {/* Story Viewport (9:16 Aspect Ratio Container) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none border border-white/10"
        >
          {/* Top Story Progress Bars Header */}
          <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4 pb-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
            {/* Progress Segment Bars */}
            <div className="flex gap-1.5 w-full mb-3">
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{
                      width:
                        idx < currentSlide
                          ? '100%'
                          : idx === currentSlide
                            ? `${slideProgress}%`
                            : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 opacity-90">
                <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span className="text-[11px] font-black tracking-widest uppercase text-white font-sans">
                  SCREENLOG
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Download All 5 Stories button in top bar (accessible on every slide) */}
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadAll}
                  title="Download all 5 story cards (1080x1920 PNG)"
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin text-amber-300" />
                  ) : downloadComplete ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Left & Right Tap Zones */}
          <div
            onClick={goToPrevSlide}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-w-resize"
          />
          <div
            onClick={goToNextSlide}
            className="absolute right-0 top-16 bottom-20 w-2/3 z-20 cursor-e-resize"
          />

          {/* =========================================================================
              SLIDES (Animated Slide Switching)
             ========================================================================= */}
          <div className="relative size-full flex-1 overflow-hidden">
            <AnimatePresence>
              {/* SLIDE 1: The Intro Hook */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute inset-0 size-full bg-[#edeae4] text-neutral-900 flex flex-col justify-between p-6 sm:p-8 pt-20 overflow-hidden"
                >
                  {/* Looping vector line art */}
                  <svg
                    className="absolute inset-0 size-full pointer-events-none opacity-40"
                    viewBox="0 0 400 800"
                    fill="none"
                  >
                    <path
                      d="M-50 200 C 150 100, 250 300, 450 180"
                      stroke="#18181b"
                      strokeWidth="2"
                    />
                    <path
                      d="M-30 240 C 120 180, 280 320, 450 220"
                      stroke="#18181b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M-80 500 C 100 420, 300 580, 480 490"
                      stroke="#18181b"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Top copy */}
                  <div className="relative z-10 space-y-3 mt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-900 text-amber-300 font-mono text-[11px] font-bold tracking-wider uppercase">
                      Curated Taste Showreel
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight leading-tight">
                      We’re ready for you, <br />
                      <span className="text-neutral-900">@{activeProfile.handle}</span>.
                    </h2>
                    <p className="text-sm font-medium text-neutral-600">
                      Your curated software taste showreel is live. {allSpecimensCount} specimens evaluated this cycle.
                    </p>
                  </div>

                  {/* Giant Warped Numeral Typography (Spotify 2025 Style) */}
                  <div className="relative z-10 my-auto flex flex-col items-center">
                    <div className="relative">
                      {/* Warped checkerboard arc in corner */}
                      <div className="w-56 h-36 rounded-t-full bg-[radial-gradient(#18181b_20%,transparent_20%),radial-gradient(#18181b_20%,transparent_20%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] opacity-20 absolute -left-10 -bottom-6" />

                      {/* Giant Red Outline Numeral */}
                      <span
                        className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent block select-none"
                        style={{
                          WebkitTextStroke: '3px #f43f5e',
                          textShadow: '0 8px 0 rgba(244,63,94,0.15)',
                        }}
                      >
                        #{String(issueNum).padStart(2, '0')}
                      </span>
                    </div>

                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500 mt-2">
                      {activeProfile.role || 'Digital Craft Showcase'}
                    </p>
                  </div>

                  {/* Bottom tap prompt */}
                  <div className="relative z-10 flex items-center justify-between text-xs text-neutral-500 font-mono pt-4 border-t border-black/10">
                    <span>Tap anywhere to continue</span>
                    <ArrowRight className="size-4 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* SLIDE 2: The Consensus Champion / Personal Highest-Rated Specimen */}
              {currentSlide === 1 && (
                <motion.div
                  key="slide-2"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute inset-0 size-full bg-[#141416] text-white flex flex-col justify-between p-6 sm:p-8 pt-20 overflow-hidden"
                >
                  {/* Concentric ripples motif in bottom corner */}
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border-[12px] border-white/10 pointer-events-none" />
                  <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full border-[10px] border-white/10 pointer-events-none" />
                  <div className="absolute -right-4 -bottom-4 w-48 h-48 rounded-full border-[8px] border-white/15 pointer-events-none" />

                  {/* Top Badge */}
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-bold font-mono">
                      <Trophy className="size-3.5 text-amber-400" />
                      <span>YOUR TOP SPECIMEN</span>
                    </span>
                  </div>

                  {/* Center Giant Number */}
                  <div className="relative z-10 my-auto space-y-4">
                    <div>
                      <span className="text-xs uppercase font-mono tracking-widest text-neutral-400 block mb-1">
                        Top Evaluated Craft Score
                      </span>
                      <h1
                        className="text-7xl sm:text-8xl font-black text-[#a5b4fc] tracking-tight leading-none"
                        style={{
                          textShadow: '0 6px 0 #ffffff, 0 12px 24px rgba(0,0,0,0.5)',
                        }}
                      >
                        {champion.craftScore}%
                      </h1>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {champion.name} took the crown.
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xs line-clamp-3">
                        {champion.headline || champion.quote || `${champion.craftScore}% Craft / ${champion.utilityScore}% Utility. Ranked highest in your appraisal log.`}
                      </p>
                    </div>

                    {/* Rubber Stamp */}
                    <div className="pt-2">
                      <img
                        src={
                          champion.craftScore >= 90
                            ? '/assets/stamp_certified_lgtm.png'
                            : champion.craftScore >= 70
                              ? '/assets/stamp_needs_polish.png'
                              : '/assets/stamp_certified_rotten.png'
                        }
                        alt={champion.status || 'Status'}
                        className="w-28 rotate-[-4deg] drop-shadow-xl"
                      />
                    </div>
                  </div>

                  {/* Bottom App Preview Pill */}
                  <div className="relative z-10 p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAppIcon(champion, champion.iconUrl)}
                        alt={champion.name}
                        className="size-9 rounded-xl bg-neutral-900 p-1 object-contain"
                      />
                      <div>
                        <span className="font-bold text-xs text-white block">{champion.name}</span>
                        <span className="text-[11px] text-neutral-400 block">{champion.category}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400">#1 Ranked</span>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 3: Inverted Nominee Blocks (Top Specimens) */}
              {currentSlide === 2 && (
                <motion.div
                  key="slide-3"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute inset-0 size-full bg-[#f2efe9] text-neutral-900 flex flex-col justify-between p-6 sm:p-8 pt-20 overflow-hidden"
                >
                  {/* Polka Dot Halftone pattern in corner */}
                  <div className="absolute right-4 bottom-16 w-36 h-36 rounded-full bg-[radial-gradient(#18181b_25%,transparent_25%)] bg-[length:14px_14px] opacity-25 pointer-events-none" />

                  {/* Header */}
                  <div className="relative z-10 space-y-1">
                    <span className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-500 block">
                      Taste Story #{String(issueNum).padStart(2, '0')}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                      Top Evaluated Specimens
                    </h2>
                  </div>

                  {/* Staggered Inverted Black Blocks */}
                  <div className="relative z-10 space-y-3 my-auto">
                    {activeItems.map((item, idx) => {
                      const stamp =
                        item.craftScore >= 90
                          ? '/assets/stamp_certified_lgtm.png'
                          : item.craftScore >= 70
                            ? '/assets/stamp_needs_polish.png'
                            : '/assets/stamp_certified_rotten.png'

                      return (
                        <div
                          key={item.slug}
                          className="bg-neutral-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-3 transform transition hover:scale-[1.02]"
                          style={{
                            marginLeft: idx === 1 ? '12px' : '0px',
                            marginRight: idx === 2 ? '12px' : '0px',
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-2xl sm:text-3xl font-black text-neutral-400 font-mono">
                              {idx + 1}
                            </span>
                            <img
                              src={resolveAppIcon(item, item.iconUrl)}
                              alt={item.name}
                              className="size-8 rounded-lg bg-neutral-900 p-0.5 object-contain shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">
                                {item.name}
                              </h4>
                              <span className="text-xs font-mono text-neutral-400 block truncate">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-full bg-white/10 font-mono text-xs font-bold text-amber-300">
                              {item.craftScore}% Craft
                            </span>
                            <img
                              src={stamp}
                              alt="verdict"
                              className="w-14 sm:w-16 rotate-[-4deg] shrink-0"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  <div className="relative z-10 flex items-center justify-between text-xs font-mono text-neutral-500 pt-3 border-t border-black/10">
                    <span className="font-bold text-neutral-900">SCREENLOG · ISSUE #{String(issueNum).padStart(2, '0')}</span>
                    <span>CURATED CRAFT</span>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 4: Critic Personality Type */}
              {currentSlide === 3 && (
                <motion.div
                  key="slide-4"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute inset-0 size-full bg-black text-white flex flex-col justify-between p-6 sm:p-8 pt-20 pb-5 overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(ellipse at bottom left, rgba(244,63,94,0.22) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.18) 0%, transparent 60%), #000000',
                  }}
                >
                  {/* Top Content Stack */}
                  <div className="relative z-10 space-y-6">
                    {/* Header: TASTE PROFILE + Sparkles */}
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
                        TASTE PROFILE
                      </h1>
                      <span className="text-white text-base opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] select-none">
                        ✦ ✦
                      </span>
                    </div>

                    {/* Personality Type + Mascot */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm sm:text-base font-normal text-neutral-400 block">
                          Personality type
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 leading-tight">
                          {archetype.title}
                        </h2>
                      </div>

                      {/* 3D Mascot Character */}
                      <div className="relative size-20 sm:size-24 shrink-0 -mt-2 -mr-1">
                        <img
                          src={archetype.mascotUrl}
                          alt={archetype.title}
                          className="size-full object-contain rounded-2xl mix-blend-screen drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        />
                      </div>
                    </div>

                    {/* Top interests (Neon Sliders) */}
                    <div className="space-y-4 pt-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Top interests
                      </h3>

                      {archetype.sliders.map((slider) => (
                        <div key={slider.label} className="space-y-2">
                          <span className="text-sm sm:text-base font-normal text-neutral-100 block">
                            {slider.label}
                          </span>
                          <div className="w-full bg-neutral-800 h-[2.5px] rounded-full relative">
                            <div
                              className="h-full bg-gradient-to-r from-[#ff0055] to-[#ff2a6d] rounded-full shadow-[0_0_8px_rgba(255,0,85,0.8)]"
                              style={{ width: `${slider.score}%` }}
                            />
                            <div
                              className="size-3.5 rounded-full bg-[#ff0055] shadow-[0_0_10px_#ff0055] absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                              style={{ left: `${slider.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Top specimens */}
                    <div className="space-y-3.5 pt-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Top specimens
                      </h3>

                      <div className="space-y-3">
                        {activeItems.map((item) => (
                          <div key={item.slug} className="flex items-center gap-3.5">
                            <img
                              src={resolveAppIcon(item, item.iconUrl)}
                              alt={item.name}
                              className="size-8 rounded-full object-cover ring-1 ring-white/10 shrink-0 bg-neutral-900"
                            />
                            <span className="text-sm sm:text-base font-medium text-white truncate">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Screenlog Brandmark Footer (No YouTube icon) */}
                  <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                      <span className="text-sm font-black tracking-widest uppercase text-white font-sans">
                        SCREENLOG
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      CRITIC SHOWREEL · ISSUE #{String(issueNum).padStart(2, '0')}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 5: The Iridescent Squircle Share Card */}
              {currentSlide === 4 && (
                <motion.div
                  key="slide-5"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute inset-0 size-full bg-black text-white p-4 sm:p-5 pt-18 pb-4 overflow-hidden flex flex-col justify-between"
                >
                  {/* Glowing Iridescent Squircle Portal */}
                  <div className="relative my-auto w-full max-w-[340px] mx-auto">
                    {/* Diffuse Outer Ambient Neon Glow Halo */}
                    <div className="absolute -inset-1 rounded-[42px] bg-gradient-to-tr from-[#84cc16] via-[#f59e0b] to-[#ec4899] opacity-40 blur-xl pointer-events-none" />

                    {/* Smooth 2.5px Gradient Border Wrapper */}
                    <div className="relative p-[2.5px] rounded-[38px] bg-gradient-to-tr from-[#84cc16] via-[#f59e0b] to-[#ec4899] shadow-[0_0_35px_rgba(236,72,153,0.25)]">
                      {/* Deep Black Inner Card */}
                      <div className="bg-[#09090c] rounded-[35px] p-6 sm:p-7 text-center relative overflow-hidden">
                        {/* Atmospheric center glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Subtitle */}
                        <span className="text-xs sm:text-sm font-medium text-neutral-400 block tracking-wide">
                          Showreel #{String(issueNum).padStart(2, '0')} · @{activeProfile.handle}
                        </span>

                        {/* Main Title */}
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                          {archetype.title}
                        </h2>

                        {/* Narrative Paragraph */}
                        <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed mt-3 max-w-[260px] mx-auto">
                          {archetype.narrative}
                        </p>

                        {/* Subhead */}
                        <h3 className="text-xs sm:text-sm font-semibold text-white mt-6 mb-3">
                          Top specimens approved
                        </h3>

                        {/* Vertical Clean Specimen List */}
                        <div className="space-y-3 max-w-[200px] mx-auto text-left">
                          {activeItems.map((item) => (
                            <div key={item.slug} className="flex items-center gap-3">
                              <img
                                src={resolveAppIcon(item, item.iconUrl)}
                                alt={item.name}
                                className="size-7 rounded-full object-cover ring-1 ring-white/10 shrink-0 bg-neutral-900"
                              />
                              <span className="text-sm font-medium text-neutral-200 truncate">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All 5 Stories Action Bar */}
                  <div className="relative z-10 flex items-center gap-2 sm:gap-3 px-1 pt-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={handleDownloadAll}
                      className="h-12 px-4 sm:px-5 rounded-full border border-white/20 bg-black/70 hover:bg-white/10 flex items-center justify-center gap-2 text-white font-medium text-xs sm:text-sm transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
                      title="Download all 5 story cards (1080x1920 PNG)"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-amber-300" />
                          <span>Exporting ({downloadProgress}/5)...</span>
                        </>
                      ) : downloadComplete ? (
                        <>
                          <Check className="size-4 text-emerald-400" />
                          <span>All 5 Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-4.5" />
                          <span>Download All 5 (PNG)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSharing}
                      onClick={handleShareAll}
                      className="h-12 flex-1 rounded-full border border-white/20 bg-black/70 hover:bg-white/10 flex items-center justify-center gap-2 text-white font-medium text-xs sm:text-sm transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
                      title="Share all 5 story cards to social sheet"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-rose-400" />
                          <span>Sharing...</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="size-4.5" />
                          <span>Share All 5</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatePresence>
  )
}

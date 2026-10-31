import { useRef, useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Sparkles, Star, ArrowRight, CheckCircle2, Palette, Zap } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import CriticAvatar from '../components/CriticAvatar'

export const Route = createFileRoute('/')({
  component: ScreenlogHome,
})

const POPULAR_APPS = [
  {
    id: 'linear',
    name: 'Linear',
    sourceType: 'product',
    category: 'Issue Tracking & Project Management',
    tagline: 'The gold standard in high-density frontend craftsmanship.',
    craftScore: 96,
    utilityScore: 89,
    status: 'Certified LGTM',
    tags: ['Keyboard First', 'Speed', 'Subtle Motion'],
    topCritic: {
      handle: '@subgrid_sorcerer',
      role: 'Staff Frontend Engineer',
      text: 'Instant 60fps keyboard shortcuts, sublime typographic hierarchy. Other devtools feel like mud compared to this.',
      stars: 5.0,
    },
    topAudience: {
      handle: '@marcus_builds',
      role: 'Solo Founder',
      text: 'Super clean, but roadmap view gets slightly chaotic once you have more than 30 concurrent sub-initiatives.',
      stars: 4.5,
    },
  },
  {
    id: 'dynamic-island-audio',
    name: 'Dynamic Island Audio Expansion',
    sourceType: 'dribbble',
    sourceAuthor: '@peduarte',
    category: 'Micro-interactions & Physics',
    tagline: 'Spring fluid physics and optical typography scaling for live soundbars.',
    craftScore: 97,
    utilityScore: 88,
    status: 'Certified LGTM',
    tags: ['Spring Dynamics', 'Dribbble Shot', 'Figma Shaders'],
    topCritic: {
      handle: '@pixel_snob',
      role: 'Principal Product Designer',
      text: 'Velocity-based boundary stretch and haptic timing are an absolute masterclass in interaction physics.',
      stars: 5.0,
    },
    topAudience: {
      handle: '@fluid_designer',
      role: 'Motion Designer',
      text: 'Obsessed with the rubber-band dampening. Every single frame feels organic and responsive.',
      stars: 4.8,
    },
  },
  {
    id: 'cash-card-embossing',
    name: 'Cash Card Laser Haptics',
    sourceType: 'mobbin',
    sourceAuthor: 'Cash App Design Team',
    category: 'Mobile Interaction & Haptics',
    tagline: 'Haptic feedback card customizer with physics-based stamp engraving.',
    craftScore: 95,
    utilityScore: 92,
    status: 'Certified LGTM',
    tags: ['Mobbin Flow', 'Haptic Audio', 'Vector Canvas'],
    topCritic: {
      handle: '@pixel_detective',
      role: 'Design Engineer',
      text: 'Taking a mundane debit card onboarding step and turning it into a playground with tactile laser burns is peak software joy.',
      stars: 5.0,
    },
    topAudience: {
      handle: '@app_enthusiast',
      role: 'Mobile Lead',
      text: 'The attention to sound design while dragging your finger is unmatched on iOS.',
      stars: 4.6,
    },
  },
  {
    id: 'arc',
    name: 'Arc Browser (v2)',
    sourceType: 'product',
    category: 'Web Browser & Workspace',
    tagline: 'Radical reimagining of browsing tabs and AI-assisted workflows.',
    craftScore: 92,
    utilityScore: 48,
    status: 'Mixed Consensus',
    tags: ['Bold Experiment', 'High Memory', 'Custom Shaders'],
    topCritic: {
      handle: '@pixel_snob',
      role: 'Principal Product Designer',
      text: 'Pure visual poetry. The tactile spaces, custom color palettes, and floating search bar make Chrome look like 2008.',
      stars: 4.5,
    },
    topAudience: {
      handle: '@casual_surfer',
      role: 'Everyday User',
      text: 'Why did they hide my download bar? It constantly eats 4GB of RAM and freezes my Google Meet calls.',
      stars: 2.0,
    },
  },
  {
    id: 'raycast',
    name: 'Raycast',
    sourceType: 'product',
    category: 'Productivity & Launcher',
    tagline: 'Extensible command bar replacing Spotlight with native speed.',
    craftScore: 98,
    utilityScore: 94,
    status: 'Certified LGTM',
    tags: ['Native Swift', 'Zero Latency', 'Store Ecosystem'],
    topCritic: {
      handle: '@kerning_ghost',
      role: 'Verified Builder',
      text: 'Extensions feel native. The typography and dark-mode contrast ratios are virtually flawless.',
      stars: 5.0,
    },
    topAudience: {
      handle: '@elena_dev',
      role: 'Backend Engineer',
      text: 'Uninstalled Alfred on day one and never looked back. The clipboard history alone saves me 20 mins a day.',
      stars: 5.0,
    },
  },
]

function ScreenlogHome() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [consensusSource, setConsensusSource] = useState<string>('all')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Multi-plane parallax transforms for authentic 3D tabletop camera depth
  const foregroundY = useTransform(scrollYProgress, [0, 1], [0, -75])
  const deskY = useTransform(scrollYProgress, [0, 1], [0, 30])

  return (
    <div
      className="relative min-h-screen text-foreground selection:bg-amber-100 overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse 90% 65% at 50% 36%, var(--canvas) 0%, var(--desk-mid) 55%, var(--muted) 100%)',
      }}
    >
      
      {/* =========================================================================
          HERO SECTION: 100% REAL DOM REPLICA OF THE TACTILE DESK MOCKUP
         ========================================================================= */}
      <section
        ref={heroRef}
        className="relative w-full max-w-[1376px] mx-auto min-h-[740px] md:min-h-[800px] pt-24 sm:pt-32 md:pt-46 pb-16 px-4 sm:px-8 flex flex-col justify-between select-none"
      >
        
        {/* ================= LEFT FLANK (DESK STATIONERY & TOKENS) ================= */}

        {/* Loose Paperclip (Top-Left) */}
        <motion.div
          style={isMounted ? { y: foregroundY } : undefined}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="hidden lg:block absolute left-2 xl:left-4 top-[28%] -translate-y-4 w-10 xl:w-12 -rotate-45 pointer-events-none opacity-85"
        >
          <img src="/assets/paperclip_tight.png" alt="Paperclip" className="w-full h-auto drop-shadow-sm" />
        </motion.div>

        {/* Green Thumbs-up Token (Upper-Left) */}
        <motion.div
          style={isMounted ? { y: foregroundY } : undefined}
          initial={{ opacity: 0, y: -20, rotate: -10 }}
          animate={{ opacity: 1, y: 0, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.22 }}
          className="absolute left-6 sm:left-14 xl:left-24 top-20 sm:top-24 w-11 sm:w-14 xl:w-16 rotate-6 pointer-events-none select-none"
        >
          <img src="/assets/thumb_hires_tight.png" alt="Thumbs up badge" className="w-full h-auto drop-shadow-md" />
        </motion.div>

        {/* Review Card 1 (Mid-Left) */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="hidden lg:block absolute -left-8 xl:-left-4 top-[38%] w-52 xl:w-60 rounded-2xl bg-white/95 p-3.5 shadow-[0_16px_32px_-10px_rgba(0,0,0,0.1)] border border-black/5 -rotate-2 pointer-events-none select-none"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <div className="size-4.5 rounded-full bg-gradient-to-tr from-neutral-400 to-neutral-200" />
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-2.5 ${i < 3 ? 'fill-amber-400 text-amber-400' : i === 3 ? 'fill-amber-400/50 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-4/5 bg-neutral-200/80 rounded-full" />
            <div className="h-2 w-3/5 bg-neutral-200/80 rounded-full" />
            <div className="h-2 w-2/5 bg-neutral-100 rounded-full" />
          </div>
        </motion.div>

        {/* Gold Rating Medal Token (Mid-Left) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.65, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: -12 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.38 }}
          className="absolute left-8 sm:left-16 xl:left-28 top-[53%] -translate-y-4 w-12 sm:w-16 xl:w-18 -rotate-12 pointer-events-none select-none"
        >
          <img src="/assets/coin_hires_tight.png" alt="Gold Coin Medal" className="w-full h-auto drop-shadow-md" />
        </motion.div>

        {/* Review Card 2 (Lower-Left) */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="hidden lg:block absolute -left-12 xl:-left-8 top-[66%] w-48 xl:w-56 rounded-2xl bg-white/95 p-3 shadow-[0_14px_28px_-10px_rgba(0,0,0,0.08)] border border-black/5 rotate-2 pointer-events-none select-none"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-2.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 bg-neutral-200/70 rounded-full" />
            <div className="h-2 w-1/2 bg-neutral-100 rounded-full" />
          </div>
        </motion.div>

        {/* Green Folder Token (Bottom-Left) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.65, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 12 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.52 }}
          className="absolute left-6 sm:left-12 xl:left-20 bottom-8 sm:bottom-12 w-11 sm:w-14 xl:w-16 rotate-12 pointer-events-none select-none"
        >
          <img src="/assets/folder_hires_tight.png" alt="Folder Token" className="w-full h-auto drop-shadow-md" />
        </motion.div>

        {/* Review Card 3 with Avatar (Very Bottom Left) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
          className="hidden lg:block absolute left-8 xl:left-16 -bottom-3 w-56 xl:w-64 rounded-2xl bg-white/95 p-3 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.09)] border border-black/5 rotate-3 pointer-events-none select-none"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-4.5 rounded-full bg-emerald-600/30 flex items-center justify-center font-bold text-[8px] text-emerald-800">
              DG
            </div>
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-2.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="h-2 w-4/5 bg-neutral-200/70 rounded-full" />
        </motion.div>


        {/* ================= RIGHT FLANK (DESK STATIONERY & TOKENS) ================= */}

        {/* Top-Right Review Card */}
        <motion.div
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="hidden lg:block absolute -right-6 xl:right-2 top-20 xl:top-24 w-56 xl:w-64 rounded-2xl bg-white/95 p-4 shadow-[0_16px_32px_-10px_rgba(0,0,0,0.1)] border border-black/5 rotate-3 pointer-events-none select-none"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="size-5 rounded-full bg-neutral-300 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-amber-200" />
            </div>
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-3 ${i < 3 ? 'fill-amber-400 text-amber-400' : i === 3 ? 'fill-amber-400/50 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-neutral-200/80 rounded-full" />
            <div className="h-2 w-4/5 bg-neutral-200/80 rounded-full" />
            <div className="h-2 w-1/2 bg-neutral-200/60 rounded-full" />
          </div>
        </motion.div>

        {/* Purple Paper Airplane Token with Paperclip (Mid-Right) */}
        <motion.div
          style={isMounted ? { y: foregroundY } : undefined}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="absolute right-6 sm:right-14 xl:right-20 top-[42%] w-12 sm:w-16 xl:w-18 -rotate-12 pointer-events-none select-none"
        >
          <motion.div
            animate={{ y: [0, -7, 0], rotate: [-12, -9, -12] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/assets/purple_plane_clean_shadow.png" alt="Purple Airplane Token" className="w-full h-auto select-none" />
          </motion.div>
        </motion.div>

        {/* Review Card 5 with Avatar (Mid-Right) */}
        <motion.div
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="hidden lg:block absolute -right-10 xl:-right-4 top-[58%] w-52 xl:w-60 rounded-2xl bg-white/95 p-3.5 shadow-[0_14px_28px_-10px_rgba(0,0,0,0.08)] border border-black/5 -rotate-2 pointer-events-none select-none"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="size-4.5 rounded-full bg-neutral-300" />
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-2.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-4/5 bg-neutral-200/70 rounded-full" />
            <div className="h-2 w-3/5 bg-neutral-100 rounded-full" />
          </div>
        </motion.div>

        {/* Pair of Metallic Paperclips (Bottom-Right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          className="hidden sm:flex items-center gap-2 absolute right-8 sm:right-16 xl:right-24 bottom-10 sm:bottom-14 pointer-events-none opacity-85"
        >
          <div className="w-8 md:w-10 rotate-[25deg]">
            <img src="/assets/paperclip_tight.png" alt="Paperclip" className="w-full h-auto drop-shadow-sm" />
          </div>
          <div className="w-8 md:w-10 rotate-[35deg] -translate-y-2">
            <img src="/assets/paperclip_tight.png" alt="Paperclip" className="w-full h-auto drop-shadow-sm" />
          </div>
        </motion.div>

        {/* Bottom Review Card entering from bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.58 }}
          className="hidden lg:block absolute right-32 xl:right-48 -bottom-3 w-52 xl:w-60 rounded-2xl bg-white/95 p-3 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.09)] border border-black/5 -rotate-1 pointer-events-none select-none"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-4 rounded-full bg-neutral-400" />
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`size-2.5 ${i < 3 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              ))}
            </div>
          </div>
          <div className="h-2 w-3/4 bg-neutral-200/70 rounded-full" />
        </motion.div>


        {/* ================= CENTER HERO: TYPOGRAPHY + MASCOTS ================= */}
        <div className="relative mx-auto max-w-4xl text-center z-20 pt-4 sm:pt-6 pb-2">
          
          {/* THE 3-LINE HEADLINE WITH MASCOTS SITTING EXACTLY LIKE MOCKUP */}
          <div className="relative inline-flex flex-col items-center">
            
            {/* LINE 1: 'The Rotten' with Green Builder sitting on it and Tomato peeking */}
            <div className="relative inline-block">
              
              {/* GREEN BUILDER MASCOT: SITTING DIRECTLY ON TOP OF 'otten' */}
              <motion.div
                initial={{ opacity: 0, y: -70 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', mass: 1.4, stiffness: 210, damping: 18, delay: 0.18 }}
                className="absolute left-[36%] sm:left-[38%] md:left-[39%] -top-[78px] sm:-top-[112px] md:-top-[142px] w-[110px] sm:w-[155px] md:w-[192px] z-30 pointer-events-none select-none"
              >
                <motion.div
                  animate={{ y: [0, -3.5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img
                    src="/assets/green_mascot_tight.png"
                    alt="Green Builder Mascot"
                    className="w-full h-auto mt-4 drop-shadow-2xl"
                  />
                </motion.div>
              </motion.div>

              {/* RED TOMATO CRITIC: NESTLED RIGHT BESIDE 'Rotten' */}
              <motion.div
                initial={{ opacity: 0, y: -45, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', mass: 0.7, stiffness: 280, damping: 14, delay: 0.32 }}
                className="absolute top-[18px] sm:top-[28px] md:top-[36px] -right-[60px] sm:-right-[85px] md:-right-[112px] w-[55px] sm:w-[75px] md:w-[98px] z-20 pointer-events-none select-none"
              >
                <motion.div
                  animate={{ rotate: [0, 3.5, 0, -2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img
                    src="/assets/tomato_critic_tight.png"
                    alt="Tomato Critic"
                    className="w-full h-auto drop-shadow-xl"
                  />
                </motion.div>
              </motion.div>

              {/* Line 1 Text */}
              <motion.h1
                initial={{ opacity: 0, y: 24, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className="relative z-20 text-[44px] sm:text-[68px] md:text-[92px] font-[800] tracking-[-0.035em] text-foreground leading-[0.98]"
              >
                The Abebe
              </motion.h1>
            </div>

            {/* Line 2: 'The Rotten Tomatoes' */}
            <motion.span
              initial={{ opacity: 0, y: 24, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              className="relative z-20 block text-[44px] sm:text-[68px] md:text-[92px] font-[800] tracking-[-0.035em] text-foreground leading-[0.98]"
            >
              The Abebe Beso
            </motion.span>

            {/* Line 3: 'for software craft' */}
            <motion.span
              initial={{ opacity: 0, y: 24, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.19 }}
              className="relative z-20 block text-[44px] sm:text-[68px] md:text-[92px] font-[800] tracking-[-0.035em] text-foreground leading-[0.98]"
            >
              Bela software craft
            </motion.span>

          </div>

          {/* ================= BOTTOM CENTER DESK ARTIFACTS ================= */}
          <motion.div
            style={isMounted ? { y: deskY } : undefined}
            className="relative mt-10 sm:mt-14 w-full flex items-center justify-center gap-4 sm:gap-8 md:gap-10 flex-wrap z-20"
          >
            
            {/* Clipped Mini Dashboard Document */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.28 }}
              className="w-[160px] sm:w-[220px] md:w-[270px] -rotate-3 pointer-events-none select-none"
            >
              <img
                src="/assets/clipped_dashboard_tight.png"
                alt="Clipped Mini Dashboard"
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>

            {/* Yellow Post-It Note ("Certified LGTM ♡") with Authentic Master Peeled 3D Effect */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 1.06 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.36 }}
              className="w-[130px] sm:w-[175px] md:w-[215px] pointer-events-none select-none"
            >
              <img
                src="/assets/postit_master_peeled.png"
                alt="Post-it: Certified LGTM"
                className="w-full h-auto block"
              />
            </motion.div>

            {/* Blue Award Ribbon Token */}
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.42 }}
              className="w-[42px] sm:w-[56px] md:w-[70px] pointer-events-none select-none"
            >
              <img
                src="/assets/medal_hires_tight.png"
                alt="Blue Award Medal"
                className="w-full h-auto drop-shadow-md"
              />
            </motion.div>

            {/* 3D Diagonal Green Rubber Stamp */}
            <motion.div
              initial={{ opacity: 0, y: 55, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', mass: 1.5, stiffness: 230, damping: 18, delay: 0.48 }}
              className="relative w-[110px] sm:w-[145px] md:w-[175px] pointer-events-none select-none"
            >
              <img
                src="/assets/rubber_stamp_3d.png"
                alt="Green Desk Rubber Stamp"
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>

          </motion.div>

        </div>

      </section>


      {/* =========================================================================
          THE DUAL-SCORE CONSENSUS SHOWCASE (Rotten Tomatoes Layer)
         ========================================================================= */}
      <section id="consensus" className="relative py-20 px-6 max-w-7xl mx-auto border-t border-black/5">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 mb-4">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span>The Consensus Layer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Critics dissect the craft. <br />The audience judges the utility.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            No corporate PR. No sponsored placements. Just the raw divide between how software looks and how it actually feels to use.
          </p>
        </div>

        {/* Specimen Source Filter Pills */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Artifacts' },
            { id: 'product', label: 'Live Products' },
            { id: 'dribbble', label: 'Dribbble Shots' },
            { id: 'mobbin', label: 'Mobbin Flows' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setConsensusSource(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                consensusSource === tab.id
                  ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30 shadow-2xs'
                  : 'bg-white hover:bg-black/5 text-muted-foreground border border-black/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PRODUCT & SPECIMEN CARDS WITH DUAL METERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {POPULAR_APPS.filter(
            (app) => consensusSource === 'all' || (app.sourceType || 'product') === consensusSource,
          ).map((app) => (
            <div
              key={app.id}
              className="group relative rounded-3xl bg-white p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] border border-black/5 transition hover:-translate-y-1.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground tracking-tight">{app.name}</h3>
                      {app.sourceType && app.sourceType !== 'product' && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 border border-amber-500/20 uppercase">
                          {app.sourceType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-neutral-400 mt-0.5">
                      {'sourceAuthor' in app && app.sourceAuthor ? `by ${app.sourceAuthor} • ` : ''}
                      {app.category}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    app.craftScore > 90 && app.utilityScore > 80
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/20'
                      : 'bg-rose-50 text-rose-700 border border-rose-500/20'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
                  {app.tagline}
                </p>

                {/* THE ROTTEN TOMATOES DUAL METER LOCKUP */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-card-subtle border border-black/5 mb-6">
                  {/* Critics / Craft Score */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-black/5 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black text-amber-600">{app.craftScore}%</span>
                      <Palette className="size-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mt-0.5">
                      Craft Score
                    </span>
                    <span className="text-[9px] text-neutral-400">Designers & Devs</span>
                  </div>

                  {/* Audience / Utility Score */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-black/5 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-black ${app.utilityScore < 60 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {app.utilityScore}%
                      </span>
                      <Zap className="size-4 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mt-0.5">
                      Utility Score
                    </span>
                    <span className="text-[9px] text-neutral-400">Everyday Users</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {app.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Top Takes Preview */}
                <div className="space-y-3 border-t border-neutral-100 pt-4">
                  <div className="text-[11px] text-neutral-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
                      <CriticAvatar seed={app.topCritic.handle} size="xs" rounded="full" />
                      <span>Critic Take ({app.topCritic.handle}):</span>
                    </div>
                    "{app.topCritic.text}"
                  </div>

                  <div className="text-[11px] text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-800 mb-1">
                      <CriticAvatar seed={app.topAudience.handle} size="xs" rounded="full" />
                      <span>Audience Take ({app.topAudience.handle}):</span>
                    </div>
                    "{app.topAudience.text}"
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-400">Rate this product</span>
                <span className="text-black group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Log Take →
                </span>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* =========================================================================
          THE THURSDAY DROP (Weekly Premiere Ritual)
         ========================================================================= */}
      <section id="drops" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="relative rounded-[2.5rem] bg-sea-ink text-white p-8 sm:p-14 overflow-hidden">
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4 border border-emerald-500/30">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Voting Open • 42h Remaining</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Thursday Drop #04: <br />
              The Redesign Ballot.
            </h2>
            
            <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
              Every Thursday at 9 AM, 3 high-profile product redesigns drop into the ballot box. 
              Ratings stay completely blind until you cast your vote to prevent bandwagon bias.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                className="rounded-full bg-white px-6 py-3.5 text-xs font-bold text-black hover:bg-neutral-200 transition shadow-sm cursor-pointer"
              >
                Cast Your Anonymous Ballot
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer"
              >
                View Last Week's Top 10
              </button>
            </div>
          </div>

          <div className="hidden lg:block absolute right-14 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
            <img
              src="/assets/rubber_stamp_3d.png"
              alt="Rubber stamp silhouette"
              className="w-64 h-auto invert"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          TASTE CARD MAKER (Viral Letterboxd 4-Pack)
         ========================================================================= */}
      <section id="card-maker" className="py-20 px-6 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 mb-4">
              <Sparkles className="size-3.5 text-purple-500" />
              <span>Shareable Artifacts</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Your public taste card.<br />Four favorites in one image.
            </h2>
            
            <p className="mt-4 text-neutral-600 text-sm sm:text-base leading-relaxed">
              In an era where thousands of generic interfaces are generated with one prompt, human taste is the ultimate signal. Export your 4 favorite software interfaces with your verified pseudonym and share it directly to X.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Zero career retaliation: completely protected by persistent pseudonyms.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Auto-generated 1200x630 pixel-perfect PNG card.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Optionally connect GitHub or Figma for a 'Verified Builder' badge.</span>
              </li>
            </ul>

            <div className="mt-8">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3.5 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <span>Generate My Taste Card (Free)</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl bg-neutral-900 text-white p-7 shadow-2xl border border-neutral-800">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
                  KG
                </div>
                <div>
                  <span className="text-xs font-bold block">@kerning_ghost</span>
                  <span className="text-[10px] text-emerald-400">Verified Senior Designer</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-neutral-400">SCREENLOG TASTE CARD</span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-5">
              {[
                { title: 'Linear', tag: 'Micro-interactions', rating: '5.0' },
                { title: 'Raycast', tag: 'Speed & Architecture', rating: '5.0' },
                { title: 'Amie', tag: 'Tactile Delight', rating: '4.5' },
                { title: 'Stripe Billing', tag: 'Doc Ergonomics', rating: '4.5' },
              ].map((item) => (
                <div key={item.title} className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-neutral-100">{item.title}</span>
                    <span className="text-[10px] font-mono text-amber-400">★ {item.rating}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{item.tag}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-500">
              <span>screenlog.io/@kerning_ghost</span>
              <span>Certified LGTM 2026</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Award, CheckCircle2, Clock, ShieldCheck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Doc } from '../../../convex/_generated/dataModel'

export interface FoundingCriticBadgeProps {
  profile?: Doc<'profiles'> | null
  reviewsCount: number
}

export default function FoundingCriticBadge({
  profile,
  reviewsCount,
}: FoundingCriticBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const badgeText = profile?.badge ?? 'Founding Critic'
  const criticNum = profile?.criticNumber ?? 1
  const isFounding = badgeText === 'Founding Critic'
  const isSealed = reviewsCount >= 1

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Badge Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-500/25 transition active:scale-95 cursor-pointer shadow-2xs"
        title="View Founding Critic Credential Details"
        aria-expanded={isOpen}
      >
        <Award className="size-3.5 text-amber-600" />
        <span>{badgeText}</span>
        {isFounding && (
          <span className="font-mono text-[10px] text-amber-700 font-semibold bg-amber-500/15 px-1.5 py-0.2 rounded-md">
            #{criticNum}
          </span>
        )}
      </button>

      {/* Popover Credential Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop for seamless tap-outside dismissal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-28 sm:absolute sm:inset-x-auto sm:top-full sm:left-0 mt-2.5 z-50 sm:w-[360px] rounded-2xl bg-canvas border border-black/10 p-5 shadow-2xl text-foreground"
            >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 border border-amber-500/20">
                  <Award className="size-5 text-amber-700" />
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
                    {badgeText}
                    {isFounding && (
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        #{criticNum} / 500
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Genesis Editorial Credential
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Credential Requirements Checklist */}
            <div className="mt-4 space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Founding Requirements
              </p>

              {/* Requirement 1: Genesis Member */}
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-800">
                    Genesis Cohort Seat
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Claimed seat #{criticNum} of the inaugural 500 critics before public release.
                  </div>
                </div>
              </div>

              {/* Requirement 2: Persona Pseudonym */}
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-800">
                    Protected Pseudonym Claimed
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Identity shielded behind @{profile?.handle ?? 'critic'} for uncompromised craft honesty.
                  </div>
                </div>
              </div>

              {/* Requirement 3: Proof of Appraisal */}
              <div className="flex items-start gap-2.5 text-xs">
                {isSealed ? (
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <span>Proof of Appraisal</span>
                    {isSealed ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Sealed ({reviewsCount} logged)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        Action Required (0/1)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isSealed
                      ? 'Verified evaluation ledger with dual craft/utility scores and editorial pull-quotes.'
                      : 'File at least 1 verified software critique to permanently seal this credential.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Footer */}
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-neutral-600">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Zero Career Retaliation
              </span>
              <span className="font-serif italic text-amber-900/80">
                Screenlog Editorial Board
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  )
}

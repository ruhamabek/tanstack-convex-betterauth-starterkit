import { Sparkles, Plus } from 'lucide-react'
import CriticAvatar from '../CriticAvatar'

export interface CommunityFeedHeaderProps {
  criticHandle?: string
  criticRole?: string
  onOpenEvaluate: () => void
  onOpenSpecimen: () => void
  totalTakesCount: number
}

export default function CommunityFeedHeader({
  criticHandle = 'critic',
  onOpenEvaluate,
  onOpenSpecimen,
  totalTakesCount,
}: CommunityFeedHeaderProps) {
  return (
    <div className="w-full bg-canvas border-b border-black/10 select-none">
      {/* Top Banner Row: Live Consortium Broadcast Status */}
      <div className="px-4 sm:px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-[10px] font-mono font-bold tracking-wider border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE CONSENSUS</span>
            </span>

            <span className="text-[11px] font-mono text-neutral-400 font-semibold hidden sm:inline">
              SCREENLOG CONSORTIUM FEED
            </span>
          </div>

          <div className="text-[11px] font-mono font-bold text-neutral-500">
            <span className="text-foreground">{totalTakesCount}</span> Living Appraisals
          </div>
        </div>

        {/* Title and Tagline */}
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Community Consensus
        </h1>
        <p className="text-xs text-neutral-500 font-medium mt-0.5 max-w-xl">
          Real-time software audits, Dribbble dilemma dissections, and counter-appraisals from verified critics.
        </p>
      </div>

      {/* Quick Action Interactive Composer Bar */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="rounded-2xl bg-desk border border-black/10 p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div
            onClick={onOpenEvaluate}
            className="flex items-center gap-3 flex-1 cursor-pointer group"
          >
            <CriticAvatar seed={criticHandle} size="md" rounded="squircle" />
            <div className="flex-1 text-xs text-neutral-400 group-hover:text-neutral-700 transition font-medium">
              Audit software or counter-appraise a take...
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSpecimen}
              className="px-3 sm:px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="size-3 text-amber-700" />
              <span className="hidden sm:inline">Ingest</span>
              <span>Specimen</span>
            </button>

            <button
              type="button"
              onClick={onOpenEvaluate}
              className="px-3.5 sm:px-4 py-1.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span>Evaluate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

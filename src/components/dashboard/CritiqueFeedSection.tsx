import { useState, useMemo } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import ScorecardReviewCard, { type ReviewWithAppAndSocial } from './ScorecardReviewCard'

export type VerdictFilter = 'all' | 'lgtm' | 'mixed' | 'rotten' | 'specimen'

export interface CritiqueFeedSectionProps {
  reviews: ReviewWithAppAndSocial[]
  onOpenCritiqueModal: () => void
  onOpenDiscussion?: (review: ReviewWithAppAndSocial) => void
  onExportTasteCard?: (review: ReviewWithAppAndSocial) => void
  onCounterAppraise?: (review: ReviewWithAppAndSocial) => void
}

export default function CritiqueFeedSection({
  reviews,
  onOpenCritiqueModal,
  onOpenDiscussion,
  onExportTasteCard,
  onCounterAppraise,
}: CritiqueFeedSectionProps) {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all')

  const lgtmCount = reviews.filter((r) => r.verdict === 'lgtm').length
  const mixedCount = reviews.filter((r) => r.verdict === 'mixed').length
  const rottenCount = reviews.filter((r) => r.verdict === 'rotten').length

  const filteredReviews = useMemo(() => {
    if (verdictFilter === 'all') return reviews
    return reviews.filter((r) => r.verdict === verdictFilter)
  }, [reviews, verdictFilter])

  const tabs: { id: VerdictFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: reviews.length },
    { id: 'lgtm', label: 'Certified LGTM', count: lgtmCount },
    { id: 'mixed', label: 'Needs Polish', count: mixedCount },
    { id: 'rotten', label: 'Rotten', count: rottenCount },
  ]

  return (
    <section className="w-full bg-canvas select-none">
      {/* X-Style Borderless Underline Tabs */}
      <div className="flex border-b border-black/10 bg-canvas/90 backdrop-blur-xs sticky top-0 z-20 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = verdictFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVerdictFilter(tab.id)}
              className={`flex-1 min-w-[100px] py-3.5 px-3 text-center text-xs sm:text-[13px] font-bold transition hover:bg-black/5 relative cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'text-foreground font-black'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[11px] font-mono text-neutral-400 font-normal">
                ({tab.count})
              </span>

              {/* Active Underline Indicator Bar */}
              {isActive && (
                <span className="absolute bottom-0 inset-x-4 sm:inset-x-8 h-1 bg-foreground rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Strictly Single-Column Vertical Feed (No Grid!) */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="size-14 rounded-2xl bg-desk border border-black/10 flex items-center justify-center mb-4 shadow-2xs">
            <Sparkles className="size-6 text-amber-600" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-foreground">
            {verdictFilter === 'all'
              ? 'No evaluations filed yet'
              : `No ${verdictFilter.toUpperCase()} evaluations found`}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1.5 mb-6">
            {verdictFilter === 'all'
              ? 'Your desk is clean. Audit your first software app or ingest a specimen to start your consensus timeline.'
              : 'Try selecting another tab above or file a new software evaluation.'}
          </p>
          <button
            type="button"
            onClick={onOpenCritiqueModal}
            className="inline-flex items-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-5 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>File Your First Critique</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-3.5 sm:p-5">
          {filteredReviews.map((review) => (
            <ScorecardReviewCard
              key={review._id}
              review={review}
              onOpenDiscussion={onOpenDiscussion}
              onExportTasteCard={onExportTasteCard}
              onCounterAppraise={onCounterAppraise}
            />
          ))}
        </div>
      )}
    </section>
  )
}

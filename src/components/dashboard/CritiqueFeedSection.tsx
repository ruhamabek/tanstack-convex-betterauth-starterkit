import { useState, useMemo } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import ScorecardReviewCard from './ScorecardReviewCard'

export type VerdictFilter = 'all' | 'lgtm' | 'rotten' | 'mixed'

export interface CritiqueFeedSectionProps {
  reviews: Doc<'reviews'>[]
  onOpenCritiqueModal: () => void
}

export default function CritiqueFeedSection({
  reviews,
  onOpenCritiqueModal,
}: CritiqueFeedSectionProps) {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all')

  const lgtmCount = reviews.filter((r) => r.verdict === 'lgtm').length
  const rottenCount = reviews.filter((r) => r.verdict === 'rotten').length
  const mixedCount = reviews.filter((r) => r.verdict === 'mixed').length

  const filteredReviews = useMemo(() => {
    if (verdictFilter === 'all') return reviews
    return reviews.filter((r) => r.verdict === verdictFilter)
  }, [reviews, verdictFilter])

  return (
    <section className="space-y-4">
      {/* Section Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-black/10">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
            Recent Critique Log & Scorecards
          </h2>
          <p className="text-xs text-neutral-500">
            Living artifacts of your evaluations preserved in the public consensus layer.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-black/10 shadow-2xs self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setVerdictFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
              verdictFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-neutral-600 hover:text-foreground'
            }`}
          >
            All ({reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setVerdictFilter('lgtm')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
              verdictFilter === 'lgtm'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-foreground'
            }`}
          >
            Certified LGTM ({lgtmCount})
          </button>

          <button
            type="button"
            onClick={() => setVerdictFilter('rotten')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
              verdictFilter === 'rotten'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-foreground'
            }`}
          >
            Rotten ({rottenCount})
          </button>

          {mixedCount > 0 && (
            <button
              type="button"
              onClick={() => setVerdictFilter('mixed')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                verdictFilter === 'mixed'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-foreground'
              }`}
            >
              Needs Polish ({mixedCount})
            </button>
          )}
        </div>
      </div>

      {/* Feed Content */}
      {filteredReviews.length === 0 ? (
        <div className="bg-canvas rounded-3xl border border-dashed border-black/15 p-12 text-center flex flex-col items-center justify-center">
          <div className="size-16 rounded-2xl bg-desk border border-black/10 flex items-center justify-center mb-4 shadow-2xs">
            <Sparkles className="size-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {verdictFilter === 'all'
              ? 'Your Desk is Clean'
              : `No ${verdictFilter.toUpperCase()} Critiques Found`}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-5">
            {verdictFilter === 'all'
              ? "You haven't logged any software critiques yet. Click below to file your first appraisal."
              : 'Try selecting a different filter tab above or file a new critique.'}
          </p>
          <button
            type="button"
            onClick={onOpenCritiqueModal}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Log Your First Critique</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <ScorecardReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}

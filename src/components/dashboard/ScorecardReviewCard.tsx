import type { Doc } from '../../../convex/_generated/dataModel'

export type ReviewWithApp = Doc<'reviews'> & { app?: Doc<'apps'> | null }

export interface ScorecardReviewCardProps {
  review: ReviewWithApp
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function ScorecardReviewCard({ review }: ScorecardReviewCardProps) {
  const relativeDate = formatRelativeTime(review.createdAt)

  return (
    <div className="group relative bg-scorecard rounded-[28px] border border-black/10 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Header: App icon, Name, Category & Timestamp */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {review.app?.iconUrl ? (
              <img
                src={review.app.iconUrl}
                alt={review.app.name}
                className="size-11 rounded-xl object-contain border border-black/5 bg-white shrink-0 p-1 shadow-2xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="size-11 rounded-xl bg-white border border-black/5 flex items-center justify-center font-black text-sm text-foreground shadow-2xs">
                {(review.app?.name ?? 'App').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-black text-foreground tracking-tight leading-snug">
                  {review.app?.name ?? 'Software'}
                </h4>
                {review.featureName && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/20">
                    {review.featureName}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-neutral-500">
                {review.app?.category ?? 'Software Tool'}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-neutral-400 whitespace-nowrap">
            {relativeDate}
          </span>
        </div>

        {/* Visual Proof Media (if attached) */}
        {review.mediaUrl && review.mediaType === 'image' && (
          <div className="mb-3.5 rounded-xl overflow-hidden border border-black/10 bg-black/5 max-h-48 group/media relative">
            <img
              src={review.mediaUrl}
              alt={review.featureName ? `${review.app?.name} - ${review.featureName}` : review.app?.name}
              className="w-full h-full max-h-48 object-cover transition-transform duration-200 group-hover/media:scale-105"
            />
          </div>
        )}

        {review.mediaUrl && (review.mediaType === 'loom' || review.mediaType === 'video_embed') && (
          <div className="mb-3.5 rounded-xl overflow-hidden border border-black/10 bg-black/5 aspect-video max-h-48 relative">
            <iframe
              src={review.mediaUrl}
              title="Visual Proof Recording"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}

        {/* Dual Scores Bar */}
        <div className="grid grid-cols-2 divide-x divide-black/10 py-1.5 mb-3.5 bg-black/[0.02] rounded-xl px-3 border border-black/5">
          <div className="pr-3">
            <div className="text-2xl font-black text-foreground leading-none">
              {review.craftScore}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
              Craft Score
            </div>
          </div>
          <div className="pl-3">
            <div className="text-2xl font-black text-foreground leading-none">
              {review.utilityScore}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
              Utility Score
            </div>
          </div>
        </div>

        {/* Review Quote & Headline */}
        {review.headline && (
          <p className="text-xs font-bold text-foreground leading-snug mb-1">
            {review.headline}
          </p>
        )}
        <p className="text-xs text-neutral-700 italic leading-relaxed">
          &ldquo;{review.quote}&rdquo;
        </p>
      </div>

      {/* Footer with Dynamic Distressed Rubber Stamp */}
      <div className="relative pt-4 mt-4 border-t border-black/5 flex items-center justify-between min-h-[48px]">
        <div className="text-[11px] font-mono text-neutral-400">
          @{review.authorHandle}
        </div>

        {review.verdict === 'lgtm' && (
          <img
            src="/assets/stamp_certified_lgtm.png"
            alt="Certified LGTM"
            className="w-24 rotate-[3deg] select-none pointer-events-none drop-shadow-xs transition-transform group-hover:scale-105"
          />
        )}
        {review.verdict === 'mixed' && (
          <img
            src="/assets/stamp_needs_polish.png"
            alt="Needs Polish"
            className="w-24 rotate-[-2deg] select-none pointer-events-none drop-shadow-xs transition-transform group-hover:scale-105"
          />
        )}
        {review.verdict === 'rotten' && (
          <img
            src="/assets/stamp_certified_rotten.png"
            alt="Certified Rotten"
            className="w-24 rotate-[4deg] select-none pointer-events-none drop-shadow-xs transition-transform group-hover:scale-105"
          />
        )}
      </div>
    </div>
  )
}

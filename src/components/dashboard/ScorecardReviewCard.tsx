import { useState } from 'react'
import {
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
  Palette,
   ArrowUpRight,
  Pencil,
} from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'

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
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatSourceLabel(sourceType?: string): string {
  switch (sourceType) {
    case 'figma':
      return 'Figma file'
    case 'dribbble':
      return 'Dribbble shot'
    case 'mobbin':
      return 'Mobbin flow'
    case 'pinterest':
      return 'Pinterest board'
    case 'x_twitter':
      return 'X drop'
    case 'product':
    default:
      return 'Software product'
  }
}

export default function ScorecardReviewCard({ review }: ScorecardReviewCardProps) {
  const relativeDate = formatRelativeTime(review.createdAt)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const displayMediaUrl = review.mediaUrl || review.app?.mediaUrl
  const isVideo = review.mediaType === 'loom' || review.mediaType === 'video_embed'
  const sourceLabel = formatSourceLabel(review.app?.sourceType)

  return (
    <article className="group relative w-full bg-white rounded-3xl p-5 sm:p-6 border border-black/10 shadow-2xs transition hover:shadow-xs select-none">
      {/* Top Header: Critic Avatar, Handle, Timestamp & Options */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <CriticAvatar
            seed={review.authorHandle}
            size="md"
            rounded="squircle"
            className="border border-black/10 shadow-2xs"
          />
          <div className="min-w-0">
            <h4 className="font-black text-[15px] sm:text-base text-foreground leading-tight truncate">
              @{review.authorHandle}
            </h4>
            <p className="text-xs text-neutral-400 font-medium">
              Posted {relativeDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-400 hover:text-foreground transition cursor-pointer shrink-0"
          aria-label="More options"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Tags / Scope Row */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-black/[0.04] text-neutral-700 border border-black/5">
          {review.app?.category ?? 'DESIGN SYSTEM'}
        </span>
 
      </div>

      {/* App / Specimen Title */}
      <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
        {review.app?.name ?? 'Software Appraisal'}
      </h3>

      {/* Attribution Line: "Figma file by Pietro Schirano (@skirano)" */}
      {(review.app?.sourceAuthor || review.app?.sourceType) && (
        <p className="text-xs sm:text-[13px] text-neutral-500 font-normal mb-3">
          {sourceLabel}{' '}
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

      {/* Unquoted Clean Critique Text */}
      {review.quote && (
        <p className="text-sm sm:text-[15px] text-neutral-800 leading-relaxed mb-4">
          {review.quote}
        </p>
      )}

      {/* Visual Proof Media (with Overlay Rubber Stamp in Top-Right Corner) */}
      {displayMediaUrl && !isVideo && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-black/10 bg-white relative group/media">
          <img
            src={displayMediaUrl}
            alt={review.app?.name ?? 'Visual proof'}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[520px] object-cover object-top transition-transform duration-200 group-hover/media:scale-[1.01]"
            onError={(e) => {
              e.currentTarget.parentElement?.classList.add('hidden')
            }}
          />

          {/* Distressed Rubber Stamp Overlaid on Top-Right of the Specimen */}
          <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 select-none pointer-events-none z-10">
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

          {/* View Source Link on Hover */}
          {review.app?.sourceUrl && (
            <a
              href={review.app.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1 transition opacity-0 group-hover/media:opacity-100 shadow-xs"
            >
              <span className='text-white'>View Source</span>
             <ArrowUpRight size={12} className='text-white/60'/>
            </a>
          )}
        </div>
      )}

      {/* Video Proof (if attached) */}
      {displayMediaUrl && isVideo && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-black/10 bg-black/5 aspect-video max-h-80 relative">
          <iframe
            src={displayMediaUrl}
            title="Visual Proof Recording"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Fallback Stamp if no media */}
      {!displayMediaUrl && (
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
      <div className="rounded-2xl bg-[#FAF8F3] border border-black/[0.06] p-4 sm:p-5 mb-4">
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
            {/* Progress Bar */}
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
            {/* Progress Bar */}
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

      {/* Action Bar (Comment, Repost, Like, Bookmark, Share) */}
      <div className="flex items-center justify-between pt-1 text-neutral-400 text-xs">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            className="flex items-center gap-2 hover:text-sky-600 transition cursor-pointer group/act"
          >
            <div className="p-1 rounded-full group-hover/act:bg-sky-50 transition">
              <MessageSquare className="size-4" />
            </div>
            <span className="text-xs font-medium">1</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 hover:text-emerald-600 transition cursor-pointer group/act"
          >
            <div className="p-1 rounded-full group-hover/act:bg-emerald-50 transition">
              <Repeat2 className="size-4" />
            </div>
            <span className="text-xs font-medium">2</span>
          </button>

          <button
            type="button"
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-2 transition cursor-pointer group/act ${
              liked ? 'text-rose-600' : 'hover:text-rose-600'
            }`}
          >
            <div className="p-1 rounded-full group-hover/act:bg-rose-50 transition">
              <Heart
                className={`size-4 ${liked ? 'fill-rose-600 text-rose-600' : ''}`}
              />
            </div>
            <span className="text-xs font-medium">{liked ? 5 : 4}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => setBookmarked(!bookmarked)}
            className={`transition cursor-pointer group/act p-1 rounded-full hover:bg-amber-50 ${
              bookmarked ? 'text-amber-600' : 'hover:text-amber-600'
            }`}
            aria-label="Bookmark review"
          >
            <Bookmark
              className={`size-4 ${bookmarked ? 'fill-amber-600 text-amber-600' : ''}`}
            />
          </button>

          <button
            type="button"
            className="transition cursor-pointer group/act p-1 rounded-full hover:bg-black/5 hover:text-neutral-700"
            aria-label="Share review"
          >
            <Share className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

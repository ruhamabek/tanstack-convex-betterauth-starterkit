import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
   Palette,
  ArrowUpRight,
  Pencil,
  Copy,
  Check,
  Share2,
  Sparkles,
  Maximize2,
} from 'lucide-react'
import { useConvexMutation } from '@convex-dev/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'
import ImagePreviewModal from './ImagePreviewModal'

export type ReviewWithAppAndSocial = Doc<'reviews'> & {
  authorAvatarUrl?: string | null
  app?: Doc<'apps'> | null
  parentReview?: (Doc<'reviews'> & { app?: Doc<'apps'> | null; authorAvatarUrl?: string | null }) | null
  endorseCount?: number
  commentCount?: number
  bookmarkCount?: number
  isEndorsed?: boolean
  isBookmarked?: boolean
}

export interface ScorecardReviewCardProps {
  review: ReviewWithAppAndSocial
  onOpenDiscussion?: (review: ReviewWithAppAndSocial) => void
  onExportTasteCard?: (review: ReviewWithAppAndSocial) => void
  onCounterAppraise?: (review: ReviewWithAppAndSocial) => void
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

export default function ScorecardReviewCard({
  review,
  onOpenDiscussion,
  onExportTasteCard,
  onCounterAppraise,
}: ScorecardReviewCardProps) {
  const relativeDate = formatRelativeTime(review.createdAt)

  // Social mutations
  const toggleEndorseMutation = useConvexMutation(api.social.toggleEndorse)
  const toggleBookmarkMutation = useConvexMutation(api.social.toggleBookmark)

  // Optimistic UI state
  const [liked, setLiked] = useState(Boolean(review.isEndorsed))
  const [likeCount, setLikeCount] = useState(review.endorseCount ?? 0)
  const [bookmarked, setBookmarked] = useState(Boolean(review.isBookmarked))
  const [likePopping, setLikePopping] = useState(false)

  // Menus state
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showRepeatMenu, setShowRepeatMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [repostToast, setRepostToast] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)

  const shareMenuRef = useRef<HTMLDivElement>(null)
  const repeatMenuRef = useRef<HTMLDivElement>(null)

  // Keep synced if review props update
  useEffect(() => {
    if (review.isEndorsed !== undefined) setLiked(review.isEndorsed)
    if (review.endorseCount !== undefined) setLikeCount(review.endorseCount)
    if (review.isBookmarked !== undefined) setBookmarked(review.isBookmarked)
  }, [review.isEndorsed, review.endorseCount, review.isBookmarked])

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target as Node)
      ) {
        setShowShareMenu(false)
      }
      if (
        repeatMenuRef.current &&
        !repeatMenuRef.current.contains(e.target as Node)
      ) {
        setShowRepeatMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleToggleEndorse = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))
    setLikePopping(true)
    setTimeout(() => setLikePopping(false), 300)

    try {
      const res = await toggleEndorseMutation({ reviewId: review._id })
      setLiked(res.endorsed)
      setLikeCount(res.count)
    } catch {
      // Revert on error
      setLiked(!nextLiked)
      setLikeCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextBookmarked = !bookmarked
    setBookmarked(nextBookmarked)

    try {
      const res = await toggleBookmarkMutation({ reviewId: review._id })
      setBookmarked(res.bookmarked)
    } catch {
      setBookmarked(!nextBookmarked)
    }
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/dashboard#review-${review._id}` : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => {
        setCopiedLink(false)
        setShowShareMenu(false)
      }, 1500)
    } catch {
      setShowShareMenu(false)
    }
  }

  const handleShareToX = () => {
    const shareText = `My appraisal for ${review.app?.name ?? 'Software'}: ${review.craftScore}% Craft / ${review.utilityScore}% Utility. "${review.headline}" via @screenlog`
    const url = typeof window !== 'undefined' ? window.location.href : 'https://screenlog.design'
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
    setShowShareMenu(false)
  }

  const handleRepost = () => {
    setRepostToast(true)
    setShowRepeatMenu(false)
    setTimeout(() => setRepostToast(false), 2500)
  }

  const displayMediaUrl = review.mediaUrl || review.app?.mediaUrl
  const isVideo = review.mediaType === 'loom' || review.mediaType === 'video_embed'
  const sourceLabel = formatSourceLabel(review.app?.sourceType)

  return (
    <article className="group relative w-full bg-white rounded-3xl p-5 sm:p-6 border border-black/10 shadow-2xs transition hover:shadow-xs select-none">
      {/* Repost confirmation notification */}
      {repostToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="size-3.5" />
          <span>Critique reposted to your timeline</span>
        </div>
      )}

      {/* Top Header: Critic Avatar, Handle, Timestamp & Options */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          to="/u/$handle"
          params={{ handle: review.authorHandle }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 min-w-0 group/author !no-underline"
          title={`View @${review.authorHandle}'s critic profile`}
        >
          <CriticAvatar
            avatarUrl={review.authorAvatarUrl}
            seed={review.authorHandle}
            size="md"
            rounded="squircle"
            className="border border-black/10 shadow-2xs group-hover/author:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <h4 className="font-black text-[15px] sm:text-base text-foreground leading-tight truncate group-hover/author:underline">
              @{review.authorHandle}
            </h4>
            <p className="text-xs text-neutral-400 font-medium">
              Posted {relativeDate}
            </p>
          </div>
        </Link>

        
      </div>

      {/* Tags / Scope Row */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-black/[0.04] text-neutral-700 border border-black/5">
          {review.app?.category ?? 'DESIGN SYSTEM'}
        </span>
      </div>

      {/* App / Specimen Title */}
      {review.app?.slug ? (
        <Link
          to="/app/$slug"
          params={{ slug: review.app.slug }}
          className="inline-block group/app !no-underline"
          title={`View ${review.app.name} consensus scorecard`}
        >
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1 group-hover/app:underline">
            {review.app.name}
          </h3>
        </Link>
      ) : (
        <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
          {review.app?.name ?? 'Software Appraisal'}
        </h3>
      )}

      {/* Attribution Line */}
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

      {/* Counter-Appraisal Quoted Take (if this critique quotes another) */}
      {review.parentReview && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-[#F6F4ED] border border-black/8 relative">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Link
              to="/u/$handle"
              params={{ handle: review.parentReview.authorHandle }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/parentAuthor !no-underline"
              title={`View @${review.parentReview.authorHandle}'s critic profile`}
            >
              <CriticAvatar
                avatarUrl={review.parentReview.authorAvatarUrl}
                seed={review.parentReview.authorHandle}
                size="xs"
                rounded="squircle"
                className="group-hover/parentAuthor:scale-105 transition-transform"
              />
              <span className="text-xs font-bold text-foreground group-hover/parentAuthor:underline">
                @{review.parentReview.authorHandle}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 bg-neutral-200/60 px-1.5 py-0.2 rounded font-bold">
                Quoted Take
              </span>
            </Link>

            <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
              <span className="text-emerald-700 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {review.parentReview.craftScore}% CRAFT
              </span>
              <span className="text-amber-800 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                {review.parentReview.utilityScore}% UTILITY
              </span>
            </div>
          </div>

          {review.parentReview.headline && (
            <p className="text-xs font-bold text-neutral-800 line-clamp-1 mb-0.5">
              &ldquo;{review.parentReview.headline}&rdquo;
            </p>
          )}
          {review.parentReview.quote && (
            <p className="text-xs text-neutral-600 line-clamp-2 italic">
              {review.parentReview.quote}
            </p>
          )}
        </div>
      )}

      {/* Visual Proof Media (with Overlay Rubber Stamp in Top-Right Corner) */}
      {displayMediaUrl && !isVideo && (
        <div
          onClick={() => setShowImagePreview(true)}
          className="mb-4 rounded-2xl overflow-hidden border border-black/10 bg-white relative group/media cursor-zoom-in select-none"
          title="Click to view full preview"
        >
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

          {/* Full Preview Indicator Badge on Hover */}
          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1.5 transition opacity-0 group-hover/media:opacity-100 shadow-xs pointer-events-none z-10">
            <Maximize2 size={12} className="text-white/80" />
            <span>Full Preview</span>
          </div>

          {/* View Source Link on Hover */}
          {review.app?.sourceUrl && (
            <a
              href={review.app.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1 transition opacity-0 group-hover/media:opacity-100 shadow-xs z-10"
            >
              <span className="text-white">View Source</span>
              <ArrowUpRight size={12} className="text-white/60" />
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

      {/* Action Bar (Comment, Repost/Counter, Endorse, Bookmark, Share) */}
      <div className="flex items-center justify-between pt-1 text-neutral-400 text-xs">
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Discussion Drawer Trigger */}
          <button
            type="button"
            onClick={() => onOpenDiscussion?.(review)}
            className="flex items-center gap-1.5 hover:text-sky-600 transition cursor-pointer group/act"
            title="Open discussion drawer"
          >
            <div className="p-1 rounded-full group-hover/act:bg-sky-50 transition">
              <MessageSquare className="size-4" />
            </div>
            <span className="text-xs font-medium">
              {review.commentCount ?? 0}
            </span>
          </button>

          {/* Repost Dropdown */}
          <div className="relative" ref={repeatMenuRef}>
            <button
              type="button"
              onClick={() => setShowRepeatMenu(!showRepeatMenu)}
              className="flex items-center gap-1.5 hover:text-neutral-900 transition cursor-pointer group/act"
              title="Repost"
            >
              <div className="p-1 rounded-full group-hover/act:bg-neutral-100 transition">
                <Repeat2 className="size-4" />
              </div>
              <span className="text-xs font-medium">
                {review.parentReview ? '1' : '0'}
              </span>
            </button>

            {showRepeatMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-black/10 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleRepost}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-100 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Repeat2 className="size-4 text-neutral-600" />
                  <span>Repost</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRepeatMenu(false)
                    onCounterAppraise?.(review)
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-100 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Repeat2 className="size-4 text-neutral-600" />
                  <span>Repost with your thoughts</span>
                </button>
              </div>
            )}
          </div>

          {/* Endorse (Heart) */}
          <button
            type="button"
            onClick={handleToggleEndorse}
            className={`flex items-center gap-1.5 transition cursor-pointer group/act ${
              liked ? 'text-rose-600' : 'hover:text-rose-600'
            }`}
            title="Endorse critique"
          >
            <div className="p-1 rounded-full group-hover/act:bg-rose-50 transition">
              <Heart
                className={`size-4 transition-transform duration-200 ${
                  likePopping ? 'scale-125' : 'scale-100'
                } ${liked ? 'fill-rose-600 text-rose-600' : ''}`}
              />
            </div>
            <span className="text-xs font-medium">{likeCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          {/* Bookmark */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`transition cursor-pointer group/act p-1 rounded-full hover:bg-amber-50 ${
              bookmarked ? 'text-amber-600' : 'hover:text-amber-600'
            }`}
            aria-label="Bookmark review"
            title={bookmarked ? 'Remove from specimen collection' : 'Save to specimen collection'}
          >
            <Bookmark
              className={`size-4 ${bookmarked ? 'fill-amber-600 text-amber-600' : ''}`}
            />
          </button>

          {/* Share Dropdown */}
          <div className="relative" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="transition cursor-pointer group/act p-1 rounded-full hover:bg-black/5 hover:text-neutral-700"
              aria-label="Share review"
              title="Share review"
            >
              <Share className="size-4" />
            </button>

            {showShareMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-black/10 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2 transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-neutral-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareToX}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="size-3.5 text-neutral-500" />
                  <span>Share to X</span>
                </button>

                <div className="h-px bg-black/5 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowShareMenu(false)
                    onExportTasteCard?.(review)
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-900 hover:bg-amber-500/10 flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-amber-700" />
                  <span>Export Taste Card</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      {displayMediaUrl && !isVideo && (
        <ImagePreviewModal
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
          imageUrl={displayMediaUrl}
          appName={review.app?.name ?? 'Software Specimen'}
          authorHandle={review.authorHandle}
          sourceUrl={review.app?.sourceUrl}
          sourceAuthor={review.app?.sourceAuthor}
          sourceType={review.app?.sourceType}
          verdict={review.verdict}
          craftScore={review.craftScore}
          utilityScore={review.utilityScore}
        />
      )}
    </article>
  )
}

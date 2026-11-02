import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare, LoaderCircle, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { useQuery as useConvexReactQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'

export interface CritiqueDiscussionDrawerProps {
  isOpen: boolean
  onClose: () => void
  review: (Doc<'reviews'> & { app?: Doc<'apps'> | null; authorAvatarUrl?: string | null }) | null
  currentProfile?: Doc<'profiles'> | null
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

export default function CritiqueDiscussionDrawer({
  isOpen,
  onClose,
  review,
  currentProfile,
}: CritiqueDiscussionDrawerProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const addCommentConvex = useConvexMutation(api.social.addComment)
  const addCommentMutation = useMutation({
    mutationFn: addCommentConvex,
    onSuccess: () => {
      setContent('')
      setError(null)
      // Scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to post comment.')
    },
  })

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !review) return null

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)

    if (!currentProfile) {
      setError('Please claim your critic pseudonym before commenting.')
      return
    }

    await addCommentMutation.mutateAsync({
      reviewId: review._id,
      content: content.trim(),
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Slide-over Drawer */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-screen max-w-md lg:max-w-lg bg-canvas border-l border-black/10 shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Drawer Top Header */}
            <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center border border-sky-500/20">
                  <MessageSquare className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                    Critique Discussion
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Debating craft &amp; utility with fellow critics
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-400 hover:text-foreground transition cursor-pointer"
                aria-label="Close discussion drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Critique Topic Card (Sticky Anchor) */}
            <div className="p-4 border-b border-black/10 bg-[#FAF8F3] shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <CriticAvatar
                  avatarUrl={review.authorAvatarUrl}
                  seed={review.authorHandle}
                  size="sm"
                  rounded="squircle"
                />
                <span className="text-xs font-bold text-foreground">
                  @{review.authorHandle}
                </span>
                <span className="text-[11px] text-neutral-400">&bull;</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {review.app?.name ?? 'App Appraisal'}
                </span>
              </div>

              {review.quote && (
                <p className="text-xs text-neutral-700 font-normal leading-relaxed line-clamp-2 italic mb-2.5">
                  &ldquo;{review.quote}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  CRAFT: {review.craftScore}%
                </span>
                <span className="text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  UTILITY: {review.utilityScore}%
                </span>
                <span className="uppercase text-[10px] text-neutral-400 font-bold ml-auto">
                  {review.verdict}
                </span>
              </div>
            </div>

            {/* Comments Thread (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-none">
              {/* Discussion Drawer Body with Live Comments Component */}
              <RealtimeComments reviewId={review._id} />
              <div ref={commentsEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-4 border-t border-black/10 bg-white shrink-0">
              {error && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {!currentProfile && (
                <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-700 shrink-0" />
                  <span>Set up your critic pseudonym in your profile to participate.</span>
                </div>
              )}

              <form onSubmit={handlePostComment} className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    currentProfile
                      ? `Reply as @${currentProfile.handle}...`
                      : 'Sign in & claim pseudonym to comment...'
                  }
                  disabled={!currentProfile || addCommentMutation.isPending}
                  rows={2}
                  maxLength={500}
                  className="w-full pr-12 pl-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs resize-none disabled:opacity-60 placeholder:text-neutral-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handlePostComment(e)
                    }
                  }}
                />

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {content.length}/500 &bull; Ctrl+Enter to send
                  </span>

                  <button
                    type="submit"
                    disabled={!content.trim() || !currentProfile || addCommentMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    {addCommentMutation.isPending ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.aside>
        </div>
      </div>
    </AnimatePresence>
  )
}

function RealtimeComments({ reviewId }: { reviewId: Id<'reviews'> }) {
  const comments = useConvexReactQuery(api.social.listComments, { reviewId })

  if (comments === undefined) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
        <LoaderCircle className="size-5 animate-spin text-neutral-500" />
        <span className="text-xs font-medium">Loading critique thread...</span>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center">
        <div className="size-10 rounded-xl bg-black/5 flex items-center justify-center mb-2.5">
          <MessageSquare className="size-5 text-neutral-400" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-foreground">
          No discussion yet
        </h4>
        <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
          Be the first critic to share feedback on this evaluation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {comments.map((comment) => (
        <div
          key={comment._id}
          className="p-3.5 rounded-2xl bg-white border border-black/8 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <CriticAvatar
                avatarUrl={(comment as any).authorAvatarUrl}
                seed={comment.authorHandle}
                size="sm"
                rounded="squircle"
                className="border border-black/5"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    @{comment.authorHandle}
                  </span>
                  {comment.authorBadge === 'Founding Critic' && (
                    <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-500/15 px-1.5 py-0.2 rounded">
                      FOUNDING
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {comment.authorRole}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-neutral-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          <p className="text-xs text-neutral-800 leading-relaxed pl-8 font-normal">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  )
}

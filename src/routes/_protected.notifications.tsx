import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Bell,
  CheckCheck,
  Flame,
  Repeat2,
  MessageSquare,
  UserPlus,
  ArrowRight,
  Inbox,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import CriticAvatar from '../components/CriticAvatar'
import DashboardRightRail from '../components/dashboard/DashboardRightRail'
import CritiqueDiscussionDrawer from '../components/dashboard/CritiqueDiscussionDrawer'
import TasteCardExportModal from '../components/dashboard/TasteCardExportModal'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'
import type { ReviewWithAppAndSocial } from '../components/dashboard/ScorecardReviewCard'

export const Route = createFileRoute('/_protected/notifications')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.apps.list, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.notifications.list, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.notifications.getUnreadCount, {}),
      ),
    ])

    return null
  },
  component: NotificationsPage,
})

type NotificationFilter = 'all' | 'quote' | 'endorse' | 'comment' | 'follow'

const FILTER_TABS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'quote', label: 'Quoted Takes' },
  { id: 'endorse', label: 'Endorsements' },
  { id: 'comment', label: 'Discussions' },
  { id: 'follow', label: 'Followers' },
]

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return '1d'
  if (diffDays < 30) return `${diffDays}d`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function NotificationsPage() {
  const { convexQueryClient } = Route.useRouteContext()
  const navigate = useNavigate()

  // Queries
  const { data: profile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
  )
  const { data: apps = [] } = useQuery(
    convexQueryClient.queryOptions(api.apps.list, {}),
  )
  const { data: notifications = [] } = useQuery(
    convexQueryClient.queryOptions(api.notifications.list, {}),
  )
  const { data: unreadCount = 0 } = useQuery(
    convexQueryClient.queryOptions(api.notifications.getUnreadCount, {}),
  )
  const { data: communityReviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listCommunityFeed, {}),
  )

  // Filter state
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all')

  // Mutations
  const markAsReadMutation = useConvexMutation(api.notifications.markAsRead)
  const markAllAsReadMutation = useConvexMutation(api.notifications.markAllAsRead)
  const evaluateAppMutation = useConvexMutation(api.apps.upsertAppAndEvaluate)
  const createAndAppraiseMutation = useConvexMutation(
    api.apps.createAndAppraiseSpecimen,
  )

  const markAsRead = useMutation({ mutationFn: markAsReadMutation })
  const markAllAsRead = useMutation({ mutationFn: markAllAsReadMutation })
  const evaluateApp = useMutation({ mutationFn: evaluateAppMutation })
  const createAndAppraise = useMutation({
    mutationFn: createAndAppraiseMutation,
  })

  // Modals / Drawers state
  const [activeDiscussionReview, setActiveDiscussionReview] =
    useState<ReviewWithAppAndSocial | null>(null)
  const [activeTasteCardReview, setActiveTasteCardReview] =
    useState<ReviewWithAppAndSocial | null>(null)
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [showCreateSpecimenModal, setShowCreateSpecimenModal] = useState(false)
  const [targetAppId, setTargetAppId] = useState<Id<'apps'> | undefined>(undefined)

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter((n) => n.type === activeTab)
  }, [notifications, activeTab])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync({})
    } catch {
      // ignore
    }
  }

  const handleNotificationClick = async (n: (typeof notifications)[0]) => {
    if (!n.read) {
      try {
        await markAsRead.mutateAsync({ notificationId: n._id })
      } catch {
        // ignore
      }
    }

    if (n.type === 'follow') {
      navigate({ to: '/u/$handle', params: { handle: n.actorHandle } })
      return
    }

    if (n.reviewId) {
      const match = communityReviews.find((r) => r._id === n.reviewId)
      if (match) {
        setActiveDiscussionReview(match)
      } else {
        navigate({ to: '/feed' })
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'endorse':
        return <Flame className="size-4 text-amber-600 fill-amber-500/20" />
      case 'quote':
        return <Repeat2 className="size-4 text-indigo-600" />
      case 'comment':
        return <MessageSquare className="size-4 text-sky-600" />
      case 'follow':
        return <UserPlus className="size-4 text-emerald-600" />
      default:
        return <Bell className="size-4 text-neutral-500" />
    }
  }

  const getNotificationDescription = (n: (typeof notifications)[0]) => {
    switch (n.type) {
      case 'follow':
        return (
          <span>
            started following your <strong className="text-foreground font-bold">Critic Persona</strong>
          </span>
        )
      case 'endorse':
        return (
          <span>
            endorsed your consensus critique of{' '}
            <strong className="text-foreground font-bold">{n.appName || 'software specimen'}</strong>
          </span>
        )
      case 'quote':
        return (
          <span>
            quoted your appraisal of{' '}
            <strong className="text-foreground font-bold">{n.appName || 'software specimen'}</strong> with a counter-appraisal
          </span>
        )
      case 'comment':
        return (
          <span>
            commented on your evaluation of{' '}
            <strong className="text-foreground font-bold">{n.appName || 'software specimen'}</strong>
          </span>
        )
      default:
        return <span>interacted with your critique</span>
    }
  }

  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: Sticky Header, Filter Underline Tabs & Stream */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-20 border-b border-black/10 bg-canvas/90 backdrop-blur-xs select-none">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 text-[11px] font-mono font-black animate-in fade-in zoom-in-95 duration-150">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-foreground transition cursor-pointer px-3 py-1.5 rounded-full hover:bg-black/5"
                title="Mark all notifications as read"
              >
                <CheckCheck className="size-4" />
                <span className="hidden sm:inline">Mark all as read</span>
              </button>
            )}
          </div>

          {/* X-Style Underline Filter Tabs */}
          <div className="flex border-t border-black/5 overflow-x-auto scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[76px] py-3 text-center text-xs sm:text-sm font-bold transition hover:bg-black/5 relative cursor-pointer flex items-center justify-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-foreground font-black'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-4 sm:inset-x-6 h-1 bg-foreground rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Stream */}
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-24 text-center flex flex-col items-center justify-center select-none animate-in fade-in duration-200">
            <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 mb-4 shadow-2xs">
              <Inbox className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              {activeTab === 'all'
                ? 'Nothing to review yet'
                : `No ${FILTER_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} yet`}
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-6">
              {activeTab === 'all'
                ? 'When other critics follow your persona, endorse your evaluations, or counter-appraise your audits, you’ll see them in this stream.'
                : 'Activity matching this filter will show up here as software critics interact with your work.'}
            </p>
            <Link
              to="/feed"
              className="px-6 py-2.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 inline-flex items-center gap-2 shadow-xs !no-underline"
            >
              <span className='text-white'>Explore Home Feed</span>
              <ArrowRight className="size-3.5 text-white" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {filteredNotifications.map((n) => {
              const isUnread = !n.read

              return (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 sm:p-5 transition cursor-pointer flex items-start gap-3.5 sm:gap-4 select-none relative ${
                    isUnread
                      ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                      : 'hover:bg-black/[0.02]'
                  }`}
                >
                  {/* Left Action Badge & Avatar Column */}
                  <div className="relative shrink-0 pt-0.5">
                    <Link
                      to="/u/$handle"
                      params={{ handle: n.actorHandle }}
                      onClick={(e) => e.stopPropagation()}
                      className="block group"
                      title={`View @${n.actorHandle}'s profile`}
                    >
                      <CriticAvatar
                        avatarUrl={n.actorAvatarUrl}
                        seed={n.actorHandle}
                        size="md"
                        className="size-10 sm:size-11 rounded-full border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                    </Link>
                    <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-xs">
                      {getTypeIcon(n.type)}
                    </div>
                  </div>

                  {/* Notification Content Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <Link
                          to="/u/$handle"
                          params={{ handle: n.actorHandle }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold text-foreground hover:underline truncate !no-underline"
                        >
                          {n.actorDisplayName}
                        </Link>
                        {n.actorCriticNumber !== undefined && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-900 border border-amber-600/20 shrink-0">
                            #{n.actorCriticNumber}
                          </span>
                        )}
                        <span className="text-xs font-mono text-neutral-400 truncate">
                          @{n.actorHandle}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-snug">
                      {getNotificationDescription(n)}
                    </p>

                    {/* Preview quote / headline snippet */}
                    {n.previewText && (
                      <div className="mt-2.5 px-3.5 py-2 rounded-2xl bg-black/[0.03] border border-black/5 text-xs text-neutral-700 font-serif italic line-clamp-2">
                        &ldquo;{n.previewText}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Right Column: Unread Accent Dot */}
                  {isUnread && (
                    <div className="pt-2 shrink-0">
                      <span className="block size-2 rounded-full bg-amber-500 shadow-2xs" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Right Column: Stationary Discovery Rail */}
      <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none">
        <DashboardRightRail />
      </aside>

      {/* Slide-over Critique Discussion Drawer */}
      <CritiqueDiscussionDrawer
        isOpen={Boolean(activeDiscussionReview)}
        onClose={() => setActiveDiscussionReview(null)}
        review={activeDiscussionReview}
        currentProfile={profile}
      />

      {/* Visual Taste Card Export Modal */}
      <TasteCardExportModal
        isOpen={Boolean(activeTasteCardReview)}
        onClose={() => setActiveTasteCardReview(null)}
        review={activeTasteCardReview}
      />

      {/* Evaluate Living App & Feature Surface Modal */}
      <EvaluateAppModal
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setTargetAppId(undefined)
        }}
        apps={apps.filter((a) => (a.sourceType || 'product') === 'product')}
        profile={profile}
        initialAppId={targetAppId}
        onSubmit={async (args) => {
          await evaluateApp.mutateAsync(args)
        }}
      />

      {/* Specimen Ingestion & Appraisal Studio Modal */}
      <CreateSpecimenModal
        isOpen={showCreateSpecimenModal}
        onClose={() => setShowCreateSpecimenModal(false)}
        criticNumber={profile?.criticNumber ?? 1}
        onSubmit={async (args) => {
          return await createAndAppraise.mutateAsync(args)
        }}
      />
    </div>
  )
}

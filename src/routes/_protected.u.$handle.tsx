import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { ArrowLeft, UserX, ArrowRight } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import CriticProfileHeader from '../components/dashboard/CriticProfileHeader'
import CritiqueFeedSection, { type VerdictFilter } from '../components/dashboard/CritiqueFeedSection'
import DashboardRightRail from '../components/dashboard/DashboardRightRail'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import EditProfileModal from '../components/dashboard/EditProfileModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'
import CritiqueDiscussionDrawer from '../components/dashboard/CritiqueDiscussionDrawer'
import TasteCardExportModal from '../components/dashboard/TasteCardExportModal'
import FollowListModal from '../components/dashboard/FollowListModal'
import type { ReviewWithAppAndSocial } from '../components/dashboard/ScorecardReviewCard'

export const Route = createFileRoute('/_protected/u/$handle')({
  loader: async ({ context, params }) => {
    const cleanHandle = params.handle.trim().toLowerCase().replace(/^@/, '')
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.profiles.getByHandle, {
          handle: cleanHandle,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.reviews.listByUser, {
          handle: cleanHandle,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.apps.list, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.follows.isFollowing, {
          handle: cleanHandle,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.follows.getFollowStats, {
          handle: cleanHandle,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.follows.listFollowingByHandle, {
          handle: cleanHandle,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.follows.listFollowersByHandle, {
          handle: cleanHandle,
        }),
      ),
    ])

    return null
  },
  component: PublicCriticProfilePage,
})

function PublicCriticProfilePage() {
  const { convexQueryClient } = Route.useRouteContext()
  const { handle: routeHandle } = Route.useParams()
  const cleanHandle = routeHandle.trim().toLowerCase().replace(/^@/, '')
  const navigate = useNavigate()

  // Queries
  const { data: user } = useQuery(
    convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
  )
  const { data: myProfile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
  )
  const { data: criticProfile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getByHandle, {
      handle: cleanHandle,
    }),
  )
  const { data: reviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listByUser, {
      handle: cleanHandle,
    }),
  )
  const { data: apps = [] } = useQuery(
    convexQueryClient.queryOptions(api.apps.list, {}),
  )
  const { data: isFollowing = false } = useQuery(
    convexQueryClient.queryOptions(api.follows.isFollowing, {
      handle: cleanHandle,
    }),
  )
  const { data: followStats = { followersCount: 0, followingCount: 0 } } =
    useQuery(
      convexQueryClient.queryOptions(api.follows.getFollowStats, {
        handle: cleanHandle,
      }),
    )
  const { data: followingCritics = [] } = useQuery(
    convexQueryClient.queryOptions(api.follows.listFollowingByHandle, {
      handle: cleanHandle,
    }),
  )
  const { data: followersCritics = [] } = useQuery(
    convexQueryClient.queryOptions(api.follows.listFollowersByHandle, {
      handle: cleanHandle,
    }),
  )

  // Mutations
  const toggleFollowMutation = useConvexMutation(api.follows.toggleFollow)
  const saveProfileMutation = useConvexMutation(api.profiles.saveProfile)
  const evaluateAppMutation = useConvexMutation(api.apps.upsertAppAndEvaluate)
  const createAndAppraiseMutation = useConvexMutation(
    api.apps.createAndAppraiseSpecimen,
  )

  const toggleFollow = useMutation({ mutationFn: toggleFollowMutation })
  const saveProfile = useMutation({ mutationFn: saveProfileMutation })
  const evaluateApp = useMutation({ mutationFn: evaluateAppMutation })
  const createAndAppraise = useMutation({
    mutationFn: createAndAppraiseMutation,
  })

  // Modals state & Active Tab
  const [activeTab, setActiveTab] = useState<VerdictFilter>('all')
  const [pendingFollowHandles, setPendingFollowHandles] = useState<Record<string, boolean>>({})
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean
    tab: 'following' | 'followers'
  }>({
    isOpen: false,
    tab: 'following',
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [targetAppId, setTargetAppId] = useState<Id<'apps'> | undefined>(
    undefined,
  )
  const [showCreateSpecimenModal, setShowCreateSpecimenModal] = useState(false)
  const [activeDiscussionReview, setActiveDiscussionReview] =
    useState<ReviewWithAppAndSocial | null>(null)
  const [activeTasteCardReview, setActiveTasteCardReview] =
    useState<ReviewWithAppAndSocial | null>(null)
  const [counterAppraisalReview, setCounterAppraisalReview] = useState<{
    id: Id<'reviews'>
    authorHandle: string
    craftScore: number
    utilityScore: number
    headline: string
  } | null>(null)

  // Determine if viewing own profile
  const isOwnProfile = useMemo(() => {
    if (!myProfile && !user) return false
    if (myProfile && myProfile.handle.toLowerCase() === cleanHandle) return true
    if (criticProfile && user && criticProfile.userId === String(user._id))
      return true
    return false
  }, [myProfile, user, criticProfile, cleanHandle])

  // Calculated Stats
  const { lgtmCount, rottenCount, avgCraftGiven } = useMemo(() => {
    const lgtm = reviews.filter((r) => r.verdict === 'lgtm').length
    const rotten = reviews.filter((r) => r.verdict === 'rotten').length
    const totalCraft = reviews.reduce((sum, r) => sum + r.craftScore, 0)
    const avgCraft = reviews.length > 0 ? Math.round(totalCraft / reviews.length) : null
    return { lgtmCount: lgtm, rottenCount: rotten, avgCraftGiven: avgCraft }
  }, [reviews])

  const handleToggleFollow = async () => {
    if (isOwnProfile) return
    try {
      await toggleFollow.mutateAsync({ handle: cleanHandle })
    } catch {
      // ignore
    }
  }

  const handleToggleFollowCritic = async (targetHandle: string) => {
    try {
      setPendingFollowHandles((prev) => ({ ...prev, [targetHandle]: true }))
      await toggleFollow.mutateAsync({ handle: targetHandle })
    } catch {
      // ignore
    } finally {
      setPendingFollowHandles((prev) => ({ ...prev, [targetHandle]: false }))
    }
  }

  const handleOpenDiscussion = (review: ReviewWithAppAndSocial) => {
    setActiveDiscussionReview(review)
  }

  const handleExportTasteCard = (review: ReviewWithAppAndSocial) => {
    setActiveTasteCardReview(review)
  }

  const handleCounterAppraise = (review: ReviewWithAppAndSocial) => {
    setCounterAppraisalReview({
      id: review._id,
      authorHandle: review.authorHandle,
      craftScore: review.craftScore,
      utilityScore: review.utilityScore,
      headline: review.headline,
    })
    setTargetAppId(review.appId)
    setShowEvaluateModal(true)
  }

  const handleSaveProfile = async (args: Parameters<typeof saveProfileMutation>[0]) => {
    await saveProfile.mutateAsync(args)
  }

  const handleEvaluateApp = async (args: Parameters<typeof evaluateAppMutation>[0]) => {
    await evaluateApp.mutateAsync(args)
  }

  const handleCreateAndAppraiseSpecimen = async (
    args: Parameters<typeof createAndAppraiseMutation>[0],
  ) => {
    return await createAndAppraise.mutateAsync(args)
  }

  // Not Found State
  if (criticProfile === null) {
    return (
      <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
        <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none flex flex-col">
          <div className="p-4 border-b border-black/10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/feed' })}
              className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-600 hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h2 className="text-base font-bold text-foreground">Critic Persona</h2>
          </div>

          <div className="px-6 py-24 text-center flex flex-col items-center justify-center select-none">
            <div className="size-16 rounded-full bg-neutral-100 border border-black/10 flex items-center justify-center text-neutral-400 mb-4 shadow-2xs">
              <UserX className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              Critic Not Found
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-6">
              The handle <strong className="text-foreground">@{cleanHandle}</strong> has not been claimed yet or does not exist in the Genesis Consortium.
            </p>
            <Link
              to="/feed"
              className="px-6 py-2.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 inline-flex items-center gap-2 shadow-xs !no-underline"
            >
              <span>Return to Feed</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </main>

        <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none">
          <DashboardRightRail />
        </aside>
      </div>
    )
  }

  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: Sticky Header, Profile Header & Stream */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-20 px-4 py-2.5 border-b border-black/10 bg-canvas/90 backdrop-blur-xs flex items-center gap-3 select-none">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-600 hover:text-foreground transition cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-black text-foreground truncate leading-tight">
              {criticProfile?.displayName ?? `@${cleanHandle}`}
            </h2>
            <p className="text-[11px] font-mono text-neutral-400">
              {reviews.length} {reviews.length === 1 ? 'Evaluation' : 'Evaluations'}
            </p>
          </div>
        </div>

        {/* Profile Editorial Header */}
        <CriticProfileHeader
          profile={criticProfile}
          user={isOwnProfile ? user : null}
          reviewsCount={reviews.length}
          lgtmCount={lgtmCount}
          rottenCount={rottenCount}
          avgCraftGiven={avgCraftGiven}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followersCount={followStats.followersCount}
          followingCount={followStats.followingCount}
          isFollowPending={toggleFollow.isPending}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab as VerdictFilter)}
          onOpenFollowList={(tab) => setFollowModal({ isOpen: true, tab })}
          onToggleFollow={handleToggleFollow}
          onOpenCritiqueModal={() => {
            setTargetAppId(undefined)
            setCounterAppraisalReview(null)
            setShowEvaluateModal(true)
          }}
          onOpenEditProfileModal={() => setShowEditModal(true)}
          onOpenCreateSpecimenModal={() => setShowCreateSpecimenModal(true)}
        />

        {/* Critic's Reviews Feed */}
        <div className="w-full">
          <CritiqueFeedSection
            reviews={reviews}
            showTabs={true}
            mode="profile"
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenCritiqueModal={() => {
              setTargetAppId(undefined)
              setCounterAppraisalReview(null)
              setShowEvaluateModal(true)
            }}
            onOpenDiscussion={handleOpenDiscussion}
            onExportTasteCard={handleExportTasteCard}
            onCounterAppraise={handleCounterAppraise}
          />
        </div>
      </main>

      {/* Right Column: Stationary Discovery Rail */}
      <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none">
        <DashboardRightRail />
      </aside>

      {/* Edit Profile Persona Modal (only available on own profile) */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={myProfile}
          onSave={handleSaveProfile}
        />
      )}

      {/* Evaluate App / Specimen Modal */}
      <EvaluateAppModal
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setTargetAppId(undefined)
          setCounterAppraisalReview(null)
        }}
        apps={apps.filter((a) => (a.sourceType || 'product') === 'product')}
        profile={myProfile}
        initialAppId={targetAppId}
        counterAppraisalReview={counterAppraisalReview}
        onSubmit={handleEvaluateApp}
      />

      {/* Create Digital Craft Specimen Modal */}
      <CreateSpecimenModal
        isOpen={showCreateSpecimenModal}
        onClose={() => setShowCreateSpecimenModal(false)}
        criticNumber={myProfile?.criticNumber ?? 1}
        onSubmit={handleCreateAndAppraiseSpecimen}
      />

      {/* Critique Discussion Drawer */}
      <CritiqueDiscussionDrawer
        isOpen={Boolean(activeDiscussionReview)}
        onClose={() => setActiveDiscussionReview(null)}
        review={activeDiscussionReview}
        currentProfile={myProfile}
      />

      {/* Taste Card Export Modal */}
      <TasteCardExportModal
        isOpen={Boolean(activeTasteCardReview)}
        onClose={() => setActiveTasteCardReview(null)}
        review={activeTasteCardReview}
      />

      {/* Followers & Following Modal */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
        initialTab={followModal.tab}
        profileHandle={cleanHandle}
        profileDisplayName={criticProfile?.displayName}
        followingCritics={followingCritics as any}
        followersCritics={followersCritics as any}
        followingCount={followStats.followingCount}
        followersCount={followStats.followersCount}
        onToggleFollowCritic={handleToggleFollowCritic}
        pendingFollowHandles={pendingFollowHandles}
        viewerHandle={myProfile?.handle}
      />
    </div>
  )
}

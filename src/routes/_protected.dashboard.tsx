import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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

export const Route = createFileRoute('/_protected/dashboard')({
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
        context.convexQueryClient.queryOptions(api.reviews.listByUser, {}),
      ),
    ])

    return null
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { convexQueryClient } = Route.useRouteContext()

  // Queries
  const { data: user } = useQuery(
    convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
  )
  const { data: profile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
  )
  const { data: apps = [] } = useQuery(
    convexQueryClient.queryOptions(api.apps.list, {}),
  )
  const { data: myReviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listByUser, {}),
  )

  const myHandle = profile?.handle || ''
  const { data: followStats = { followersCount: 0, followingCount: 0 } } =
    useQuery(
      convexQueryClient.queryOptions(api.follows.getFollowStats, {
        handle: myHandle,
      }),
    )
  const { data: followingCritics = [] } = useQuery(
    convexQueryClient.queryOptions(api.follows.listFollowingByHandle, {
      handle: myHandle,
    }),
  )
  const { data: followersCritics = [] } = useQuery(
    convexQueryClient.queryOptions(api.follows.listFollowersByHandle, {
      handle: myHandle,
    }),
  )

  // Mutations
  const saveProfileMutation = useConvexMutation(api.profiles.saveProfile)
  const evaluateAppMutation = useConvexMutation(api.apps.upsertAppAndEvaluate)
  const createAndAppraiseMutation = useConvexMutation(api.apps.createAndAppraiseSpecimen)
  const toggleFollowMutation = useConvexMutation(api.follows.toggleFollow)
  const seedPlatformDataMutation = useConvexMutation(api.seed.seedPlatformData)

  const saveProfile = useMutation({ mutationFn: saveProfileMutation })
  const evaluateApp = useMutation({ mutationFn: evaluateAppMutation })
  const createAndAppraise = useMutation({ mutationFn: createAndAppraiseMutation })
  const toggleFollow = useMutation({ mutationFn: toggleFollowMutation })
  const seedPlatform = useMutation({ mutationFn: seedPlatformDataMutation })

  // Auto-seed and cleanup legacy reviews if needed
  useEffect(() => {
    const hasLegacyReviews = myReviews.some(
      (r) => r.quote?.includes('Thursday Drop') || r.quote?.includes('Anonymous ballot'),
    )
    if (apps.length < 3 || hasLegacyReviews) {
      seedPlatform.mutate({ forceResetLegacyReviews: false })
    }
  }, [apps.length, myReviews])

  // Modals state & Tab selection
  const [activeTab, setActiveTab] = useState<VerdictFilter>('all')
  const [pendingFollowHandles, setPendingFollowHandles] = useState<Record<string, boolean>>({})
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean
    tab: 'following' | 'followers'
  }>({
    isOpen: false,
    tab: 'following',
  })
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [targetAppId, setTargetAppId] = useState<Id<'apps'> | undefined>(undefined)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showCreateSpecimenModal, setShowCreateSpecimenModal] = useState(false)
  const [activeDiscussionReview, setActiveDiscussionReview] = useState<ReviewWithAppAndSocial | null>(null)
  const [activeTasteCardReview, setActiveTasteCardReview] = useState<ReviewWithAppAndSocial | null>(null)
  const [counterAppraisalReview, setCounterAppraisalReview] = useState<{
    id: Id<'reviews'>
    authorHandle: string
    craftScore: number
    utilityScore: number
    headline: string
  } | null>(null)

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

  // Automatically prompt profile claiming if first time
  useEffect(() => {
    if (profile === null && user) {
      setShowEditProfileModal(true)
    }
  }, [profile, user])

  // Listen for navigation triggers from the layout rail
  useEffect(() => {
    const handleOpenEval = (e: Event) => {
      const customEvent = e as CustomEvent<{ appId?: Id<'apps'> }>
      setTargetAppId(customEvent.detail?.appId)
      setShowEvaluateModal(true)
    }
    const handleOpenSpecimen = () => setShowCreateSpecimenModal(true)
    const handleOpenEdit = () => setShowEditProfileModal(true)

    window.addEventListener('screenlog:open-evaluate', handleOpenEval)
    window.addEventListener('screenlog:open-specimen', handleOpenSpecimen)
    window.addEventListener('screenlog:open-edit-profile', handleOpenEdit)

    return () => {
      window.removeEventListener('screenlog:open-evaluate', handleOpenEval)
      window.removeEventListener('screenlog:open-specimen', handleOpenSpecimen)
      window.removeEventListener('screenlog:open-edit-profile', handleOpenEdit)
    }
  }, [])

  // Computed Review Stats
  const lgtmCount = myReviews.filter((r) => r.verdict === 'lgtm').length
  const rottenCount = myReviews.filter((r) => r.verdict === 'rotten').length
  const avgCraftGiven =
    myReviews.length > 0
      ? Math.round(
          myReviews.reduce((sum, r) => sum + r.craftScore, 0) / myReviews.length,
        )
      : null

  // Handlers
  const handleSaveProfile = async (
    args: Parameters<typeof saveProfileMutation>[0],
  ) => {
    await saveProfile.mutateAsync(args)
  }

  const handleEvaluateApp = async (
    args: Parameters<typeof evaluateAppMutation>[0],
  ) => {
    await evaluateApp.mutateAsync(args)
  }

  const handleCreateAndAppraiseSpecimen = async (
    args: Parameters<typeof createAndAppraiseMutation>[0],
  ) => {
    return await createAndAppraise.mutateAsync(args)
  }

  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: Profile Identity, Underline Tabs & Single-Column Vertical Feed */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        <CriticProfileHeader
          profile={profile}
          user={user}
          reviewsCount={myReviews.length}
          lgtmCount={lgtmCount}
          rottenCount={rottenCount}
          avgCraftGiven={avgCraftGiven}
          followersCount={followStats.followersCount}
          followingCount={followStats.followingCount}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab as VerdictFilter)}
          onOpenFollowList={(tab) => setFollowModal({ isOpen: true, tab })}
          onOpenCritiqueModal={() => {
            setTargetAppId(undefined)
            setShowEvaluateModal(true)
          }}
          onOpenCreateSpecimenModal={() => setShowCreateSpecimenModal(true)}
          onOpenEditProfileModal={() => setShowEditProfileModal(true)}
        />

        <CritiqueFeedSection
          reviews={myReviews}
          mode="profile"
          isOwnProfile={true}
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
      </main>

      {/* Right Column: Stationary Discovery Rail (Search, Trending Under Review, Top Critics to Follow) */}
      <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none">
        <DashboardRightRail />
      </aside>

      {/* Evaluate Living App & Feature Surface Modal */}
      <EvaluateAppModal
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setTargetAppId(undefined)
          setCounterAppraisalReview(null)
        }}
        apps={apps.filter((a) => (a.sourceType || 'product') === 'product')}
        profile={profile}
        initialAppId={targetAppId}
        counterAppraisalReview={counterAppraisalReview}
        onSubmit={handleEvaluateApp}
      />

      {/* Specimen Ingestion & Appraisal Studio Modal */}
      <CreateSpecimenModal
        isOpen={showCreateSpecimenModal}
        onClose={() => setShowCreateSpecimenModal(false)}
        criticNumber={profile?.criticNumber ?? 1}
        onSubmit={handleCreateAndAppraiseSpecimen}
      />

      {/* Edit Persona Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        profile={profile}
        userEmail={user?.email}
        defaultName={user?.name?.split(' ')[0]}
        onSave={handleSaveProfile}
      />

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

      {/* Followers & Following Modal */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
        initialTab={followModal.tab}
        profileHandle={myHandle}
        profileDisplayName={profile?.displayName}
        followingCritics={followingCritics as any}
        followersCritics={followersCritics as any}
        followingCount={followStats.followingCount}
        followersCount={followStats.followersCount}
        onToggleFollowCritic={handleToggleFollowCritic}
        pendingFollowHandles={pendingFollowHandles}
        viewerHandle={profile?.handle}
      />
    </div>
  )
}

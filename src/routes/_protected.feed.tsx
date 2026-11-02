import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useRef } from 'react'
import { SlidersHorizontal, Check, X } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import FeedComposer from '../components/dashboard/FeedComposer'
import CritiqueFeedSection from '../components/dashboard/CritiqueFeedSection'
import DashboardRightRail from '../components/dashboard/DashboardRightRail'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'
import CritiqueDiscussionDrawer from '../components/dashboard/CritiqueDiscussionDrawer'
import TasteCardExportModal from '../components/dashboard/TasteCardExportModal'
import type { ReviewWithAppAndSocial } from '../components/dashboard/ScorecardReviewCard'

export const Route = createFileRoute('/_protected/feed')({
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
        context.convexQueryClient.queryOptions(api.reviews.listCommunityFeed, {}),
      ),
    ])

    return null
  },
  component: CommunityFeedPage,
})

type MainTab = 'for_you' | 'following'
type VerdictFilter =
  | 'all'
  | 'lgtm'
  | 'mixed'
  | 'rotten'
  | 'dilemma'
  | 'counter_appraisals'

const FILTER_OPTIONS: { id: VerdictFilter; label: string }[] = [
  { id: 'all', label: 'All Consensus' },
  { id: 'lgtm', label: 'Certified LGTM (≥90% Craft)' },
  { id: 'dilemma', label: 'Dribbble Dilemma (Visual Eye Candy)' },
  { id: 'counter_appraisals', label: 'Quoted Takes' },
  { id: 'mixed', label: 'Needs Polish' },
  { id: 'rotten', label: 'Rotten' },
]

function CommunityFeedPage() {
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
  const { data: communityReviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listCommunityFeed, {}),
  )

  // Tab & Filter state
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('for_you')
  const [activeVerdictFilter, setActiveVerdictFilter] =
    useState<VerdictFilter>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      ) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let result = communityReviews

    // Following tab: prioritize reviews by other critics
    if (activeMainTab === 'following' && user) {
      const currentUserId = String(user._id)
      const others = result.filter((r) => r.userId !== currentUserId)
      result = others.length > 0 ? others : result
    }

    // Verdict Filter
    if (activeVerdictFilter === 'lgtm') {
      result = result.filter((r) => r.verdict === 'lgtm')
    } else if (activeVerdictFilter === 'mixed') {
      result = result.filter((r) => r.verdict === 'mixed')
    } else if (activeVerdictFilter === 'rotten') {
      result = result.filter((r) => r.verdict === 'rotten')
    } else if (activeVerdictFilter === 'dilemma') {
      result = result.filter((r) => r.craftScore >= 70 && r.utilityScore < 70)
    } else if (activeVerdictFilter === 'counter_appraisals') {
      result = result.filter((r) => Boolean(r.parentReviewId))
    }

    return result
  }, [communityReviews, activeMainTab, activeVerdictFilter, user])

  // Mutations
  const evaluateAppMutation = useConvexMutation(api.apps.upsertAppAndEvaluate)
  const createAndAppraiseMutation = useConvexMutation(
    api.apps.createAndAppraiseSpecimen,
  )

  const evaluateApp = useMutation({ mutationFn: evaluateAppMutation })
  const createAndAppraise = useMutation({
    mutationFn: createAndAppraiseMutation,
  })

  // Modals state
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [targetAppId, setTargetAppId] = useState<Id<'apps'> | undefined>(
    undefined,
  )
  const [initialDraftHeadline, setInitialDraftHeadline] = useState<string>('')
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

  // Global event listeners for SiteHeader and AppSidebar quick buttons
  useEffect(() => {
    const handleOpenEval = () => {
      setTargetAppId(undefined)
      setCounterAppraisalReview(null)
      setInitialDraftHeadline('')
      setShowEvaluateModal(true)
    }
    const handleOpenSpec = () => {
      setShowCreateSpecimenModal(true)
    }

    window.addEventListener('screenlog:open-evaluate', handleOpenEval)
    window.addEventListener('screenlog:open-specimen', handleOpenSpec)

    return () => {
      window.removeEventListener('screenlog:open-evaluate', handleOpenEval)
      window.removeEventListener('screenlog:open-specimen', handleOpenSpec)
    }
  }, [])

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

  const activeFilterLabel =
    FILTER_OPTIONS.find((f) => f.id === activeVerdictFilter)?.label || ''

  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: X-Style Top Tabs, Composer & Clean Vertical Feed */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Top Sticky X-Style Tabs: For you | Following */}
        <div className="flex items-center justify-between border-b border-black/10 bg-canvas/90 backdrop-blur-xs sticky top-0 z-20 select-none">
          <div className="flex flex-1">
            <button
              type="button"
              onClick={() => setActiveMainTab('for_you')}
              className={`flex-1 py-3.5 text-center text-sm font-bold transition hover:bg-black/5 relative cursor-pointer flex items-center justify-center ${
                activeMainTab === 'for_you'
                  ? 'text-foreground font-black'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>For you</span>
              {activeMainTab === 'for_you' && (
                <span className="absolute bottom-0 inset-x-12 sm:inset-x-20 h-1 bg-foreground rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('following')}
              className={`flex-1 py-3.5 text-center text-sm font-bold transition hover:bg-black/5 relative cursor-pointer flex items-center justify-center ${
                activeMainTab === 'following'
                  ? 'text-foreground font-black'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>Following</span>
              {activeMainTab === 'following' && (
                <span className="absolute bottom-0 inset-x-12 sm:inset-x-20 h-1 bg-foreground rounded-full" />
              )}
            </button>
          </div>

          {/* Clean Filter Dropdown Button on the Right */}
          <div className="px-3 shrink-0 relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Filter consensus feed"
              className={`size-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                activeVerdictFilter !== 'all'
                  ? 'bg-amber-500/15 text-amber-900 font-bold'
                  : 'hover:bg-black/5 text-neutral-500 hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="size-4" />
            </button>

            {/* Dropdown Menu (No pills!) */}
            {showFilterMenu && (
              <div className="absolute right-0 top-10 w-60 rounded-2xl bg-white border border-black/10 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold border-b border-black/5">
                  Consensus Filter
                </div>
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setActiveVerdictFilter(opt.id)
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-black/5 transition cursor-pointer ${
                      activeVerdictFilter === opt.id
                        ? 'text-foreground font-bold'
                        : 'text-neutral-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {activeVerdictFilter === opt.id && (
                      <Check className="size-3.5 text-amber-700 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Action Prompt Bar (Clickable launcher to Evaluate modal) */}
        <FeedComposer
          avatarUrl={profile?.avatarUrl ?? user?.image ?? undefined}
          criticHandle={profile?.handle || user?.name?.split(' ')[0] || 'critic'}
          onOpenEvaluate={() => {
            setTargetAppId(undefined)
            setCounterAppraisalReview(null)
            setInitialDraftHeadline('')
            setShowEvaluateModal(true)
          }}
          onOpenSpecimen={() => setShowCreateSpecimenModal(true)}
        />

        {/* Active Filter Notice (if any filter is selected) */}
        {activeVerdictFilter !== 'all' && (
          <div className="px-4 py-2 border-b border-black/10 bg-black/[0.02] flex items-center justify-between text-xs text-neutral-600">
            <span className="font-medium">
              Filtered: <strong className="text-foreground">{activeFilterLabel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveVerdictFilter('all')}
              className="text-[11px] font-mono text-neutral-400 hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              <X className="size-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* The Stream */}
        <CritiqueFeedSection
          reviews={filteredReviews}
          showTabs={false}
          mode="community"
          onOpenCritiqueModal={() => {
            setTargetAppId(undefined)
            setCounterAppraisalReview(null)
            setInitialDraftHeadline('')
            setShowEvaluateModal(true)
          }}
          onOpenDiscussion={handleOpenDiscussion}
          onExportTasteCard={handleExportTasteCard}
          onCounterAppraise={handleCounterAppraise}
        />
      </main>

      {/* Right Column: Stationary Discovery Rail */}
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
          setInitialDraftHeadline('')
        }}
        apps={apps.filter((a) => (a.sourceType || 'product') === 'product')}
        profile={profile}
        initialAppId={targetAppId}
        initialHeadline={initialDraftHeadline}
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
    </div>
  )
}

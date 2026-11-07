import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Bookmark, Plus, ArrowRight } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import CritiqueFeedSection from '../components/dashboard/CritiqueFeedSection'
import DashboardRightRail from '../components/dashboard/DashboardRightRail'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'
import CritiqueDiscussionDrawer from '../components/dashboard/CritiqueDiscussionDrawer'
import TasteCardExportModal from '../components/dashboard/TasteCardExportModal'
import type { ReviewWithAppAndSocial } from '../components/dashboard/ScorecardReviewCard'

export const Route = createFileRoute('/_protected/bookmarks')({
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
        context.convexQueryClient.queryOptions(api.reviews.listBookmarked, {}),
      ),
    ])

    return null
  },
  component: BookmarksPage,
})

function BookmarksPage() {
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
  const { data: bookmarkedReviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listBookmarked, {}),
  )

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

  const criticHandle = profile?.handle || user?.name?.split(' ')[0] || 'critic'

  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: Sticky Header & Bookmarked Reviews Stream */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b border-black/10 bg-canvas/90 backdrop-blur-xs flex items-center justify-between select-none">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                Bookmarks
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-[11px] font-mono font-bold">
                {bookmarkedReviews.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              @{criticHandle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetAppId(undefined)
                setCounterAppraisalReview(null)
                setShowEvaluateModal(true)
              }}
              className="px-3.5 py-1.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Evaluate</span>
            </button>
          </div>
        </div>

        {/* Empty State or Bookmarks Feed */}
        {bookmarkedReviews.length === 0 ? (
          <div className="px-6 py-20 text-center flex flex-col items-center justify-center select-none">
            <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 mb-4 shadow-2xs">
              <Bookmark className="size-8 stroke-[1.75]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              Save critiques for later
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-6">
              Don’t let the good craft get away! Bookmark reviews and specimen audits on the timeline to easily find and reference them again here.
            </p>
            <Link
              to="/feed"
              className="px-6 py-2.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 inline-flex items-center gap-2 shadow-xs !no-underline"
            >
              <span className="text-white">Explore Home Feed</span>
              <ArrowRight className="size-3.5 text-white" />
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <CritiqueFeedSection
              reviews={bookmarkedReviews}
              showTabs={false}
              mode="profile"
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
        )}
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

      {/* Critique Discussion Drawer */}
      <CritiqueDiscussionDrawer
        isOpen={Boolean(activeDiscussionReview)}
        onClose={() => setActiveDiscussionReview(null)}
        review={activeDiscussionReview}
        currentProfile={profile}
      />

      {/* Taste Card Export Modal */}
      <TasteCardExportModal
        isOpen={Boolean(activeTasteCardReview)}
        onClose={() => setActiveTasteCardReview(null)}
        review={activeTasteCardReview}
      />
    </div>
  )
}

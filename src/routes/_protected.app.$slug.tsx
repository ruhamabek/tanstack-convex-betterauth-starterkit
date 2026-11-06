import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Sparkles,
  Layers,
  ArrowRight,
  Award,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import CritiqueFeedSection from '../components/dashboard/CritiqueFeedSection'
import DashboardRightRail from '../components/dashboard/DashboardRightRail'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'
import CritiqueDiscussionDrawer from '../components/dashboard/CritiqueDiscussionDrawer'
import TasteCardExportModal from '../components/dashboard/TasteCardExportModal'
import type { ReviewWithAppAndSocial } from '../components/dashboard/ScorecardReviewCard'

export const Route = createFileRoute('/_protected/app/$slug')({
  loader: async ({ context, params }) => {
    const cleanSlug = params.slug.trim().toLowerCase()
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
        context.convexQueryClient.queryOptions(api.apps.getAppConsensus, {
          slug: cleanSlug,
        }),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.reviews.listByApp, {
          slug: cleanSlug,
        }),
      ),
    ])

    return null
  },
  component: AppConsensusHubPage,
})

function AppConsensusHubPage() {
  const { convexQueryClient } = Route.useRouteContext()
  const { slug } = Route.useParams()
  const cleanSlug = slug.trim().toLowerCase()
  const navigate = useNavigate()

  // Queries
  const { data: profile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
  )
  const { data: allApps = [] } = useQuery(
    convexQueryClient.queryOptions(api.apps.list, {}),
  )
  const { data: consensusData } = useQuery(
    convexQueryClient.queryOptions(api.apps.getAppConsensus, {
      slug: cleanSlug,
    }),
  )

  // Surface filter
  const [selectedSurface, setSelectedSurface] = useState<string>('all')

  const { data: reviews = [] } = useQuery(
    convexQueryClient.queryOptions(api.reviews.listByApp, {
      slug: cleanSlug,
      surface: selectedSurface === 'all' ? undefined : selectedSurface,
    }),
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
    setShowEvaluateModal(true)
  }

  // Loading state
  if (consensusData === undefined) {
    return (
      <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
        <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas p-12 flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-neutral-300 border-t-foreground animate-spin" />
        </main>
        <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none">
          <DashboardRightRail />
        </aside>
      </div>
    )
  }

  // 404 App Not Found State
  if (consensusData === null) {
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
            <h2 className="text-base font-bold text-foreground">Consensus Hub</h2>
          </div>

          <div className="px-6 py-24 text-center flex flex-col items-center justify-center select-none">
            <div className="size-16 rounded-full bg-neutral-100 border border-black/10 flex items-center justify-center text-neutral-400 mb-4 shadow-2xs">
              <Layers className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              Software Hub Not Found
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-6">
              No registered software product or design specimen found matching <strong className="text-foreground">/{cleanSlug}</strong>.
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

  const app = consensusData.app
  const surfaces = consensusData.surfaces

 
  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden">
      {/* Center Column: Sticky Header, Hero Consensus Scorecard, Surface Tabs & Stream */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-20 px-4 py-2.5 border-b border-black/10 bg-canvas/90 backdrop-blur-xs flex items-center justify-between select-none">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-600 hover:text-foreground transition cursor-pointer shrink-0"
              title="Go back"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-foreground truncate leading-tight">
                {app?.name}
              </h2>
              <p className="text-[11px] font-mono text-neutral-400 truncate">
                {app?.category} · {consensusData.reviewsCount} {consensusData.reviewsCount === 1 ? 'audit' : 'audits'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCounterAppraisalReview(null)
              setShowEvaluateModal(true)
            }}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Evaluate</span>
          </button>
        </div>

        {/* Hero Consensus Scorecard Header */}
        <section className="p-5 sm:p-6 border-b border-black/10 bg-white select-none space-y-5">
           <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* App Icon */}
              <div className="size-16 sm:size-20 rounded-2xl border border-black/10 bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {app?.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="size-full object-cover"
                    onError={(e) => {
                      // Fallback letter avatar
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-2xl font-black text-neutral-400">
                    {app?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {app?.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-black/[0.04] text-neutral-700 border border-black/5">
                    {app?.category}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-snug">
                  {app?.tagline}
                </p>

                {/* Source or Website link */}
                <div className="mt-2 flex items-center gap-3">
                  {app?.websiteUrl && (
                    <a
                      href={app.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-foreground hover:underline transition"
                    >
                      <span>Official Surface</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  {app?.sourceUrl && (
                    <a
                      href={app.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline transition"
                    >
                      <span>Original Specimen</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

           
          </div>

          {/* Dual Consensus Meters (Craft Score vs Utility Score) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Craft Score Meter Card */}
            <div className="rounded-2xl bg-black/[0.02] border border-black/10 p-4 relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-400">
                  Craft Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {app?.craftScore}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${app?.craftScore ?? 0}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-500 mt-2 font-medium leading-tight">
                Micro-interactions, layout shift, typography, tactile fidelity.
              </p>
            </div>

            {/* Utility Score Meter Card */}
            <div className="rounded-2xl bg-black/[0.02] border border-black/10 p-4 relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-400">
                  Utility Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {app?.utilityScore}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${app?.utilityScore ?? 0}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-500 mt-2 font-medium leading-tight">
                Daily speed, keyboard shortcuts, latency, real-world usefulness.
              </p>
            </div>
          </div>

          {/* Consensus Strip Summary */}
          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Award className="size-4 text-amber-600" />
              <span>
                Based on <strong className="text-foreground">{consensusData.reviewsCount}</strong> peer-reviewed evaluations
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setCounterAppraisalReview(null)
                setShowEvaluateModal(true)
              }}
              className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Submit Evaluation</span>
              <ArrowRight className="size-3" />
            </button>
          </div>
        </section>

        {/* Feature Surface Breakdown Filter Strip */}
        {surfaces.length > 0 && (
          <div className="px-4 py-3 border-b border-black/10 bg-canvas/80 backdrop-blur-xs flex items-center gap-2 overflow-x-auto scrollbar-none select-none">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-400 shrink-0 mr-1">
              Surfaces:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSurface('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedSurface === 'all'
                  ? 'bg-foreground text-background shadow-2xs'
                  : 'bg-white hover:bg-black/5 text-neutral-600 border border-black/10'
              }`}
            >
              All Surfaces ({consensusData.reviewsCount})
            </button>

            {surfaces.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelectedSurface(s.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedSurface === s.name
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'bg-white hover:bg-black/5 text-neutral-600 border border-black/10'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] font-mono opacity-70">
                  {s.avgCraft}%
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Reviews Stream */}
        {reviews.length === 0 ? (
          <div className="px-6 py-20 text-center flex flex-col items-center justify-center select-none animate-in fade-in duration-200">
            <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 mb-4 shadow-2xs">
              <Sparkles className="size-8 stroke-[1.75]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              Be the first to evaluate {app?.name}
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-6">
              No verified consensus reviews have been published for this surface yet. Audit the interface and establish the craft consensus.
            </p>
            <button
              type="button"
              onClick={() => {
                setCounterAppraisalReview(null)
                setShowEvaluateModal(true)
              }}
              className="px-6 py-2.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span>Submit Evaluation</span>
            </button>
          </div>
        ) : (
          <div className="w-full">
            <CritiqueFeedSection
              reviews={reviews}
              showTabs={false}
              mode="community"
              onOpenCritiqueModal={() => {
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

      {/* Evaluate Modal pre-populated with this app */}
      <EvaluateAppModal
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setCounterAppraisalReview(null)
        }}
        apps={allApps.filter((a) => (a.sourceType || 'product') === 'product')}
        profile={profile}
        initialAppId={app?._id}
        counterAppraisalReview={counterAppraisalReview}
        onSubmit={async (args) => {
          await evaluateApp.mutateAsync(args)
        }}
      />

      {/* Create Specimen Modal */}
      <CreateSpecimenModal
        isOpen={showCreateSpecimenModal}
        onClose={() => setShowCreateSpecimenModal(false)}
        criticNumber={profile?.criticNumber ?? 1}
        onSubmit={async (args) => {
          return await createAndAppraise.mutateAsync(args)
        }}
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

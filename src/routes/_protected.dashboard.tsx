import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import FavoriteAppsShelf from '../components/dashboard/FavoriteAppsShelf'
import CriticProfileHeader from '../components/dashboard/CriticProfileHeader'
import CritiqueFeedSection from '../components/dashboard/CritiqueFeedSection'
import EvaluateAppModal from '../components/dashboard/EvaluateAppModal'
import EditProfileModal from '../components/dashboard/EditProfileModal'
import CreateSpecimenModal from '../components/dashboard/CreateSpecimenModal'

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

  // Mutations
  const saveProfileMutation = useConvexMutation(api.profiles.saveProfile)
  const evaluateAppMutation = useConvexMutation(api.apps.upsertAppAndEvaluate)
  const createAndAppraiseMutation = useConvexMutation(api.apps.createAndAppraiseSpecimen)

  const saveProfile = useMutation({ mutationFn: saveProfileMutation })
  const evaluateApp = useMutation({ mutationFn: evaluateAppMutation })
  const createAndAppraise = useMutation({ mutationFn: createAndAppraiseMutation })

  // Modals state
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [targetAppId, setTargetAppId] = useState<Id<'apps'> | undefined>(undefined)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showCreateSpecimenModal, setShowCreateSpecimenModal] = useState(false)

  // Automatically prompt profile claiming if first time
  useEffect(() => {
    if (profile === null && user) {
      setShowEditProfileModal(true)
    }
  }, [profile, user])

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
  const handleSaveProfile = async (args: {
    handle: string
    displayName: string
    role: string
    bio?: string
    avatarUrl?: string
  }) => {
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
    <main className="min-h-screen bg-desk text-foreground pb-24 pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 selection:bg-amber-100">
      <div className="max-w-5xl mx-auto space-y-9">
        {/* Critic Profile Identity & Stats Header */}
        <CriticProfileHeader
          profile={profile}
          user={user}
          reviewsCount={myReviews.length}
          lgtmCount={lgtmCount}
          rottenCount={rottenCount}
          avgCraftGiven={avgCraftGiven}
          onOpenCritiqueModal={() => {
            setTargetAppId(undefined)
            setShowEvaluateModal(true)
          }}
          onOpenCreateSpecimenModal={() => setShowCreateSpecimenModal(true)}
          onOpenEditProfileModal={() => setShowEditProfileModal(true)}
        />

        {/* Favorite 4 Software Shelf */}
        <FavoriteAppsShelf
          apps={apps.filter((a) => (a.sourceType || 'product') === 'product')}
          onSelectApp={(appId) => {
            setTargetAppId(appId)
            setShowEvaluateModal(true)
          }}
        />

        {/* Living Scorecards & Critique Log Feed */}
        <CritiqueFeedSection
          reviews={myReviews}
          onOpenCritiqueModal={() => {
            setTargetAppId(undefined)
            setShowEvaluateModal(true)
          }}
        />
      </div>

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
    </main>
  )
}

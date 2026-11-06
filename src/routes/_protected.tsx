import { useState, useEffect } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { AppSidebar } from '../components/app-sidebar'
import { SiteHeader } from '../components/site-header'
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar'
import CriticShowreelModal from '../components/dashboard/CriticShowreelModal'

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
      ),
    ])
    return null
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { convexQueryClient } = Route.useRouteContext()

  const { data: user } = useQuery(
    convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
  )
  const { data: profile } = useQuery(
    convexQueryClient.queryOptions(api.profiles.getMyProfile, {}),
  )

  const [isStoryOpen, setIsStoryOpen] = useState(false)
  useEffect(() => {
    const handleOpenStory = () => setIsStoryOpen(true)
    window.addEventListener('screenlog:open-showreel', handleOpenStory)
    window.addEventListener('screenlog:open-drop-story', handleOpenStory)
    return () => {
      window.removeEventListener('screenlog:open-showreel', handleOpenStory)
      window.removeEventListener('screenlog:open-drop-story', handleOpenStory)
    }
  }, [])

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '17rem',
          '--sidebar-width-icon': '4.25rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={user}
        profile={profile}
        variant="inset"
        collapsible="icon"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>

      {/* Global Critic Showreel Story Player */}
      {isStoryOpen && (
        <CriticShowreelModal
          isOpen={isStoryOpen}
          onClose={() => setIsStoryOpen(false)}
          profile={profile ?? null}
        />
      )}
    </SidebarProvider>
  )
}

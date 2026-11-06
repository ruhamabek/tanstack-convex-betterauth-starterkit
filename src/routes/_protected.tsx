import { useState, useEffect } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { AppSidebar } from '../components/app-sidebar'
import { SiteHeader } from '../components/site-header'
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar'
import CriticShowreelModal from '../components/dashboard/CriticShowreelModal'
import GlobalSearchModal from '../components/search/GlobalSearchModal'

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

  const ensureMyProfileMutation = useConvexMutation(api.profiles.ensureMyProfile)

  useEffect(() => {
    if (user?._id) {
      ensureMyProfileMutation({}).catch(() => {})
    }
  }, [user?._id, ensureMyProfileMutation])

  const [isStoryOpen, setIsStoryOpen] = useState(false)
  const [storyTargetHandle, setStoryTargetHandle] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')

  useEffect(() => {
    const handleOpenStory = (e: Event) => {
      const customEvent = e as CustomEvent<{ handle?: string }>
      if (customEvent.detail?.handle) {
        setStoryTargetHandle(customEvent.detail.handle)
      } else {
        setStoryTargetHandle(null)
      }
      setIsStoryOpen(true)
    }
    const handleOpenSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>
      if (customEvent.detail?.query) {
        setSearchInitialQuery(customEvent.detail.query)
      } else {
        setSearchInitialQuery('')
      }
      setIsSearchOpen(true)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }

    window.addEventListener('screenlog:open-showreel', handleOpenStory)
    window.addEventListener('screenlog:open-drop-story', handleOpenStory)
    window.addEventListener('screenlog:open-search', handleOpenSearch)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('screenlog:open-showreel', handleOpenStory)
      window.removeEventListener('screenlog:open-drop-story', handleOpenStory)
      window.removeEventListener('screenlog:open-search', handleOpenSearch)
      window.removeEventListener('keydown', handleKeyDown)
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
          onClose={() => {
            setIsStoryOpen(false)
            setStoryTargetHandle(null)
          }}
          profile={
            storyTargetHandle
              ? { handle: storyTargetHandle, displayName: storyTargetHandle }
              : (profile ?? null)
          }
        />
      )}

      {/* High-Efficiency Global Search (⌘K / Ctrl+K & Search Bar) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false)
          setSearchInitialQuery('')
        }}
        initialQuery={searchInitialQuery}
      />
    </SidebarProvider>
  )
}

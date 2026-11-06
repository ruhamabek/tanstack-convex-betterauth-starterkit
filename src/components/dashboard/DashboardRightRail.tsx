import { useState } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useQuery as useConvexReactQuery } from 'convex/react'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import CriticAvatar from '../CriticAvatar'

interface DashboardRightRailProps {
  onSearchChange?: (query: string) => void
  onSelectTag?: (tag: string) => void
}

const TRENDING_APPS = [
  {
    name: 'Linear',
    slug: 'linear',
    category: 'Issue Tracking',
    craftScore: 96,
    utilityScore: 89,
    status: 'Certified LGTM',
    evaluationsCount: 142,
  },
  {
    name: 'Raycast',
    slug: 'raycast',
    category: 'Productivity & Launcher',
    craftScore: 98,
    utilityScore: 94,
    status: 'Certified LGTM',
    evaluationsCount: 98,
  },
  {
    name: 'Arc Browser (v2)',
    slug: 'arc-browser-v2',
    category: 'Web Browser',
    craftScore: 92,
    utilityScore: 48,
    status: 'Needs Polish',
    evaluationsCount: 86,
  },
  {
    name: 'Cash Card Haptics',
    slug: 'cash-card-haptics',
    category: 'Mobbin Flow',
    craftScore: 95,
    utilityScore: 92,
    status: 'Certified LGTM',
    evaluationsCount: 64,
  },
]

const DEFAULT_TOP_CRITICS = [
  {
    handle: 'subgrid_sorcerer',
    displayName: 'Marcus Vance',
    role: 'Staff Frontend Engineer',
    criticNumber: 14,
    avatarUrl: undefined,
  },
  {
    handle: 'pixel_snob',
    displayName: 'Elena Rostova',
    role: 'Principal Product Designer',
    criticNumber: 22,
    avatarUrl: undefined,
  },
  {
    handle: 'kerning_ghost',
    displayName: 'Alex Thorne',
    role: 'Verified Builder',
    criticNumber: 9,
    avatarUrl: undefined,
  },
]

export default function DashboardRightRail({
  onSearchChange,
  onSelectTag,
}: DashboardRightRailProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingHandles, setPendingHandles] = useState<Record<string, boolean>>({})

  // Real Convex queries & mutations
  const suggestedCriticsData = useConvexReactQuery(api.follows.listSuggestedCritics, { limit: 4 })
  const followingHandles = useConvexReactQuery(api.follows.getMyFollowingHandles, {}) || []
  const toggleFollowMutation = useConvexMutation(api.follows.toggleFollow)

  const critics =
    suggestedCriticsData && suggestedCriticsData.length > 0
      ? suggestedCriticsData
      : DEFAULT_TOP_CRITICS

  const followingSet = new Set(followingHandles.map((h) => h.toLowerCase().replace(/^@/, '')))

  const handleToggleFollow = async (handle: string) => {
    setPendingHandles((prev) => ({ ...prev, [handle]: true }))
    try {
      await toggleFollowMutation({ handle })
    } catch {
      // ignore
    } finally {
      setPendingHandles((prev) => ({ ...prev, [handle]: false }))
    }
  }

  return (
    <div className="w-full space-y-5 select-none">
      {/* Top Search Bar */}
      <div className="pb-1">
        <div className="relative flex items-center">
          <Search className="absolute left-4 size-4.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearchChange?.(e.target.value)
            }}
            placeholder="Search apps or critiques..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-black/10 text-sm font-medium text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-foreground/15 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Trending Software Under Review Widget */}
      <div className="rounded-3xl bg-white border border-black/10 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="size-4 text-amber-600" />
            </div>
            <h3 className="text-base font-black text-foreground tracking-tight">
              Trending Under Review
            </h3>
          </div>
       
        </div>

        <div className="divide-y divide-black/5">
          {TRENDING_APPS.map((app) => (
            <Link
              key={app.name}
              to="/app/$slug"
              params={{ slug: app.slug }}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3.5 group hover:bg-black/[0.02] -mx-2.5 px-2.5 rounded-2xl transition cursor-pointer !no-underline"
              onClick={() => onSelectTag?.(app.name)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground truncate group-hover:underline">
                    {app.name}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {app.category} · {app.evaluationsCount} takes
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {app.craftScore}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Critics to Follow Widget */}
      <div className="rounded-3xl bg-white border border-black/10 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-black/5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-foreground tracking-tight">
              Top Critics to Follow
            </h3>
          </div>
        </div>

        <div className="divide-y divide-black/5">
          {critics.map((critic) => {
            const cleanH = critic.handle.toLowerCase().replace(/^@/, '')
            const isFollowing = followingSet.has(cleanH)
            const isPending = !!pendingHandles[critic.handle]

            return (
              <div
                key={critic.handle}
                className="py-3.5 first:pt-1.5 last:pb-1.5 flex items-center justify-between gap-3.5"
              >
                <Link
                  to="/u/$handle"
                  params={{ handle: critic.handle }}
                  className="flex items-center gap-3 min-w-0 group hover:opacity-85 transition !no-underline"
                >
                  <CriticAvatar
                    avatarUrl={critic.avatarUrl}
                    seed={critic.handle}
                    size="md"
                    className="shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:underline">
                        {critic.displayName}
                      </p>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-900 border border-amber-600/20 shrink-0">
                        #{critic.criticNumber}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-500 truncate mt-0.5">
                      @{critic.handle}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {critic.role}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleFollow(critic.handle)}
                  disabled={isPending}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer active:scale-95 ${
                    isFollowing
                      ? 'bg-white text-foreground border border-black/20 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 group/unfollow'
                      : 'bg-foreground text-background hover:bg-neutral-800 shadow-2xs'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <span className="group-hover/unfollow:hidden">Following</span>
                      <span className="hidden group-hover/unfollow:inline">Unfollow</span>
                    </>
                  ) : (
                    'Follow'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mini Editorial Legal / Policy Footer */}
      <div className="px-2 pt-2 text-xs text-neutral-400 leading-relaxed space-y-1.5">
        <div className="flex flex-wrap gap-x-3.5 gap-y-1">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Feedback</span>
        </div>
        <p className="text-[11px] text-neutral-400">
          &copy; 2026 Screenlog · Certified LGTM Consortium
        </p>
      </div>
    </div>
  )
}

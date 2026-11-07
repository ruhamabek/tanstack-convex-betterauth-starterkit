import { useState } from 'react'
import { Search, TrendingUp, Flame } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useQuery as useConvexReactQuery } from 'convex/react'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import CriticAvatar from '../CriticAvatar'
import { Skeleton } from '../ui/skeleton'

interface DashboardRightRailProps {
  onSearchChange?: (query: string) => void
  onSelectTag?: (tag: string) => void
}

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
  onSelectTag,
}: DashboardRightRailProps) {
  const [pendingHandles, setPendingHandles] = useState<Record<string, boolean>>({})

  // Real Convex queries & mutations
  const liveTrendingData = useConvexReactQuery(api.apps.listTrending, { limit: 4 })
  const suggestedCriticsData = useConvexReactQuery(api.follows.listSuggestedCritics, { limit: 4 })
  const followingHandles = useConvexReactQuery(api.follows.getMyFollowingHandles, {}) || []
  const toggleFollowMutation = useConvexMutation(api.follows.toggleFollow)

  const isLoadingTrending = liveTrendingData === undefined
  const trendingApps = liveTrendingData || []

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
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('screenlog:open-search'))
          }}
          className="w-full relative flex items-center text-left cursor-pointer group"
          title="Search apps, specimens, critics, and critiques (⌘K)"
        >
          <Search className="absolute left-4 size-4.5 text-neutral-400 group-hover:text-foreground transition pointer-events-none" />
          <div className="w-full pl-11 pr-14 py-3 rounded-2xl bg-white border border-black/10 text-sm font-medium text-neutral-400 group-hover:border-black/25 group-hover:text-neutral-600 transition shadow-2xs truncate">
            Search apps or critiques...
          </div>
          <kbd className="absolute right-3.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-black/5 border border-black/10 text-[10px] font-mono font-bold text-neutral-500 group-hover:bg-black/10 transition pointer-events-none">
            ⌘K
          </kbd>
        </button>
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

        {isLoadingTrending ? (
          <div className="divide-y divide-black/5 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3.5"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : trendingApps.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No specimens under review yet.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {trendingApps.map((app) => (
              <Link
                key={app.slug}
                to="/app/$slug"
                params={{ slug: app.slug }}
                className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group hover:bg-black/[0.02] -mx-2.5 px-2.5 rounded-2xl transition cursor-pointer !no-underline"
                onClick={() => onSelectTag?.(app.name)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground truncate group-hover:underline">
                      {app.name}
                    </span>
                    {app.isHot && (
                      <span
                        title={`Trending momentum score: ${app.trendingScore}`}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-900 border border-amber-600/20 shrink-0"
                      >
                        <Flame className="size-2.5 text-amber-600 fill-amber-500" />
                        <span>HOT</span>
                      </span>
                    )}
                    {app.isDebated && !app.isHot && (
                      <span
                        title="Active community counter-appraisals"
                        className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500/10 text-rose-800 border border-rose-500/20 shrink-0"
                      >
                        DEBATE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {app.category} · {app.velocityLabel || `${app.reviewCount} takes`}
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
        )}
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
 
    </div>
  )
}

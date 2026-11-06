import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery as useConvexReactQuery } from 'convex/react'
import {
  Search,
  X,
  TrendingUp,
  Users,
  MessageSquare,
  ArrowRight,
  Command,
  Compass,
  Bookmark,
  Bell,
  User,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Dialog, DialogContent } from '../ui/Dialog'
import CriticAvatar from '../CriticAvatar'

export interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

type SearchCategory = 'all' | 'apps' | 'critics' | 'reviews'

export default function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = '',
}: GlobalSearchModalProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 150ms client-side debounce for optimal network efficiency & typing responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setDebouncedQuery(initialQuery)
      setSelectedIndex(0)
      setActiveCategory('all')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, initialQuery])

  // Query Convex global search endpoint
  const searchResults = useConvexReactQuery(api.search.globalSearch, {
    query: debouncedQuery,
    limit: 8,
  })

  const apps = searchResults?.apps || []
  const critics = searchResults?.critics || []
  const reviews = searchResults?.reviews || []
  const isSuggestion = Boolean(searchResults?.isSuggestion)

  // Flatten active visible results for seamless keyboard arrow navigation
  const flatItems = useMemo(() => {
    const list: Array<
      | { type: 'app'; item: (typeof apps)[0] }
      | { type: 'critic'; item: (typeof critics)[0] }
      | { type: 'review'; item: (typeof reviews)[0] }
      | { type: 'quicknav'; item: { title: string; route: string; icon: any } }
    > = []

    if (isSuggestion && !query.trim()) {
      // Add quick navigation options in empty state
      list.push({
        type: 'quicknav',
        item: { title: 'Feed', route: '/feed', icon: Compass },
      })
      list.push({
        type: 'quicknav',
        item: { title: 'Bookmarks', route: '/bookmarks', icon: Bookmark },
      })
      list.push({
        type: 'quicknav',
        item: { title: 'Notifications', route: '/notifications', icon: Bell },
      })
      list.push({
        type: 'quicknav',
        item: { title: 'Profile', route: '/dashboard', icon: User },
      })
    }

    if (activeCategory === 'all' || activeCategory === 'apps') {
      for (const app of apps) list.push({ type: 'app', item: app })
    }
    if (activeCategory === 'all' || activeCategory === 'critics') {
      for (const critic of critics) list.push({ type: 'critic', item: critic })
    }
    if (activeCategory === 'all' || activeCategory === 'reviews') {
      for (const review of reviews) list.push({ type: 'review', item: review })
    }

    return list
  }, [apps, critics, reviews, activeCategory, isSuggestion, query])

  // Ensure selectedIndex stays in bounds when results change
  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, flatItems.length - 1)))
  }, [flatItems.length])

  // Smooth scroll selected item into view inside results container
  useEffect(() => {
    const container = resultsContainerRef.current
    if (!container) return
    const activeEl = container.querySelector('[data-selected="true"]') as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelectItem = (target: (typeof flatItems)[0]) => {
    if (!target) return

    if (target.type === 'quicknav') {
      navigate({ to: target.item.route as any })
      onClose()
      return
    }

    if (target.type === 'app') {
      navigate({ to: '/app/$slug', params: { slug: target.item.slug } })
      onClose()
      return
    }

    if (target.type === 'critic') {
      navigate({ to: '/u/$handle', params: { handle: target.item.handle } })
      onClose()
      return
    }

    if (target.type === 'review') {
      navigate({ to: '/app/$slug', params: { slug: target.item.appSlug } })
      onClose()
      return
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelectItem(flatItems[selectedIndex])
    }
  }

  let runningIndex = 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden bg-white border border-black/15 shadow-2xl rounded-3xl"
        onClose={onClose}
      >
        {/* Top Search Input Bar */}
        <div className="relative flex items-center px-4 sm:px-6 py-4 border-b border-black/10 bg-white">
          <Search className="size-5 text-neutral-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search apps, specimens, critics, or critiques..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-foreground placeholder:text-neutral-400 focus:outline-none"
          />

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setDebouncedQuery('')
                  inputRef.current?.focus()
                }}
                className="size-7 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-400 hover:text-foreground transition cursor-pointer"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-mono font-bold text-neutral-600 transition cursor-pointer"
              title="Close search (Esc)"
            >
              <span>ESC</span>
            </button>
          </div>
        </div>

        {/* Filter Category Tabs (if query is present) */}
        {query.trim().length > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-black/5 bg-[#FAF8F3] overflow-x-auto scrollbar-none select-none">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all')
                setSelectedIndex(0)
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-foreground text-background shadow-2xs'
                  : 'text-neutral-600 hover:text-foreground hover:bg-black/5'
              }`}
            >
              All Results ({apps.length + critics.length + reviews.length})
            </button>

            {apps.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('apps')
                  setSelectedIndex(0)
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeCategory === 'apps'
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-neutral-600 hover:text-foreground hover:bg-black/5'
                }`}
              >
                Apps ({apps.length})
              </button>
            )}

            {critics.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('critics')
                  setSelectedIndex(0)
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeCategory === 'critics'
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-neutral-600 hover:text-foreground hover:bg-black/5'
                }`}
              >
                Critics ({critics.length})
              </button>
            )}

            {reviews.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('reviews')
                  setSelectedIndex(0)
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeCategory === 'reviews'
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-neutral-600 hover:text-foreground hover:bg-black/5'
                }`}
              >
                Critiques ({reviews.length})
              </button>
            )}
          </div>
        )}

        {/* Search Results / Suggestion Body */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] sm:max-h-[460px] overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#FAF9F6] scrollbar-none"
        >
          {/* Quick Navigation in Empty State */}
          {isSuggestion && !query.trim() && (
            <div>
              <span className="block px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500 select-none">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { title: 'Feed', route: '/feed', icon: Compass },
                  { title: 'Bookmarks', route: '/bookmarks', icon: Bookmark },
                  { title: 'Notifications', route: '/notifications', icon: Bell },
                  { title: 'Profile', route: '/dashboard', icon: User },
                ].map((item) => {
                  const itemIndex = runningIndex++
                  const isSelected = selectedIndex === itemIndex
                  const Icon = item.icon
                  return (
                    <button
                      key={item.route}
                      type="button"
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={() => handleSelectItem({ type: 'quicknav', item })}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-foreground shadow-sm ring-2 ring-foreground/10'
                          : 'bg-white hover:bg-white/90 border-black/10 shadow-2xs'
                      }`}
                    >
                      <div className="size-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <span className="text-xs font-bold text-foreground whitespace-nowrap">
                        {item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Apps & Digital Specimens Section */}
          {(activeCategory === 'all' || activeCategory === 'apps') && apps.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 pb-2 select-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-amber-600" />
                  <span>
                    {isSuggestion ? 'Trending Software Under Review' : 'Apps & Specimens'}
                  </span>
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-500">
                  {apps.length}
                </span>
              </div>

              <div className="space-y-2">
                {apps.map((app) => {
                  const itemIndex = runningIndex++
                  const isSelected = selectedIndex === itemIndex
                  return (
                    <div
                      key={app._id}
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={() => handleSelectItem({ type: 'app', item: app })}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected
                          ? 'bg-white border-foreground shadow-sm ring-2 ring-foreground/10'
                          : 'bg-white hover:bg-white/90 border-black/10 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="size-11 sm:size-12 rounded-2xl object-cover border border-black/10 shrink-0 bg-white"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-foreground truncate tracking-tight">
                              {app.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-neutral-600 uppercase tracking-wider shrink-0 border border-black/5">
                              {app.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 truncate mt-1 leading-normal font-normal">
                            {app.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Clear Craft Score Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border tracking-tight ${
                            app.craftScore >= 90
                              ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25'
                              : app.craftScore >= 70
                              ? 'bg-amber-500/10 text-amber-800 border-amber-500/25'
                              : 'bg-rose-500/10 text-rose-800 border-rose-500/25'
                          }`}
                        >
                          {app.craftScore}% CRAFT
                        </span>

                        {/* Distinct Status Pill */}
                        <span
                          className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                            app.status === 'Certified LGTM'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : app.status === 'Needs Polish'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                          }`}
                        >
                          <span>{app.status}</span>
                        </span>

                        <ArrowRight
                          className={`size-4 text-neutral-400 group-hover:text-foreground transition-transform ${
                            isSelected ? 'translate-x-0.5 text-foreground' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Interface Critics Section */}
          {(activeCategory === 'all' || activeCategory === 'critics') && critics.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 pb-2 select-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Users className="size-3.5 text-indigo-600" />
                  <span>
                    {isSuggestion ? 'Top Interface Critics' : 'Interface Critics'}
                  </span>
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-500">
                  {critics.length}
                </span>
              </div>

              <div className="space-y-2">
                {critics.map((critic) => {
                  const itemIndex = runningIndex++
                  const isSelected = selectedIndex === itemIndex
                  return (
                    <div
                      key={critic._id}
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={() => handleSelectItem({ type: 'critic', item: critic })}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected
                          ? 'bg-white border-foreground shadow-sm ring-2 ring-foreground/10'
                          : 'bg-white hover:bg-white/90 border-black/10 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <CriticAvatar
                          avatarUrl={critic.avatarUrl}
                          seed={critic.handle}
                          size="md"
                          rounded="squircle"
                          className="shrink-0 border border-black/10"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-foreground truncate tracking-tight">
                              {critic.displayName}
                            </span>
                            <span className="text-xs font-mono font-medium text-neutral-500 truncate">
                              @{critic.handle}
                            </span>
                            {critic.badge === 'Founding Critic' && (
                              <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded shrink-0">
                                FOUNDING #{critic.criticNumber ?? 1}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 truncate mt-1 font-normal">
                            {critic.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-bold text-neutral-500 bg-black/5 px-2.5 py-1 rounded-xl">
                          {critic.reviewsCount} takes
                        </span>
                        <ArrowRight
                          className={`size-4 text-neutral-400 group-hover:text-foreground transition-transform ${
                            isSelected ? 'translate-x-0.5 text-foreground' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Critiques Section */}
          {(activeCategory === 'all' || activeCategory === 'reviews') && reviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 pb-2 select-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-sky-600" />
                  <span>Critiques & Scorecards</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-500">
                  {reviews.length}
                </span>
              </div>

              <div className="space-y-2">
                {reviews.map((rev) => {
                  const itemIndex = runningIndex++
                  const isSelected = selectedIndex === itemIndex
                  return (
                    <div
                      key={rev._id}
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={() => handleSelectItem({ type: 'review', item: rev })}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected
                          ? 'bg-white border-foreground shadow-sm ring-2 ring-foreground/10'
                          : 'bg-white hover:bg-white/90 border-black/10 shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black font-mono text-foreground">
                            {rev.appName}
                          </span>
                          <span className="text-[10px] text-neutral-400">&bull;</span>
                          <span className="text-xs font-medium text-neutral-600">
                            @{rev.authorHandle}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-bold">
                            {rev.craftScore}% CRAFT
                          </span>
                        </div>
                        <p className="text-xs text-neutral-800 font-serif italic line-clamp-1 leading-normal">
                          &ldquo;{rev.headline || rev.quote}&rdquo;
                        </p>
                      </div>

                      <ArrowRight
                        className={`size-4 text-neutral-400 group-hover:text-foreground transition-transform shrink-0 ${
                          isSelected ? 'translate-x-0.5 text-foreground' : ''
                        }`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty search results fallback */}
          {!isSuggestion && flatItems.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
                <Search className="size-6 text-neutral-400" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                No matching results
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-normal">
                No apps, critics, or critiques found matching &ldquo;{query}&rdquo;. Try another keyword.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Keyboard Navigation Helper Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-black/10 bg-white flex items-center justify-between text-xs text-neutral-600 font-medium select-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 border border-black/15 font-mono font-bold text-[11px] text-foreground shadow-2xs">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-black/5 border border-black/15 font-mono font-bold text-[11px] text-foreground shadow-2xs">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-black/5 border border-black/15 font-mono font-bold text-[11px] text-foreground shadow-2xs">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-500">
            <Command className="size-3.5" />
            <span>K to toggle</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

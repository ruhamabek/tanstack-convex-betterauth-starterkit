import { Plus, Sparkles, Search } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { SidebarTrigger } from './ui/sidebar'
 
export function SiteHeader() {
  const location = useLocation()
  const pageTitle = location.pathname.startsWith('/feed')
    ? 'Community Feed'
    : location.pathname.startsWith('/notifications')
      ? 'Notifications'
      : location.pathname.startsWith('/bookmarks')
        ? 'Bookmarks'
        : location.pathname.startsWith('/app/')
          ? 'Consensus Hub'
          : location.pathname.startsWith('/u/')
            ? 'Critic Profile'
            : location.pathname.startsWith('/dashboard')
              ? 'My Profile'
              : 'Screenlog'

  const triggerOpenEvaluate = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-evaluate'))
  }

  const triggerOpenSpecimen = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-specimen'))
  }

  const triggerOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-search'))
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-black/10 bg-desk/90 backdrop-blur-md px-4 select-none">
      {/* Left: Sidebar Toggle + Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="h-4 w-px bg-black/10" />
        <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-600">
          {pageTitle}
        </span>
      </div>

      {/* Right: Quick Action CTAs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={triggerOpenSearch}
          className="inline-flex lg:hidden items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-foreground transition active:scale-95 cursor-pointer shadow-2xs"
          title="Global Search"
        >
          <Search className="size-3.5 text-neutral-500" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('screenlog:open-showreel'))
            window.dispatchEvent(new CustomEvent('screenlog:open-drop-story'))
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 hover:opacity-90 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-neutral-900 transition active:scale-95 cursor-pointer shadow-2xs"
          title="Watch Critic Showreel"
        >
          <Sparkles className="size-3.5 text-amber-600 animate-pulse" />
          <span>Showreel</span>
        </button>
        <button
          type="button"
          onClick={triggerOpenSpecimen}
          className="inline-flex lg:hidden items-center gap-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-900 transition active:scale-95 cursor-pointer"
        >
          <Sparkles className="size-3 text-amber-700" />
          <span>Specimen</span>
        </button>

        <button
          type="button"
          onClick={triggerOpenEvaluate}
          className="inline-flex lg:hidden items-center gap-1 rounded-full bg-foreground hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-bold text-background transition active:scale-95 cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>Evaluate</span>
        </button>
      </div>
    </header>
  )
}

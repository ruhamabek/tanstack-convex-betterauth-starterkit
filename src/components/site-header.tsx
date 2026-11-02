import { Plus, Sparkles } from 'lucide-react'
import { SidebarTrigger } from './ui/sidebar'
 
export function SiteHeader() {
  const triggerOpenEvaluate = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-evaluate'))
  }

  const triggerOpenSpecimen = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-specimen'))
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-black/10 bg-desk/90 backdrop-blur-md px-4 select-none">
      {/* Left: Sidebar Toggle + Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="h-4 w-px bg-black/10" />
      </div>

      {/* Right: Quick Action CTAs for mobile & tablet */}
      <div className="flex items-center gap-2">
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

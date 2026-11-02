import { Sparkles, Link2, Plus } from 'lucide-react'
import CriticAvatar from '../CriticAvatar'

export interface FeedComposerProps {
  avatarUrl?: string | null
  criticHandle?: string
  onOpenEvaluate: () => void
  onOpenSpecimen: () => void
}

export default function FeedComposer({
  avatarUrl,
  criticHandle = 'critic',
  onOpenEvaluate,
  onOpenSpecimen,
}: FeedComposerProps) {
  return (
    <div className="w-full border-b border-black/10 bg-canvas px-4 py-3 select-none">
      <div className="flex items-center gap-3">
        {/* Critic Avatar */}
        <div className="shrink-0">
          <CriticAvatar
            avatarUrl={avatarUrl}
            seed={criticHandle}
            size="md"
            rounded="squircle"
          />
        </div>

        {/* Clickable Prompt Trigger Bar */}
        <button
          type="button"
          onClick={onOpenEvaluate}
          className="flex-1 min-w-0 h-10 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200/80 border border-black/5 text-left text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer flex items-center justify-between group shadow-2xs"
          title="Click to audit software"
        >
          <span className="truncate">
            Audit software, dissect craft, or drop a specimen...
          </span>
          <Sparkles className="size-3.5 text-neutral-400 group-hover:text-amber-600 transition shrink-0 ml-2" />
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Specimen Ingest Shortcut */}
          <button
            type="button"
            onClick={onOpenSpecimen}
            title="Ingest via Specimen URL"
            className="size-9 rounded-full hover:bg-black/5 flex items-center justify-center text-neutral-500 hover:text-foreground transition cursor-pointer"
          >
            <Link2 className="size-4" />
          </button>

          {/* Evaluate Action Button */}
          <button
            type="button"
            onClick={onOpenEvaluate}
            className="px-3.5 sm:px-4 py-2 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Evaluate</span>
          </button>
        </div>
      </div>
    </div>
  )
}

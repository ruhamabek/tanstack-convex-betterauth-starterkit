import { Edit3, Plus, Sparkles } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { SignOutButton } from '../AuthControls'
import CriticAvatar from '../CriticAvatar'
import FoundingCriticBadge from './FoundingCriticBadge'

export interface CriticProfileHeaderProps {
  profile?: Doc<'profiles'> | null
  user?: { name?: string; email?: string } | null
  reviewsCount: number
  lgtmCount: number
  rottenCount: number
  avgCraftGiven: number | null
  onOpenCritiqueModal: () => void
  onOpenEditProfileModal: () => void
  onOpenCreateSpecimenModal?: () => void
}

export default function CriticProfileHeader({
  profile,
  user,
  reviewsCount,
  lgtmCount,
  rottenCount,
  avgCraftGiven,
  onOpenCritiqueModal,
  onOpenEditProfileModal,
  onOpenCreateSpecimenModal,
}: CriticProfileHeaderProps) {
  return (
    <section className="relative z-20 rounded-[32px] bg-canvas border border-black/10 p-6 sm:p-8 shadow-xs">
      {/* Subtle warm ambient backdrop gradient */}
      <div className="absolute top-0 inset-x-0 h-28 rounded-t-[31px] bg-gradient-to-b from-amber-500/[0.04] to-transparent pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Avatar + Identity */}
        <div className="flex items-start sm:items-center gap-5">
          <CriticAvatar
            avatarUrl={profile?.avatarUrl}
            seed={profile?.handle || user?.name || 'critic'}
            size="2xl"
            className="shadow-sm border-2 border-black/10 shrink-0"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {profile?.displayName ?? user?.name ?? 'Software Critic'}
              </h1>

              {profile && (
                <span className="text-xs font-mono font-bold text-muted-foreground bg-black/5 px-2 py-0.5 rounded-md">
                  @{profile.handle}
                </span>
              )}

              <FoundingCriticBadge
                profile={profile}
                reviewsCount={reviewsCount}
              />
            </div>

            <p className="text-xs sm:text-sm font-semibold flex flex-col text-neutral-600">
              {profile?.role ?? 'Product Crafter'}
              {profile?.bio && (
                <span className="text-neutral-700 font-serif font-normal italic text-xs sm:text-[13px] mt-0.5 leading-relaxed">
                  &ldquo;{profile.bio}&rdquo;
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Stats Counters & Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-black/5">
          {/* Horizontal Stats Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-center px-3 py-1.5 rounded-xl bg-desk border border-black/5 shadow-2xs">
              <div className="text-lg font-black text-foreground leading-none">
                {reviewsCount}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                Evaluations
              </div>
            </div>

            <div className="text-center px-3 py-1.5 rounded-xl bg-desk border border-black/5 shadow-2xs">
              <div className="text-lg font-black text-emerald-700 leading-none">
                {lgtmCount}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                Certified LGTM
              </div>
            </div>

            <div className="text-center px-3 py-1.5 rounded-xl bg-desk border border-black/5 shadow-2xs">
              <div className="text-lg font-black text-rose-700 leading-none">
                {rottenCount}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                Rotten
              </div>
            </div>

            {avgCraftGiven !== null && (
              <div className="text-center px-3 py-1.5 rounded-xl bg-desk border border-black/5 shadow-2xs">
                <div className="text-lg font-black text-amber-600 leading-none">
                  {avgCraftGiven}%
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                  Avg Craft
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Evaluate App (Primary), Ingest Specimen & Edit Persona */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenCritiqueModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-4 sm:px-5 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 cursor-pointer"
              title="Evaluate a living software application or feature"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span>Evaluate App</span>
            </button>

            {onOpenCreateSpecimenModal && (
              <button
                type="button"
                onClick={onOpenCreateSpecimenModal}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 sm:px-4 py-2.5 text-xs font-bold text-amber-900 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Index a design exploration from Dribbble, Figma, Mobbin, or Pinterest"
              >
                <Sparkles className="size-3.5 text-amber-700" />
                <span>Ingest Specimen</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenEditProfileModal}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 border border-black/10 px-3.5 sm:px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs transition active:scale-95 cursor-pointer"
              title="Edit Critic Persona & Avatar"
            >
              <Edit3 className="size-3.5" />
              <span>Edit Persona</span>
            </button>

            <div className="hidden sm:block">
              <SignOutButton className="cursor-pointer hover:text-destructive text-sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

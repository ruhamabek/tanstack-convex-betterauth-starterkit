import { Edit3, Plus,  Briefcase, Camera, Pencil } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'
import FoundingCriticBadge from './FoundingCriticBadge'

export interface CriticProfileHeaderProps {
  profile?: (Doc<'profiles'> & { bannerUrl?: string }) | null
  user?: { name?: string; email?: string } | null
  reviewsCount: number
  lgtmCount: number
  rottenCount: number
  avgCraftGiven: number | null
  isOwnProfile?: boolean
  isFollowing?: boolean
  followersCount?: number
  followingCount?: number
  isFollowPending?: boolean
  activeTab?: string
  onSelectTab?: (tab: 'all' | 'lgtm' | 'mixed' | 'rotten') => void
  onOpenFollowList?: (tab: 'following' | 'followers') => void
  onToggleFollow?: () => void
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
  isOwnProfile = true,
  isFollowing = false,
  followersCount,
  followingCount,
  isFollowPending = false,
  activeTab,
  onSelectTab,
  onOpenFollowList,
  onToggleFollow,
  onOpenCritiqueModal,
  onOpenEditProfileModal,
  onOpenCreateSpecimenModal,
}: CriticProfileHeaderProps) {
  const displayName = profile?.displayName ?? user?.name ?? 'Software Critic'
  const handle = profile?.handle ?? 'critic'

  return (
    <section className="relative w-full border-b border-black/10 bg-canvas select-none">
      {/* Editorial Cover Banner */}
      <div className="relative h-36 sm:h-48 w-full bg-gradient-to-r from-amber-200/50 via-stone-200/60 to-orange-100/60 overflow-hidden border-b border-black/5 group">
        {profile?.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt={`${displayName} cover banner`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Subtle stationery texture dots */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #000 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Ambient watermark stamp in banner corner */}
            <div className="absolute right-4 bottom-2 opacity-25 pointer-events-none select-none">
              <img
                src="/assets/rubber_stamp_3d.png"
                alt="Rubber Stamp Ambient"
                className="w-28 sm:w-36 h-auto drop-shadow-md rotate-[-8deg]"
              />
            </div>
          </>
        )}

        {/* Quick edit banner hover trigger (only for own profile) */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={onOpenEditProfileModal}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 hover:bg-black/85 text-white rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Upload or change background cover image"
          >
            <Camera className="size-3.5" />
            <span>{profile?.bannerUrl ? 'Change Cover' : 'Add Cover'}</span>
          </button>
        )}
      </div>

      {/* Profile Details Container */}
      <div className="px-4 sm:px-6 pb-4">
        {/* Avatar & Action Buttons Row */}
        <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4">
          {/* Overlapping Profile Avatar */}
          <div className="relative group/avatar">
            <CriticAvatar
              avatarUrl={profile?.avatarUrl}
              seed={handle}
              size="2xl"
              className="size-24 sm:size-32 rounded-full border-4 border-canvas bg-white shadow-md shrink-0"
            />
            {isOwnProfile && (
              <button
                type="button"
                onClick={onOpenEditProfileModal}
                title="Upload or change profile picture"
                className="absolute inset-1 rounded-full bg-black/55 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-xs gap-0.5 sm:gap-1"
              >
                <Camera className="size-4 sm:size-6" />
                <span className="text-[9px] sm:text-[11px] font-bold tracking-tight">Edit Photo</span>
              </button>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={onOpenEditProfileModal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/20 hover:bg-black/5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-foreground transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit Persona</span>
                </button>

                {onOpenCreateSpecimenModal && (
                  <button
                    type="button"
                    onClick={onOpenCreateSpecimenModal}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-amber-900 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Ingest Dribbble or Mobbin specimen"
                  >
                    <Pencil className="size-3.5 text-amber-700" />
                    <span>Ingest</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenCritiqueModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground hover:bg-neutral-800 px-4 py-1.5 sm:py-2 text-xs font-bold text-background transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Evaluate</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onToggleFollow}
                disabled={isFollowPending}
                className={`inline-flex items-center justify-center min-w-24 sm:min-w-28 rounded-full px-4 py-1.5 sm:py-2 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs ${
                  isFollowing
                    ? 'border border-black/20 hover:border-rose-500/40 hover:bg-rose-50 hover:text-rose-600 text-foreground group/follow'
                    : 'bg-foreground hover:bg-neutral-800 text-background'
                }`}
              >
                {isFollowing ? (
                  <>
                    <span className="group-hover/follow:hidden">Following</span>
                    <span className="hidden group-hover/follow:inline">Unfollow</span>
                  </>
                ) : (
                  <span>Follow</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Name, Handle & Badges */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {displayName}
            </h1>
            <FoundingCriticBadge
              profile={profile}
              reviewsCount={reviewsCount}
            />
          </div>

          <p className="text-xs font-mono font-medium text-neutral-500">
            @{handle}
          </p>
        </div>

        {/* Bio / Manifesto */}
        {profile?.bio ? (
          <p className="mt-2.5 text-xs sm:text-sm text-neutral-700 leading-relaxed font-serif italic max-w-xl">
            &ldquo;{profile.bio}&rdquo;
          </p>
        ) : (
          <p className="mt-1 text-xs text-neutral-400 italic">
            Software evaluator & interface critic in the public consensus layer.
          </p>
        )}

        {/* Metadata (Role, Joined) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-neutral-400" />
            <span>{profile?.role ?? 'Product Crafter'}</span>
          </div>
        </div>

        {/* X-Style Stats Row */}
        <div className="mt-3.5 pt-3 border-t border-black/5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {followingCount !== undefined && (
            <button
              type="button"
              onClick={() => onOpenFollowList?.('following')}
              className="flex items-center gap-1.5 transition hover:opacity-75 cursor-pointer text-left group"
            >
              <span className="font-black text-foreground">{followingCount}</span>
              <span className="text-neutral-500 group-hover:text-foreground group-hover:underline underline-offset-2">Following</span>
            </button>
          )}

          {followersCount !== undefined && (
            <button
              type="button"
              onClick={() => onOpenFollowList?.('followers')}
              className="flex items-center gap-1.5 transition hover:opacity-75 cursor-pointer text-left group"
            >
              <span className="font-black text-foreground">{followersCount}</span>
              <span className="text-neutral-500 group-hover:text-foreground group-hover:underline underline-offset-2">Followers</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectTab?.('all')}
            className={`flex items-center gap-1.5 transition hover:opacity-75 cursor-pointer ${
              activeTab === 'all' ? 'font-black underline decoration-2 underline-offset-4' : ''
            }`}
          >
            <span className="font-black text-foreground">{reviewsCount}</span>
            <span className="text-neutral-500">Evaluations</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('lgtm')}
            className={`flex items-center gap-1.5 transition hover:opacity-75 cursor-pointer ${
              activeTab === 'lgtm' ? 'font-black underline decoration-2 underline-offset-4' : ''
            }`}
          >
            <span className="font-black text-emerald-700">{lgtmCount}</span>
            <span className="text-neutral-500">Certified LGTM</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('rotten')}
            className={`flex items-center gap-1.5 transition hover:opacity-75 cursor-pointer ${
              activeTab === 'rotten' ? 'font-black underline decoration-2 underline-offset-4' : ''
            }`}
          >
            <span className="font-black text-rose-700">{rottenCount}</span>
            <span className="text-neutral-500">Rotten</span>
          </button>

          {avgCraftGiven !== null && (
            <div className="flex items-center gap-1.5">
              <span className="font-black text-amber-700">{avgCraftGiven}%</span>
              <span className="text-neutral-500">Avg Craft</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

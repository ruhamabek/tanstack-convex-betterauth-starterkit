import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Users, LoaderCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog'
import CriticAvatar from '../CriticAvatar'

export interface FollowedCriticItem {
  _id: string
  userId?: string
  handle: string
  displayName: string
  role?: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  badge?: string
  criticNumber?: number
  reviewsCount?: number
  isFollowing?: boolean
}

export interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'following' | 'followers'
  profileHandle: string
  profileDisplayName?: string
  followingCritics: FollowedCriticItem[]
  followersCritics: FollowedCriticItem[]
  followingCount: number
  followersCount: number
  onToggleFollowCritic?: (handle: string) => Promise<void>
  pendingFollowHandles?: Record<string, boolean>
  viewerHandle?: string
}

export default function FollowListModal({
  isOpen,
  onClose,
  initialTab = 'following',
  profileHandle,
  profileDisplayName,
  followingCritics,
  followersCritics,
  followingCount,
  followersCount,
  onToggleFollowCritic,
  pendingFollowHandles,
  viewerHandle,
}: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  const criticsList = activeTab === 'following' ? followingCritics : followersCritics

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden sm:rounded-3xl" onClose={onClose}>
        <div className="p-6 pb-0">
          <DialogHeader className="mb-0 pb-3 border-b-0">
            <DialogTitle className="text-lg sm:text-xl font-black">
              {profileDisplayName || `@${profileHandle}`}
            </DialogTitle>
            <DialogDescription>
              @{profileHandle}
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex border-b border-black/10 mt-2">
            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-3 text-center text-xs sm:text-sm transition cursor-pointer font-bold relative ${
                activeTab === 'following'
                  ? 'text-foreground font-black'
                  : 'text-neutral-400 hover:text-neutral-700 font-medium'
              }`}
            >
              <span>Following</span>
              <span className="ml-1.5 font-mono text-xs text-neutral-400">
                ({followingCount})
              </span>
              {activeTab === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-3 text-center text-xs sm:text-sm transition cursor-pointer font-bold relative ${
                activeTab === 'followers'
                  ? 'text-foreground font-black'
                  : 'text-neutral-400 hover:text-neutral-700 font-medium'
              }`}
            >
              <span>Followers</span>
              <span className="ml-1.5 font-mono text-xs text-neutral-400">
                ({followersCount})
              </span>
              {activeTab === 'followers' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-6 pt-3">
          {criticsList.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="size-12 rounded-2xl bg-black/5 mx-auto flex items-center justify-center mb-3">
                <Users className="size-6 text-neutral-400" />
              </div>
              <p className="text-sm font-bold text-foreground">
                {activeTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                {activeTab === 'following'
                  ? 'When this critic follows other curators, they will show up here.'
                  : 'When other critics follow this profile, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 max-h-[50vh] overflow-y-auto px-1">
              {criticsList.map((critic) => {
                const isSelf =
                  viewerHandle &&
                  critic.handle.toLowerCase() === viewerHandle.toLowerCase()
                const isPending = Boolean(pendingFollowHandles?.[critic.handle])

                return (
                  <div
                    key={critic._id || critic.handle}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-black/[0.02] rounded-xl transition"
                  >
                    <Link
                      to="/u/$handle"
                      params={{ handle: critic.handle }}
                      onClick={onClose}
                      className="flex items-center gap-3 min-w-0 flex-1 group !no-underline"
                    >
                      <CriticAvatar
                        avatarUrl={critic.avatarUrl}
                        seed={critic.handle}
                        size="md"
                        className="shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-foreground truncate group-hover:underline">
                            {critic.displayName}
                          </span>
                          {critic.criticNumber && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-900 border border-amber-600/20 shrink-0">
                              #{critic.criticNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-neutral-500 truncate">
                          @{critic.handle}
                        </p>
                        {(critic.role || critic.bio) && (
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-xs sm:max-w-sm">
                            {critic.role || critic.bio}
                          </p>
                        )}
                      </div>
                    </Link>

                    {isSelf ? (
                      <span className="text-xs font-mono font-semibold text-neutral-400 bg-black/5 px-3 py-1 rounded-full shrink-0">
                        You
                      </span>
                    ) : onToggleFollowCritic ? (
                      <button
                        type="button"
                        onClick={() => onToggleFollowCritic(critic.handle)}
                        disabled={isPending}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                          critic.isFollowing
                            ? 'bg-white text-foreground border border-black/20 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 group/unfollow'
                            : 'bg-foreground text-background hover:bg-neutral-800 shadow-2xs'
                        }`}
                      >
                        {isPending ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : critic.isFollowing ? (
                          <>
                            <span className="group-hover/unfollow:hidden">Following</span>
                            <span className="hidden group-hover/unfollow:inline">Unfollow</span>
                          </>
                        ) : (
                          'Follow'
                        )}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

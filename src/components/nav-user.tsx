import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import type { Doc } from '../../convex/_generated/dataModel'
import CriticAvatar from './CriticAvatar'
import { SignOutButton } from './AuthControls'
import FoundingCriticBadge from './dashboard/FoundingCriticBadge'
import PersonaSwitcherModal from './dashboard/PersonaSwitcherModal'

export interface NavUserProps {
  user?: { name?: string; email?: string; image?: string | null } | null
  profile?: Doc<'profiles'> | null
}

export function NavUser({ user, profile }: NavUserProps) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const displayName = profile?.displayName ?? user?.name ?? 'Critic'
  const handle = profile?.handle ?? 'critic'

  const handleStoryClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    window.dispatchEvent(new CustomEvent('screenlog:open-showreel'))
    window.dispatchEvent(new CustomEvent('screenlog:open-drop-story'))
  }

  return (
    <>
      <div className="flex items-center justify-between gap-1.5 p-1 rounded-2xl hover:bg-black/5 transition select-none w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 py-1 px-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-initial">
          <CriticAvatar
            avatarUrl={profile?.avatarUrl ?? user?.image ?? undefined}
            seed={handle}
            size="sm"
            hasStory={true}
            onStoryClick={handleStoryClick}
            className="size-8.5 shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform cursor-pointer"
          />

          <Link
            to="/dashboard"
            className="min-w-0 flex-1 !no-underline !text-foreground hover:opacity-85 transition group-data-[collapsible=icon]:hidden"
            title={`@${handle} (${displayName})`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black truncate leading-tight text-foreground">
                {displayName}
              </span>
              {profile && (
                <FoundingCriticBadge
                  profile={profile}
                  reviewsCount={0}
                  variant="compact"
                  align="top"
                />
              )}
            </div>
            <div className="text-[11px] font-mono text-neutral-400 truncate">
              @{handle}
            </div>
          </Link>
        </div>

        <div className="shrink-0 flex items-center gap-0.5 group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            title="Switch Critic Persona (Test 5 Accounts)"
            className="cursor-pointer text-neutral-400 hover:text-foreground p-1.5 rounded-xl hover:bg-black/5 transition"
          >
            <Users className="size-4" />
          </button>

          <SignOutButton
            showText={false}
            className="cursor-pointer text-neutral-400 hover:text-destructive p-1.5 rounded-xl hover:bg-black/5 transition"
          />
        </div>
      </div>

      <PersonaSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentHandle={handle}
      />
    </>
  )
}

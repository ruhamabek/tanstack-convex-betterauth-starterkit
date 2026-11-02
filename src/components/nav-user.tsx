import { Link } from '@tanstack/react-router'
import type { Doc } from '../../convex/_generated/dataModel'
import CriticAvatar from './CriticAvatar'
import { SignOutButton } from './AuthControls'
import FoundingCriticBadge from './dashboard/FoundingCriticBadge'

export interface NavUserProps {
  user?: { name?: string; email?: string; image?: string | null } | null
  profile?: Doc<'profiles'> | null
}

export function NavUser({ user, profile }: NavUserProps) {
  const displayName = profile?.displayName ?? user?.name ?? 'Critic'
  const handle = profile?.handle ?? 'critic'

  return (
    <div className="flex items-center justify-between gap-1.5 p-1 rounded-2xl hover:bg-black/5 transition select-none w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 min-w-0 flex-1 !no-underline !text-foreground group py-1 px-1 rounded-xl group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-initial"
        title={`@${handle} (${displayName})`}
      >
        <CriticAvatar
          avatarUrl={profile?.avatarUrl ?? user?.image ?? undefined}
          seed={handle}
          size="sm"
          className="size-8.5 shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
        />
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
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
        </div>
      </Link>

      <div className="shrink-0 group-data-[collapsible=icon]:hidden">
        <SignOutButton
          showText={false}
          className="cursor-pointer text-neutral-400 hover:text-destructive p-2 rounded-xl hover:bg-black/5 transition"
        />
      </div>
    </div>
  )
}

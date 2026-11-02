import { Award } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'

export interface FoundingCriticBadgeProps {
  profile?: (Doc<'profiles'> & { bannerUrl?: string }) | null
  reviewsCount?: number
  variant?: 'default' | 'compact'
  align?: 'bottom' | 'top'
  className?: string
}

export default function FoundingCriticBadge({
  profile,
  variant = 'default',
  className = '',
}: FoundingCriticBadgeProps) {
  const badgeText = profile?.badge ?? 'Founding Critic'
  const criticNum = profile?.criticNumber ?? 1
  const isFounding = badgeText === 'Founding Critic'

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-900 border border-amber-500/25 shadow-2xs whitespace-nowrap shrink-0 cursor-default select-none ${className}`}
        title={`Founding Critic #${criticNum}`}
      >
        <Award className="size-3 text-amber-600 shrink-0" />
        <span>#{criticNum}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-500/25 shadow-2xs whitespace-nowrap shrink-0 cursor-default select-none ${className}`}
      title={`Founding Critic #${criticNum}`}
    >
      <Award className="size-3.5 text-amber-600 shrink-0" />
      <span className="whitespace-nowrap">{badgeText}</span>
      {isFounding && (
        <span className="font-mono text-[10px] text-amber-700 font-semibold bg-amber-500/15 px-1.5 py-0.2 rounded-md whitespace-nowrap">
          #{criticNum}
        </span>
      )}
    </span>
  )
}


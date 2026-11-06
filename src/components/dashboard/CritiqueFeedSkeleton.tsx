import CritiqueCardSkeleton from './CritiqueCardSkeleton'

export interface CritiqueFeedSkeletonProps {
  count?: number
}

export default function CritiqueFeedSkeleton({
  count = 3,
}: CritiqueFeedSkeletonProps) {
  return (
    <div
      data-slot="feed-skeleton"
      className="flex flex-col gap-4 p-3.5 sm:p-5 animate-in fade-in duration-150"
      aria-busy="true"
      aria-label="Loading critiques"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <CritiqueCardSkeleton key={idx} />
      ))}
    </div>
  )
}

import { Skeleton } from '../ui/skeleton'

export default function CritiqueCardSkeleton() {
  return (
    <article className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-black/10 shadow-2xs select-none">
      {/* Top Header: Critic Avatar, Handle, Timestamp & Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Squircle Avatar Skeleton */}
          <Skeleton className="size-10 rounded-2xl shrink-0" />
          <div className="space-y-1.5 min-w-0">
            {/* Handle */}
            <Skeleton className="h-4 w-28 rounded-md" />
            {/* Timestamp */}
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>

        {/* Top-Right Pill/Badge Skeleton */}
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Tags / Scope Row */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* App / Specimen Title & Attribution */}
      <div className="space-y-1.5 mb-3">
        <Skeleton className="h-6 w-48 sm:w-60 rounded-md" />
        <Skeleton className="h-3.5 w-32 rounded-md" />
      </div>

      {/* Headline & Quote Skeletons */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>

      {/* Visual Proof Media Skeleton with stamp overlay placeholder */}
      <div className="mb-4 rounded-2xl overflow-hidden border border-black/10 relative bg-neutral-100/50">
        <Skeleton className="h-56 sm:h-64 w-full rounded-2xl" />
        <div className="absolute top-4 right-4">
          <Skeleton className="w-24 h-9 rounded-lg rotate-3 opacity-60" />
        </div>
      </div>

      {/* Dual Scores Box Skeleton */}
      <div className="rounded-2xl bg-[#FAF8F3] border border-black/[0.06] p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {/* Craft */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-12 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-32 rounded-sm" />
          </div>

          {/* Utility */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-14 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-32 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Action Bar Skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-6 sm:gap-8">
          <Skeleton className="h-4 w-10 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
        <Skeleton className="size-7 rounded-full" />
      </div>
    </article>
  )
}

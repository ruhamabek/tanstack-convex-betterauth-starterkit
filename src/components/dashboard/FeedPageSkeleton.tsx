import { Skeleton } from '../ui/skeleton'
import CritiqueFeedSkeleton from './CritiqueFeedSkeleton'

export default function FeedPageSkeleton() {
  return (
    <div className="flex-1 flex justify-start items-start w-full h-full min-h-0 overflow-hidden select-none">
      {/* Center Column Skeleton */}
      <main className="w-full max-w-[620px] xl:max-w-[660px] 2xl:max-w-[700px] h-full overflow-y-auto border-r border-black/10 bg-canvas scrollbar-none">
        {/* Top Sticky X-Style Tabs Skeleton */}
        <div className="flex items-center justify-between border-b border-black/10 bg-canvas/90 backdrop-blur-xs sticky top-0 z-20 px-4 py-3.5">
          <div className="flex flex-1 justify-around">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="size-8 rounded-full shrink-0" />
        </div>

        {/* Top Action Prompt Bar Skeleton (Composer) */}
        <div className="border-b border-black/10 bg-white/40 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-2xl shrink-0" />
            <Skeleton className="h-11 flex-1 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        {/* The Feed Cards Skeleton */}
        <CritiqueFeedSkeleton count={3} />
      </main>

      {/* Right Column Skeleton (Stationary Discovery Rail) */}
      <aside className="hidden lg:block w-[360px] xl:w-[420px] 2xl:w-[460px] h-full overflow-y-auto pl-6 pr-6 xl:pl-8 xl:pr-8 pt-4 pb-12 shrink-0 scrollbar-none space-y-6">
        {/* Search Bar Skeleton */}
        <Skeleton className="h-11 w-full rounded-full" />

        {/* Genesis Consortium Card Skeleton */}
        <div className="bg-white rounded-3xl p-5 border border-black/10 shadow-2xs space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-48 rounded-md" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-2xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
                <Skeleton className="h-7 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Living Scorecards Skeleton */}
        <div className="bg-white rounded-3xl p-5 border border-black/10 shadow-2xs space-y-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="space-y-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-2xl border border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                    <Skeleton className="h-2.5 w-14 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

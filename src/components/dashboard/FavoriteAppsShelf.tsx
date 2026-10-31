import type { Doc } from '../../../convex/_generated/dataModel'

export interface FavoriteAppsShelfProps {
  apps: Doc<'apps'>[]
  onSelectApp?: (appId: Doc<'apps'>['_id']) => void
}

export default function FavoriteAppsShelf({
  apps,
  onSelectApp,
}: FavoriteAppsShelfProps) {
  // Take top 4 featured or highest craftScore apps
  const top4Apps = [...apps]
    .sort((a, b) => b.craftScore - a.craftScore)
    .slice(0, 4)

  if (top4Apps.length === 0) return null

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Favorite 4 Software
        </h3>
        <span className="text-[11px] font-semibold text-neutral-400">
          Craft Hall of Fame
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {top4Apps.map((app) => {
          const isLgtm = app.craftScore >= 90 && app.utilityScore >= 80
          const isMixed = !isLgtm && (app.craftScore >= 70 || app.utilityScore >= 70)
          
          return (
            <div
              key={app._id}
              onClick={() => onSelectApp?.(app._id)}
              className="group relative rounded-2xl bg-white border border-black/10 p-4 shadow-2xs hover:shadow-md hover:border-black/20 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              {/* Header: App icon + Name */}
              <div className="flex items-center gap-3 mb-4">
                {app.mediaUrl ? (
                  <img
                    src={app.mediaUrl}
                    alt={app.name}
                    referrerPolicy="no-referrer"
                    className="size-10 rounded-xl object-cover border border-black/5 bg-desk shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      if (app.iconUrl) {
                        e.currentTarget.src = app.iconUrl
                      }
                    }}
                  />
                ) : app.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="size-10 rounded-xl object-contain border border-black/5 bg-desk shrink-0 shadow-2xs p-0.5 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="size-10 rounded-xl bg-desk border border-black/5 flex items-center justify-center font-black text-sm text-foreground">
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-foreground truncate group-hover:text-amber-800 transition-colors">
                      {app.name}
                    </h4>
                    {app.sourceType && app.sourceType !== 'product' && (
                      <span className="text-[9px] font-mono font-bold uppercase text-amber-800 bg-amber-500/10 px-1 py-0.2 rounded shrink-0">
                        {app.sourceType}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-neutral-500 truncate">
                    {app.sourceAuthor ? `by ${app.sourceAuthor}` : app.category}
                  </p>
                </div>
              </div>

              {/* Footer: Craft score & Mini Stamp badge */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-neutral-400">Craft</span>
                  <span className="text-sm font-black text-foreground">
                    {app.craftScore}%
                  </span>
                </div>

                {isLgtm ? (
                  <img
                    src="/assets/stamp_certified_lgtm.png"
                    alt="Certified LGTM"
                    className="w-14 rotate-[2deg] opacity-90 select-none pointer-events-none drop-shadow-2xs"
                  />
                ) : isMixed ? (
                  <img
                    src="/assets/stamp_needs_polish.png"
                    alt="Needs Polish"
                    className="w-14 rotate-[-2deg] opacity-90 select-none pointer-events-none drop-shadow-2xs"
                  />
                ) : (
                  <img
                    src="/assets/stamp_certified_rotten.png"
                    alt="Certified Rotten"
                    className="w-14 rotate-[3deg] opacity-90 select-none pointer-events-none drop-shadow-2xs"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

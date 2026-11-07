import { v } from 'convex/values'
import { query } from './_generated/server'

// Pioneer Interface Critics used as curated suggestions & synthetic profiles
const PIONEER_CRITICS = [
  {
    handle: 'subgrid_sorcerer',
    displayName: 'Marcus Vance',
    role: 'Staff Frontend Engineer',
    badge: 'Founding Critic',
    criticNumber: 14,
  },
  {
    handle: 'pixel_snob',
    displayName: 'Elena Rostova',
    role: 'Principal Product Designer',
    badge: 'Founding Critic',
    criticNumber: 22,
  },
  {
    handle: 'kerning_ghost',
    displayName: 'Alex Thorne',
    role: 'Verified Builder',
    badge: 'Founding Critic',
    criticNumber: 9,
  },
]

export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rawQuery = (args.query || '').trim().toLowerCase().replace(/^@/, '')
    const limit = args.limit || 8

    // If query is empty, return curated trending apps & pioneer critics for immediate instant display
    if (!rawQuery) {
      const rawApps = await ctx.db.query('apps').collect()
      const allApps = rawApps.sort((a, b) => {
        const scoreA = a.trendingScore ?? 0
        const scoreB = b.trendingScore ?? 0
        if (scoreB !== scoreA) return scoreB - scoreA
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
        return b.craftScore - a.craftScore
      })
      const allProfiles = await ctx.db.query('profiles').take(4)

      const enrichedProfiles = await Promise.all(
        allProfiles.map(async (p) => {
          let avatarUrl = p.avatarUrl
          if (p.avatarStorageId) {
            avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) || avatarUrl
          }
          return {
            _id: p._id,
            handle: p.handle,
            displayName: p.displayName,
            role: p.role,
            avatarUrl: avatarUrl || null,
            badge: p.badge,
            criticNumber: p.criticNumber,
            reviewsCount: p.reviewsCount,
          }
        }),
      )

      // Add pioneers if not already in profiles
      for (const pioneer of PIONEER_CRITICS) {
        if (!enrichedProfiles.some((p) => p.handle === pioneer.handle)) {
          enrichedProfiles.push({
            _id: `pioneer_${pioneer.handle}` as any,
            handle: pioneer.handle,
            displayName: pioneer.displayName,
            role: pioneer.role,
            avatarUrl: null,
            badge: pioneer.badge,
            criticNumber: pioneer.criticNumber,
            reviewsCount: 12,
          })
        }
      }

      return {
        isSuggestion: true,
        apps: allApps.slice(0, 6).map((app) => ({
          _id: app._id,
          name: app.name,
          slug: app.slug,
          category: app.category,
          tagline: app.tagline,
          iconUrl: app.iconUrl,
          craftScore: app.craftScore,
          utilityScore: app.utilityScore,
          status: app.status,
          sourceType: app.sourceType || 'product',
          reviewCount: app.reviewCount,
        })),
        critics: enrichedProfiles.slice(0, 6),
        reviews: [],
        totalCount: allApps.length + enrichedProfiles.length,
      }
    }

    const tokens = rawQuery.split(/\s+/).filter(Boolean)

    // Helper: compute relevance score (higher = better match)
    const computeScore = (text: string): number => {
      const lower = text.toLowerCase()
      if (lower === rawQuery) return 100 // exact match
      if (lower.startsWith(rawQuery)) return 50 // prefix match
      let score = 0
      for (const t of tokens) {
        if (lower.includes(t)) score += 10
      }
      return score
    }

    // 1. Search Apps & Digital Specimens
    const allApps = await ctx.db.query('apps').collect()
    const matchedApps = allApps
      .map((app) => {
        const text = `${app.name} ${app.slug} ${app.category} ${app.tagline} ${app.sourceAuthor || ''}`
        const score = computeScore(text)
        return { app, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ app }) => ({
        _id: app._id,
        name: app.name,
        slug: app.slug,
        category: app.category,
        tagline: app.tagline,
        iconUrl: app.iconUrl,
        craftScore: app.craftScore,
        utilityScore: app.utilityScore,
        status: app.status,
        sourceType: app.sourceType || 'product',
        reviewCount: app.reviewCount,
      }))

    // 2. Search Critics / Personas
    const allProfiles = await ctx.db.query('profiles').collect()
    const combinedCritics = [...allProfiles]

    // Include pioneer critics if query matches
    for (const pioneer of PIONEER_CRITICS) {
      if (!combinedCritics.some((p) => p.handle === pioneer.handle)) {
        combinedCritics.push({
          _id: `pioneer_${pioneer.handle}` as any,
          _creationTime: Date.now() - 86400000,
          userId: `mock_${pioneer.handle}`,
          handle: pioneer.handle,
          displayName: pioneer.displayName,
          role: pioneer.role,
          bio: 'Pioneer interface evaluator in the public consensus layer.',
          badge: pioneer.badge,
          criticNumber: pioneer.criticNumber,
          reviewsCount: 12,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now(),
        })
      }
    }

    const matchedCriticsRaw = combinedCritics
      .map((p) => {
        const text = `${p.handle} ${p.displayName} ${p.role} ${p.bio || ''}`
        const score = computeScore(text)
        return { profile: p, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const matchedCritics = await Promise.all(
      matchedCriticsRaw.map(async ({ profile: p }) => {
        let avatarUrl = p.avatarUrl
        if (p.avatarStorageId) {
          avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) || avatarUrl
        }
        return {
          _id: p._id,
          handle: p.handle,
          displayName: p.displayName,
          role: p.role,
          avatarUrl: avatarUrl || null,
          badge: p.badge,
          criticNumber: p.criticNumber,
          reviewsCount: p.reviewsCount,
        }
      }),
    )

    // 3. Search Critiques / Scorecards
    const allReviews = await ctx.db.query('reviews').take(120)
    const matchedReviewsRaw = allReviews
      .map((r) => {
        const text = `${r.headline} ${r.quote} ${r.authorHandle} ${r.authorDisplayName} ${r.featureName || ''}`
        const score = computeScore(text)
        return { review: r, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const matchedReviews = await Promise.all(
      matchedReviewsRaw.map(async ({ review: r }) => {
        const app = await ctx.db.get(r.appId)
        return {
          _id: r._id,
          appId: r.appId,
          appName: app?.name || 'Software',
          appSlug: app?.slug || '',
          appIconUrl: app?.iconUrl || '',
          authorHandle: r.authorHandle,
          authorDisplayName: r.authorDisplayName,
          headline: r.headline,
          quote: r.quote.slice(0, 140),
          craftScore: r.craftScore,
          utilityScore: r.utilityScore,
          verdict: r.verdict,
          createdAt: r.createdAt,
        }
      }),
    )

    return {
      isSuggestion: false,
      apps: matchedApps,
      critics: matchedCritics,
      reviews: matchedReviews,
      totalCount: matchedApps.length + matchedCritics.length + matchedReviews.length,
    }
  },
})

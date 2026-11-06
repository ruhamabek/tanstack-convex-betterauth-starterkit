import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'
import { normalizeAppIcon } from './apps'
import type { Id, Doc } from './_generated/dataModel'

function computeVerdict(craft: number, utility: number): string {
  if (craft >= 90 && utility >= 80) {
    return 'lgtm'
  }
  if (craft >= 70 || utility >= 70) {
    return 'mixed'
  }
  return 'rotten'
}

function computeAppStatus(craft: number, utility: number): string {
  if (craft >= 90 && utility >= 80) {
    return 'Certified LGTM'
  }
  if (craft < 70 && utility >= 75) {
    return 'Bloated'
  }
  if (craft >= 70 || utility >= 70) {
    return 'Needs Polish'
  }
  return 'Rotten'
}

// Helper to enrich a review with storage URLs, app info, social reaction metrics, and parent quote review
async function enrichReview(ctx: any, review: Doc<'reviews'>, currentUserId: string | null) {
  let app = await ctx.db.get(review.appId)
  if (app) {
    app = normalizeAppIcon(app)
  }
  let mediaUrl = review.mediaUrl
  if (!mediaUrl && review.mediaStorageId) {
    mediaUrl = (await ctx.storage.getUrl(review.mediaStorageId)) || undefined
  }
  let appMediaUrl = app?.mediaUrl
  if (!appMediaUrl && app?.mediaStorageId) {
    appMediaUrl = (await ctx.storage.getUrl(app.mediaStorageId)) || undefined
  }

  // Look up author's profile to resolve custom avatar
  let authorProfile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q: any) => q.eq('userId', review.userId))
    .first()

  if (!authorProfile && review.authorHandle) {
    authorProfile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q: any) => q.eq('handle', review.authorHandle))
      .first()
  }

  // Social interactions
  const reactions = await ctx.db
    .query('reviewReactions')
    .withIndex('by_review', (q: any) => q.eq('reviewId', review._id))
    .collect()

  const comments = await ctx.db
    .query('reviewComments')
    .withIndex('by_review', (q: any) => q.eq('reviewId', review._id))
    .collect()

  const bookmarks = await ctx.db
    .query('reviewBookmarks')
    .withIndex('by_review', (q: any) => q.eq('reviewId', review._id))
    .collect()

  const isEndorsed = currentUserId ? reactions.some((r: any) => r.userId === currentUserId) : false
  const isBookmarked = currentUserId ? bookmarks.some((b: any) => b.userId === currentUserId) : false

  // Parent review resolution if counter-appraisal / quote critique
  let parentReview = null
  if (review.parentReviewId) {
    const parent = await ctx.db.get(review.parentReviewId)
    if (parent) {
      let parentApp = await ctx.db.get(parent.appId)
      if (parentApp) {
        parentApp = normalizeAppIcon(parentApp)
      }
      let parentProfile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q: any) => q.eq('userId', parent.userId))
        .first()
      if (!parentProfile && parent.authorHandle) {
        parentProfile = await ctx.db
          .query('profiles')
          .withIndex('by_handle', (q: any) => q.eq('handle', parent.authorHandle))
          .first()
      }
      parentReview = {
        ...parent,
        app: parentApp,
        authorAvatarUrl: parentProfile?.avatarUrl || null,
      }
    }
  }

  return {
    ...review,
    authorAvatarUrl: authorProfile?.avatarUrl || null,
    mediaUrl,
    app: app ? { ...app, mediaUrl: appMediaUrl } : null,
    endorseCount: reactions.length,
    commentCount: comments.length,
    bookmarkCount: bookmarks.length,
    isEndorsed,
    isBookmarked,
    parentReview,
  }
}

export const listCommunityFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    const limit = args.limit || 80
    const reviews = await ctx.db
      .query('reviews')
      .order('desc')
      .take(limit)

    const enriched = await Promise.all(
      reviews.map((r) => enrichReview(ctx, r, currentUserId))
    )

    return enriched
  },
})

export const listByApp = query({
  args: {
    appId: v.optional(v.id('apps')),
    slug: v.optional(v.string()),
    surface: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    let targetAppId = args.appId

    if (!targetAppId && args.slug) {
      const cleanSlug = args.slug.trim().toLowerCase()
      let app = await ctx.db
        .query('apps')
        .withIndex('by_slug', (q) => q.eq('slug', cleanSlug))
        .first()

      if (!app) {
        const allApps = await ctx.db.query('apps').collect()
        app =
          allApps.find(
            (a) =>
              a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug ||
              a.name.toLowerCase() === cleanSlug,
          ) || null
      }

      if (app) {
        targetAppId = app._id
      }
    }

    if (!targetAppId) return []

    let reviews = await ctx.db
      .query('reviews')
      .withIndex('by_app', (q) => q.eq('appId', targetAppId!))
      .collect()

    if (args.surface && args.surface !== 'all') {
      if (args.surface === 'Overall Experience') {
        reviews = reviews.filter(
          (r) => !r.featureName || r.featureName.trim() === 'Overall Experience',
        )
      } else {
        reviews = reviews.filter((r) => r.featureName === args.surface)
      }
    }

    const enriched = await Promise.all(
      reviews.map((r) => enrichReview(ctx, r, currentUserId)),
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getReviewById = query({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    const review = await ctx.db.get(args.reviewId)
    if (!review) return null

    return await enrichReview(ctx, review, currentUserId)
  },
})

export const listByUser = query({
  args: {
    userId: v.optional(v.string()),
    handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    let targetUserId = args.userId

    if (args.handle) {
      const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
        .first()
      if (!profile) {
        return []
      }
      targetUserId = profile.userId
    } else if (!targetUserId) {
      if (!user) {
        return []
      }
      targetUserId = String(user._id)
    }

    let reviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('userId', targetUserId!))
      .collect()

    // Resilient fallback for demo accounts before profile linking completes
    if (reviews.length === 0) {
      let handle = args.handle
      if (!handle) {
        let profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', targetUserId!))
          .first()
        if (!profile && user?.email) {
          const emailLower = user.email.toLowerCase()
          const EMAIL_TO_HANDLE: Record<string, string> = {
            'marcus@screenlog.dev': 'subgrid_sorcerer',
            'elena@screenlog.dev': 'pixel_snob',
            'alex@screenlog.dev': 'kerning_ghost',
            'sarah@screenlog.dev': 'motion_curator',
            'bananas@screenlog.dev': 'bananas',
          }
          const targetHandle = EMAIL_TO_HANDLE[emailLower] || emailLower.split('@')[0]
          profile = await ctx.db
            .query('profiles')
            .withIndex('by_handle', (q) => q.eq('handle', targetHandle))
            .first()
        }
        if (profile) {
          handle = profile.handle
        }
      }

      if (handle) {
        const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '')
        reviews = await ctx.db
          .query('reviews')
          .filter((q) => q.eq(q.field('authorHandle'), cleanHandle))
          .collect()
      }
    }

    // Enrich with app details, storage URLs, and social counters
    const enriched = await Promise.all(
      reviews.map((r) => enrichReview(ctx, r, currentUserId))
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listBookmarked = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) {
      return []
    }
    const currentUserId = String(user._id)

    const bookmarks = await ctx.db
      .query('reviewBookmarks')
      .withIndex('by_user', (q) => q.eq('userId', currentUserId))
      .order('desc')
      .collect()

    const enrichedReviews = await Promise.all(
      bookmarks.map(async (b) => {
        const review = await ctx.db.get(b.reviewId)
        if (!review) return null
        return await enrichReview(ctx, review, currentUserId)
      }),
    )

    return enrichedReviews.filter(Boolean) as NonNullable<(typeof enrichedReviews)[number]>[]
  },
})

export const getMyReviewForApp = query({
  args: {
    appId: v.id('apps'),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) {
      return null
    }

    const userId = String(user._id)
    return await ctx.db
      .query('reviews')
      .withIndex('by_app_and_user', (q) =>
        q.eq('appId', args.appId).eq('userId', userId)
      )
      .first()
  },
})

export const submitReview = mutation({
  args: {
    appId: v.id('apps'),
    craftScore: v.number(),
    utilityScore: v.number(),
    headline: v.string(),
    quote: v.string(),
    parentReviewId: v.optional(v.id('reviews')),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    // Verify user has set up their critic profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Please set up your Critic Pseudonym before submitting a review.')
    }

    // Validate scores
    const craft = Math.min(100, Math.max(0, Math.round(args.craftScore)))
    const utility = Math.min(100, Math.max(0, Math.round(args.utilityScore)))

    const headline = args.headline.trim()
    if (!headline || headline.length > 80) {
      throw new Error('Headline must be between 1 and 80 characters.')
    }

    const quote = args.quote.trim()
    if (!quote || quote.length > 400) {
      throw new Error('Critique must be between 1 and 400 characters.')
    }

    const verdict = computeVerdict(craft, utility)
    const now = Date.now()

    // Check if user already reviewed this app
    const existing = await ctx.db
      .query('reviews')
      .withIndex('by_app_and_user', (q) =>
        q.eq('appId', args.appId).eq('userId', userId)
      )
      .first()

    let reviewId: Id<'reviews'>

    if (existing) {
      await ctx.db.patch(existing._id, {
        craftScore: craft,
        utilityScore: utility,
        headline,
        quote,
        verdict,
        parentReviewId: args.parentReviewId !== undefined ? args.parentReviewId : existing.parentReviewId,
        authorHandle: profile.handle,
        authorDisplayName: profile.displayName,
        authorRole: profile.role,
        updatedAt: now,
      })
      reviewId = existing._id
    } else {
      reviewId = await ctx.db.insert('reviews', {
        appId: args.appId,
        userId,
        authorHandle: profile.handle,
        authorDisplayName: profile.displayName,
        authorRole: profile.role,
        craftScore: craft,
        utilityScore: utility,
        headline,
        quote,
        verdict,
        parentReviewId: args.parentReviewId,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      })

      // Send quote notification to parent review author
      if (args.parentReviewId) {
        const parentReview = await ctx.db.get(args.parentReviewId)
        if (parentReview && parentReview.userId !== userId) {
          const app = await ctx.db.get(args.appId)
          await ctx.db.insert('notifications', {
            userId: parentReview.userId,
            actorUserId: userId,
            actorHandle: profile.handle,
            actorDisplayName: profile.displayName,
            actorAvatarUrl: profile.avatarUrl,
            type: 'quote',
            reviewId,
            appName: app?.name,
            appIconUrl: app?.iconUrl,
            previewText: headline,
            read: false,
            createdAt: now,
          })
        }
      }

      // Increment profile review count and update credential tier
      const newReviewsCount = (profile.reviewsCount || 0) + 1
      const isGenesis = (profile.criticNumber ?? 1) <= 500
      const updatedBadge = isGenesis
        ? 'Founding Critic'
        : (newReviewsCount >= 10 ? 'Verified Critic' : profile.badge || 'Critic')

      await ctx.db.patch(profile._id, {
        reviewsCount: newReviewsCount,
        badge: updatedBadge,
        updatedAt: now,
      })
    }

    // Recalculate app aggregate scores
    const allReviews = await ctx.db
      .query('reviews')
      .withIndex('by_app', (q) => q.eq('appId', args.appId))
      .collect()

    const totalCraft = allReviews.reduce((sum, r) => sum + r.craftScore, 0)
    const totalUtility = allReviews.reduce((sum, r) => sum + r.utilityScore, 0)
    const reviewCount = allReviews.length

    const avgCraft = Math.round(totalCraft / reviewCount)
    const avgUtility = Math.round(totalUtility / reviewCount)
    const status = computeAppStatus(avgCraft, avgUtility)

    await ctx.db.patch(args.appId, {
      craftScore: avgCraft,
      utilityScore: avgUtility,
      reviewCount,
      status,
    })

    return {
      reviewId,
      verdict,
      avgCraft,
      avgUtility,
      status,
    }
  },
})

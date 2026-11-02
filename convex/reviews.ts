import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'
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
  const app = await ctx.db.get(review.appId)
  let mediaUrl = review.mediaUrl
  if (!mediaUrl && review.mediaStorageId) {
    mediaUrl = (await ctx.storage.getUrl(review.mediaStorageId)) || undefined
  }
  let appMediaUrl = app?.mediaUrl
  if (!appMediaUrl && app?.mediaStorageId) {
    appMediaUrl = (await ctx.storage.getUrl(app.mediaStorageId)) || undefined
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
      const parentApp = await ctx.db.get(parent.appId)
      parentReview = {
        ...parent,
        app: parentApp,
      }
    }
  }

  return {
    ...review,
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

export const listByApp = query({
  args: {
    appId: v.id('apps'),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_app', (q) => q.eq('appId', args.appId))
      .collect()

    const enriched = await Promise.all(
      reviews.map((r) => enrichReview(ctx, r, currentUserId))
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listByUser = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null

    let targetUserId = args.userId
    if (!targetUserId) {
      if (!user) {
        return []
      }
      targetUserId = String(user._id)
    }

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('userId', targetUserId!))
      .collect()

    // Enrich with app details, storage URLs, and social counters
    const enriched = await Promise.all(
      reviews.map((r) => enrichReview(ctx, r, currentUserId))
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
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

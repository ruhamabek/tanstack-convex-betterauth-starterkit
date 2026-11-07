import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { normalizeAppIcon } from './apps'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// Event weights for engagement actions
const WEIGHTS = {
  PRIMARY_REVIEW: 12,
  COUNTER_APPRAISAL_QUOTE: 25, // Quoted take sparks active community debate
  DISCUSSION_COMMENT: 4,
  ENDORSEMENT_HEART: 2,
  BOOKMARK_SAVE: 3,
  SPECIMEN_LAUNCH: 15,
}

// Hacker News / Reddit-style time-decay gravity function
function computeTimeDecay(timestamp: number, now: number): number {
  const elapsedHours = Math.max(0, (now - timestamp) / (1000 * 60 * 60))
  // G = 1.5 gravity curve with +2 hour softening constant
  return 1 / Math.pow(elapsedHours + 2, 1.5)
}

/**
 * Core mathematical calculation of an app's trending velocity score.
 */
export async function calculateAppTrendingScore(
  ctx: any,
  app: Doc<'apps'>,
  now: number = Date.now(),
) {
  const windowStart = now - SEVEN_DAYS_MS

  // 1. Fetch reviews created in the 7-day window
  const recentReviews: Doc<'reviews'>[] = await ctx.db
    .query('reviews')
    .withIndex('by_app_and_created_at', (q: any) =>
      q.eq('appId', app._id).gte('createdAt', windowStart),
    )
    .collect()

  let rawScore = 0
  let totalComments = 0
  let totalReactions = 0
  let totalQuotes = 0

  // If the specimen/app itself was published in the past 7 days, add fresh launch momentum
  if (app.createdAt >= windowStart) {
    const launchDecay = computeTimeDecay(app.createdAt, now)
    rawScore += WEIGHTS.SPECIMEN_LAUNCH * launchDecay * 8
  }

  // 2. Score each recent review and its engagement
  for (const review of recentReviews) {
    const reviewDecay = computeTimeDecay(review.createdAt, now)
    const isQuoteTake = Boolean(review.parentReviewId)

    if (isQuoteTake) {
      totalQuotes += 1
      rawScore += WEIGHTS.COUNTER_APPRAISAL_QUOTE * reviewDecay * 10
    } else {
      rawScore += WEIGHTS.PRIMARY_REVIEW * reviewDecay * 10
    }

    // Comments on this review within the rolling window
    const comments: Doc<'reviewComments'>[] = await ctx.db
      .query('reviewComments')
      .withIndex('by_review', (q: any) => q.eq('reviewId', review._id))
      .filter((q: any) => q.gte(q.field('createdAt'), windowStart))
      .collect()

    totalComments += comments.length
    for (const comment of comments) {
      const commentDecay = computeTimeDecay(comment.createdAt, now)
      rawScore += WEIGHTS.DISCUSSION_COMMENT * commentDecay * 6
    }

    // Endorsements on this review within the rolling window
    const reactions: Doc<'reviewReactions'>[] = await ctx.db
      .query('reviewReactions')
      .withIndex('by_review', (q: any) => q.eq('reviewId', review._id))
      .filter((q: any) => q.gte(q.field('createdAt'), windowStart))
      .collect()

    totalReactions += reactions.length
    for (const reaction of reactions) {
      const reactionDecay = computeTimeDecay(reaction.createdAt, now)
      rawScore += WEIGHTS.ENDORSEMENT_HEART * reactionDecay * 4
    }
  }

  // 3. Polarization & Debate Multiplier
  // Dribbble Dilemma: when craft and utility diverge by >= 25%, debates rage
  const divergence = Math.abs(app.craftScore - app.utilityScore)
  let polarizationMultiplier = 1.0
  if (divergence >= 30) {
    polarizationMultiplier = 1.25 // Highly polarized aesthetic vs utility split
  } else if (divergence >= 20) {
    polarizationMultiplier = 1.15
  }

  // 4. Certified Craft Quality Bonus (Elite standard)
  let qualityMultiplier = 1.0
  if (app.craftScore >= 90 && app.utilityScore >= 80) {
    qualityMultiplier = 1.2 // Certified LGTM prestige boost
  }

  // 5. Calculate final normalized trending score
  const recentActivityCount =
    recentReviews.length + totalQuotes + totalComments + totalReactions

  let finalScore =
    rawScore * polarizationMultiplier * qualityMultiplier

  // Baseline legacy momentum: add small baseline so established apps with high craft don't zero out completely
  if (app.reviewCount > 0) {
    const baselineScore = Math.min(25, app.reviewCount * 1.5) * (app.craftScore / 100)
    finalScore += baselineScore
  }

  finalScore = Math.round(finalScore * 10) / 10

  const isHot = finalScore >= 20 || recentReviews.length >= 2 || totalQuotes >= 1
  const isDebated = totalQuotes >= 1 || divergence >= 30 || totalComments >= 3

  return {
    trendingScore: finalScore,
    recentReviewCount: recentReviews.length,
    recentActivityCount,
    isHot,
    isDebated,
  }
}

/**
 * Recalculates and patches trending stats for a single app.
 */
export async function recalculateAppTrending(ctx: any, appId: Id<'apps'>) {
  const app = await ctx.db.get(appId)
  if (!app) return null

  const stats = await calculateAppTrendingScore(ctx, app)
  await ctx.db.patch(appId, {
    trendingScore: stats.trendingScore,
    recentReviewCount: stats.recentReviewCount,
    recentActivityCount: stats.recentActivityCount,
  })

  return stats
}

/**
 * Scheduled or manually invoked batch recalculation of all apps.
 * Updates trending scores according to the time-decay gravity curve.
 */
export const recalculateAllTrendingScores = mutation({
  args: {},
  handler: async (ctx) => {
    const rawApps = await ctx.db.query('apps').collect()
    const now = Date.now()
    const results = []

    for (const app of rawApps) {
      const stats = await calculateAppTrendingScore(ctx, app, now)
      await ctx.db.patch(app._id, {
        trendingScore: stats.trendingScore,
        recentReviewCount: stats.recentReviewCount,
        recentActivityCount: stats.recentActivityCount,
      })
      results.push({
        appId: app._id,
        name: app.name,
        slug: app.slug,
        trendingScore: stats.trendingScore,
        recentTakes: stats.recentReviewCount,
      })
    }

    return {
      updatedCount: results.length,
      timestamp: now,
      topTrending: results.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 5),
    }
  },
})

/**
 * Mutation to refresh a single app's score after a new review or critique is filed.
 */
export const refreshSingleAppTrending = mutation({
  args: {
    appId: v.id('apps'),
  },
  handler: async (ctx, args) => {
    return await recalculateAppTrending(ctx, args.appId)
  },
})

/**
 * Production-ready trending query with velocity metrics, time-decay scoring,
 * and high-fidelity fallback to all-time craft consensus.
 */
export const listTrending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 4
    const rawApps = await ctx.db.query('apps').collect()

    if (rawApps.length === 0) {
      return []
    }

    const apps = rawApps.map(normalizeAppIcon)

    // Sort primarily by computed trendingScore descending,
    // breaking ties with reviewCount descending, then craftScore descending
    const sorted = apps.sort((a, b) => {
      const scoreA = a.trendingScore ?? 0
      const scoreB = b.trendingScore ?? 0
      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount
      }
      return b.craftScore - a.craftScore
    })

    return sorted.slice(0, limit).map((app) => {
      const recentTakes = app.recentReviewCount ?? 0
      const score = app.trendingScore ?? 0
      const isHot = score >= 20 || recentTakes >= 2
      const isDebated =
        Math.abs(app.craftScore - app.utilityScore) >= 25 ||
        (app.recentActivityCount ?? 0) >= 3

      // Human-readable velocity label
      let velocityLabel = `${app.reviewCount} ${app.reviewCount === 1 ? 'take' : 'takes'}`
      if (recentTakes > 0) {
        velocityLabel = `${recentTakes} ${recentTakes === 1 ? 'take' : 'takes'} this week`
      }

      return {
        _id: app._id,
        name: app.name,
        slug: app.slug,
        category: app.category,
        iconUrl: app.iconUrl,
        craftScore: app.craftScore,
        utilityScore: app.utilityScore,
        status: app.status,
        reviewCount: app.reviewCount,
        trendingScore: score,
        recentTakesCount: recentTakes,
        recentActivityCount: app.recentActivityCount ?? 0,
        isHot,
        isDebated,
        velocityLabel,
      }
    })
  },
})

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'

export const toggleEndorse = mutation({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    const existing = await ctx.db
      .query('reviewReactions')
      .withIndex('by_review_and_user', (q) =>
        q.eq('reviewId', args.reviewId).eq('userId', userId)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert('reviewReactions', {
        reviewId: args.reviewId,
        userId,
        type: 'endorse',
        createdAt: Date.now(),
      })
    }

    const allReactions = await ctx.db
      .query('reviewReactions')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect()

    return {
      endorsed: !existing,
      count: allReactions.length,
    }
  },
})

export const toggleBookmark = mutation({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    const existing = await ctx.db
      .query('reviewBookmarks')
      .withIndex('by_review_and_user', (q) =>
        q.eq('reviewId', args.reviewId).eq('userId', userId)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { bookmarked: false }
    } else {
      await ctx.db.insert('reviewBookmarks', {
        reviewId: args.reviewId,
        userId,
        createdAt: Date.now(),
      })
      return { bookmarked: true }
    }
  },
})

export const listComments = query({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('reviewComments')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect()

    const enriched = await Promise.all(
      comments.map(async (c) => {
        let profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q: any) => q.eq('userId', c.userId))
          .first()
        if (!profile && c.authorHandle) {
          profile = await ctx.db
            .query('profiles')
            .withIndex('by_handle', (q: any) => q.eq('handle', c.authorHandle))
            .first()
        }
        return {
          ...c,
          authorAvatarUrl: profile?.avatarUrl || null,
        }
      }),
    )

    return enriched.sort((a, b) => a.createdAt - b.createdAt)
  },
})

export const addComment = mutation({
  args: {
    reviewId: v.id('reviews'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    // Verify user has set up a profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Please set up your Critic Pseudonym before participating in discussions.')
    }

    const cleanContent = args.content.trim()
    if (!cleanContent || cleanContent.length > 500) {
      throw new Error('Comment must be between 1 and 500 characters.')
    }

    const commentId = await ctx.db.insert('reviewComments', {
      reviewId: args.reviewId,
      userId,
      authorHandle: profile.handle,
      authorDisplayName: profile.displayName,
      authorRole: profile.role,
      authorBadge: profile.badge,
      content: cleanContent,
      createdAt: Date.now(),
    })

    return commentId
  },
})

export const getSocialStatus = query({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const userId = user ? String(user._id) : null

    const reactions = await ctx.db
      .query('reviewReactions')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect()

    const comments = await ctx.db
      .query('reviewComments')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect()

    const bookmarks = await ctx.db
      .query('reviewBookmarks')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect()

    const isEndorsed = userId
      ? reactions.some((r) => r.userId === userId)
      : false

    const isBookmarked = userId
      ? bookmarks.some((b) => b.userId === userId)
      : false

    return {
      isEndorsed,
      isBookmarked,
      endorseCount: reactions.length,
      commentCount: comments.length,
      bookmarkCount: bookmarks.length,
    }
  },
})

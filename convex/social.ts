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

      // Send endorse notification to review author
      const review = await ctx.db.get(args.reviewId)
      if (review && review.userId !== userId) {
        const userProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .first()
        const app = await ctx.db.get(review.appId)

        await ctx.db.insert('notifications', {
          userId: review.userId,
          actorUserId: userId,
          actorHandle: userProfile?.handle || 'critic',
          actorDisplayName: userProfile?.displayName || user.name || 'A Critic',
          actorAvatarUrl: userProfile?.avatarUrl,
          type: 'endorse',
          reviewId: args.reviewId,
          appName: app?.name,
          appIconUrl: app?.iconUrl,
          previewText: review.headline,
          read: false,
          createdAt: Date.now(),
        })
      }
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

        let authorAvatarUrl = profile?.avatarUrl || null
        if (profile?.avatarStorageId) {
          authorAvatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) || authorAvatarUrl
        }

        return {
          ...c,
          authorAvatarUrl,
          authorDisplayName: profile?.displayName || c.authorDisplayName,
          authorRole: profile?.role || c.authorRole,
          authorBadge: profile?.badge || c.authorBadge,
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
    parentCommentId: v.optional(v.id('reviewComments')),
    replyToHandle: v.optional(v.string()),
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

    let parentComment = null
    if (args.parentCommentId) {
      parentComment = await ctx.db.get(args.parentCommentId)
      if (!parentComment || parentComment.reviewId !== args.reviewId) {
        throw new Error('Parent comment not found in this discussion.')
      }
    }

    const commentId = await ctx.db.insert('reviewComments', {
      reviewId: args.reviewId,
      userId,
      authorHandle: profile.handle,
      authorDisplayName: profile.displayName,
      authorRole: profile.role,
      authorBadge: profile.badge,
      content: cleanContent,
      parentCommentId: args.parentCommentId,
      replyToHandle: parentComment ? parentComment.authorHandle : args.replyToHandle,
      createdAt: Date.now(),
    })

    const review = await ctx.db.get(args.reviewId)
    const app = review ? await ctx.db.get(review.appId) : null
    const now = Date.now()

    // 1. If replying to another comment, notify the parent comment's author
    if (parentComment && parentComment.userId !== userId) {
      await ctx.db.insert('notifications', {
        userId: parentComment.userId,
        actorUserId: userId,
        actorHandle: profile.handle,
        actorDisplayName: profile.displayName,
        actorAvatarUrl: profile.avatarUrl,
        type: 'reply',
        reviewId: args.reviewId,
        commentId,
        targetHandle: parentComment.authorHandle,
        appName: app?.name,
        appIconUrl: app?.iconUrl,
        previewText: cleanContent.slice(0, 140),
        read: false,
        createdAt: now,
      })
    }

    // 2. Notify review author if they are not the replier and not the parent comment author
    if (
      review &&
      review.userId !== userId &&
      (!parentComment || parentComment.userId !== review.userId)
    ) {
      await ctx.db.insert('notifications', {
        userId: review.userId,
        actorUserId: userId,
        actorHandle: profile.handle,
        actorDisplayName: profile.displayName,
        actorAvatarUrl: profile.avatarUrl,
        type: args.parentCommentId ? 'reply' : 'comment',
        reviewId: args.reviewId,
        commentId,
        targetHandle: review.authorHandle,
        appName: app?.name,
        appIconUrl: app?.iconUrl,
        previewText: cleanContent.slice(0, 140),
        read: false,
        createdAt: now,
      })
    }

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

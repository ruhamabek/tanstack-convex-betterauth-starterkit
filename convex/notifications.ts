import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) return []

    const currentUserId = String(user._id)
    const limit = args.limit || 50

    const rawNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', currentUserId))
      .order('desc')
      .take(limit)

    // Enrich with latest actor profiles
    const enriched = await Promise.all(
      rawNotifications.map(async (n) => {
        let actorProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q: any) => q.eq('userId', n.actorUserId))
          .first()

        if (!actorProfile && n.actorHandle) {
          actorProfile = await ctx.db
            .query('profiles')
            .withIndex('by_handle', (q: any) => q.eq('handle', n.actorHandle))
            .first()
        }

        return {
          ...n,
          actorDisplayName: actorProfile?.displayName || n.actorDisplayName,
          actorHandle: actorProfile?.handle || n.actorHandle,
          actorAvatarUrl: actorProfile?.avatarUrl || n.actorAvatarUrl,
          actorBadge: actorProfile?.badge,
          actorCriticNumber: actorProfile?.criticNumber,
        }
      }),
    )

    return enriched
  },
})

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) return 0

    const currentUserId = String(user._id)

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read', (q) =>
        q.eq('userId', currentUserId).eq('read', false),
      )
      .collect()

    return unread.length
  },
})

export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const currentUserId = String(user._id)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== currentUserId) {
      return
    }

    if (!notification.read) {
      await ctx.db.patch(args.notificationId, { read: true })
    }
  },
})

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx)
    const currentUserId = String(user._id)

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read', (q) =>
        q.eq('userId', currentUserId).eq('read', false),
      )
      .collect()

    for (const item of unread) {
      await ctx.db.patch(item._id, { read: true })
    }

    return { markedCount: unread.length }
  },
})

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx)
    const currentUserId = String(user._id)

    const all = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', currentUserId))
      .collect()

    for (const item of all) {
      await ctx.db.delete(item._id)
    }

    return { clearedCount: all.length }
  },
})

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'

export const toggleFollow = mutation({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const currentUserId = String(user._id)
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    // Fetch current user's profile
    const currentProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', currentUserId))
      .first()

    if (currentProfile && currentProfile.handle.toLowerCase() === cleanHandle) {
      throw new Error('You cannot follow yourself.')
    }

    // Verify target critic profile exists, or create a founding critic stub if from consensus reviews/known critics
    let targetProfile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (!targetProfile) {
      const allProfiles = await ctx.db.query('profiles').collect()
      const criticNumber = allProfiles.length + 1

      // Look for a review authored by this handle
      const reviewByHandle = await ctx.db
        .query('reviews')
        .filter((q) => q.eq(q.field('authorHandle'), cleanHandle))
        .first()

      const displayName =
        cleanHandle === 'subgrid_sorcerer'
          ? 'Marcus Vance'
          : cleanHandle === 'pixel_snob'
            ? 'Elena Rostova'
            : cleanHandle === 'kerning_ghost'
              ? 'Alex Thorne'
              : cleanHandle
                  .split('_')
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')

      const role =
        cleanHandle === 'subgrid_sorcerer'
          ? 'Staff Frontend Engineer'
          : cleanHandle === 'pixel_snob'
            ? 'Principal Product Designer'
            : cleanHandle === 'kerning_ghost'
              ? 'Verified Builder'
              : 'Interface Critic'

      const bio =
        cleanHandle === 'subgrid_sorcerer'
          ? 'Measuring subgrid rhythm, layout shift, and tactile interactive microcopy.'
          : cleanHandle === 'pixel_snob'
            ? 'Cynical about border-radius, obsessed with typography weight hierarchies.'
            : cleanHandle === 'kerning_ghost'
              ? 'Audit of font rendering engines and macOS native desktop feel.'
              : 'Software evaluator & interface critic in the public consensus layer.'

      const newId = await ctx.db.insert('profiles', {
        userId: reviewByHandle?.userId || `seed_${cleanHandle}`,
        handle: cleanHandle,
        displayName,
        role,
        bio,
        badge: criticNumber <= 100 ? 'Founding Critic' : 'Critic',
        criticNumber,
        reviewsCount: reviewByHandle ? 1 : 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      targetProfile = await ctx.db.get(newId)
    }

    // Check if already following
    const existing = await ctx.db
      .query('follows')
      .withIndex('by_follower_and_handle', (q) =>
        q.eq('followerUserId', currentUserId).eq('followingHandle', cleanHandle),
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { isFollowing: false }
    } else {
      await ctx.db.insert('follows', {
        followerUserId: currentUserId,
        followingHandle: cleanHandle,
        createdAt: Date.now(),
      })

      // Send follow notification to target critic
      if (targetProfile && targetProfile.userId && targetProfile.userId !== currentUserId) {
        await ctx.db.insert('notifications', {
          userId: targetProfile.userId,
          actorUserId: currentUserId,
          actorHandle: currentProfile?.handle || 'critic',
          actorDisplayName: currentProfile?.displayName || user.name || 'A Critic',
          actorAvatarUrl: currentProfile?.avatarUrl,
          type: 'follow',
          targetHandle: cleanHandle,
          read: false,
          createdAt: Date.now(),
        })
      }

      return { isFollowing: true }
    }
  },
})

export const isFollowing = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) return false

    const currentUserId = String(user._id)
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    const existing = await ctx.db
      .query('follows')
      .withIndex('by_follower_and_handle', (q) =>
        q.eq('followerUserId', currentUserId).eq('followingHandle', cleanHandle),
      )
      .first()

    return Boolean(existing)
  },
})

export const getFollowStats = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    // Followers of this handle
    const followers = await ctx.db
      .query('follows')
      .withIndex('by_following_handle', (q) => q.eq('followingHandle', cleanHandle))
      .collect()

    // Who this critic follows (requires their userId)
    let followingCount = 0
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (profile) {
      let following = await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerUserId', profile.userId))
        .collect()

      if (following.length === 0) {
        const DEMO_USER_IDS: Record<string, string> = {
          subgrid_sorcerer: 'user_marcus_vance',
          pixel_snob: 'user_elena_rostova',
          kerning_ghost: 'user_alex_thorne',
          motion_curator: 'user_sarah_lin',
          bananas: 'user_bananas',
        }
        const defaultId = DEMO_USER_IDS[cleanHandle]
        if (defaultId && defaultId !== profile.userId) {
          const fallbackFollowing = await ctx.db
            .query('follows')
            .withIndex('by_follower', (q) => q.eq('followerUserId', defaultId))
            .collect()
          if (fallbackFollowing.length > 0) {
            following = fallbackFollowing
          }
        }
      }

      followingCount = following.length
    }

    return {
      followersCount: followers.length,
      followingCount,
    }
  },
})

export const getMyFollowingHandles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) return []

    const currentUserId = String(user._id)
    let follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerUserId', currentUserId))
      .collect()

    if (follows.length === 0 && user.email) {
      const emailLower = user.email.toLowerCase()
      const EMAIL_TO_DEFAULT_ID: Record<string, string> = {
        'marcus@screenlog.dev': 'user_marcus_vance',
        'elena@screenlog.dev': 'user_elena_rostova',
        'alex@screenlog.dev': 'user_alex_thorne',
        'sarah@screenlog.dev': 'motion_curator',
        'bananas@screenlog.dev': 'user_bananas',
      }
      const defaultId = EMAIL_TO_DEFAULT_ID[emailLower]
      if (defaultId) {
        follows = await ctx.db
          .query('follows')
          .withIndex('by_follower', (q) => q.eq('followerUserId', defaultId))
          .collect()
      }
    }

    return follows.map((f) => f.followingHandle)
  },
})

export const listSuggestedCritics = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null
    const limit = args.limit || 8

    let profiles = await ctx.db.query('profiles').order('desc').take(limit + 5)

    if (currentUserId) {
      profiles = profiles.filter((p) => p.userId !== currentUserId)
    }

    // If fewer than limit, also discover from author handles in consensus reviews
    if (profiles.length < limit) {
      const existingHandles = new Set(profiles.map((p) => p.handle.toLowerCase()))
      if (currentUserId) {
        const myProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', currentUserId))
          .first()
        if (myProfile) existingHandles.add(myProfile.handle.toLowerCase())
      }

      const recentReviews = await ctx.db.query('reviews').order('desc').take(30)
      for (const rev of recentReviews) {
        if (!rev.authorHandle) continue
        const cleanH = rev.authorHandle.toLowerCase().replace(/^@/, '')
        if (!existingHandles.has(cleanH)) {
          existingHandles.add(cleanH)
          profiles.push({
            _id: `synthetic_${cleanH}` as any,
            _creationTime: rev.createdAt,
            userId: rev.userId,
            handle: cleanH,
            displayName: cleanH
              .split('_')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
            role: 'Founding Interface Critic',
            badge: 'Founding Critic',
            criticNumber: profiles.length + 1,
            reviewsCount: 1,
            createdAt: rev.createdAt,
            updatedAt: rev.createdAt,
          })
          if (profiles.length >= limit) break
        }
      }

      // If still fewer than limit, add the Genesis Consortium pioneer critics
      const PIONEERS = [
        {
          handle: 'subgrid_sorcerer',
          displayName: 'Marcus Vance',
          role: 'Staff Frontend Engineer',
          bio: 'Measuring subgrid rhythm, layout shift, and tactile interactive microcopy.',
          criticNumber: 14,
        },
        {
          handle: 'pixel_snob',
          displayName: 'Elena Rostova',
          role: 'Principal Product Designer',
          bio: 'Cynical about border-radius, obsessed with typography weight hierarchies.',
          criticNumber: 22,
        },
        {
          handle: 'kerning_ghost',
          displayName: 'Alex Thorne',
          role: 'Verified Builder',
          bio: 'Audit of font rendering engines and macOS native desktop feel.',
          criticNumber: 9,
        },
      ]

      for (const p of PIONEERS) {
        if (!existingHandles.has(p.handle)) {
          existingHandles.add(p.handle)
          profiles.push({
            _id: `pioneer_${p.handle}` as any,
            _creationTime: Date.now() - 86400000,
            userId: `mock_${p.handle}`,
            handle: p.handle,
            displayName: p.displayName,
            role: p.role,
            bio: p.bio,
            badge: 'Founding Critic',
            criticNumber: p.criticNumber,
            reviewsCount: 3,
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now(),
          })
          if (profiles.length >= limit) break
        }
      }
    }

    return profiles.slice(0, limit)
  },
})

export const listFollowingByHandle = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    let profile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    // If profile not found in DB directly, look up pioneer/synthetic userId
    const targetUserId = profile?.userId || (cleanHandle.startsWith('subgrid') ? 'mock_subgrid_sorcerer' : cleanHandle)

    const followRows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerUserId', targetUserId))
      .order('desc')
      .collect()

    // Get current viewer's following set to compute isFollowing for action buttons
    let viewerFollowingHandles = new Set<string>()
    if (currentUserId) {
      const myFollows = await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerUserId', currentUserId))
        .collect()
      viewerFollowingHandles = new Set(myFollows.map((f) => f.followingHandle.toLowerCase()))
    }

    const PIONEERS: Record<string, { displayName: string; role: string; bio: string; criticNumber: number }> = {
      subgrid_sorcerer: {
        displayName: 'Marcus Vance',
        role: 'Staff Frontend Engineer',
        bio: 'Measuring subgrid rhythm, layout shift, and tactile interactive microcopy.',
        criticNumber: 14,
      },
      pixel_snob: {
        displayName: 'Elena Rostova',
        role: 'Principal Product Designer',
        bio: 'Cynical about border-radius, obsessed with typography weight hierarchies.',
        criticNumber: 22,
      },
      kerning_ghost: {
        displayName: 'Alex Thorne',
        role: 'Verified Builder',
        bio: 'Audit of font rendering engines and macOS native desktop feel.',
        criticNumber: 9,
      },
    }

    const results = []
    for (const row of followRows) {
      const h = row.followingHandle.toLowerCase()
      const followedProfile = await ctx.db
        .query('profiles')
        .withIndex('by_handle', (q) => q.eq('handle', h))
        .first()

      if (followedProfile) {
        let bannerUrl = followedProfile.bannerUrl
        if (!bannerUrl && followedProfile.bannerStorageId) {
          bannerUrl = (await ctx.storage.getUrl(followedProfile.bannerStorageId)) || undefined
        }
        results.push({
          _id: followedProfile._id,
          userId: followedProfile.userId,
          handle: followedProfile.handle,
          displayName: followedProfile.displayName,
          role: followedProfile.role,
          bio: followedProfile.bio,
          avatarUrl: followedProfile.avatarUrl,
          bannerUrl,
          badge: followedProfile.badge,
          criticNumber: followedProfile.criticNumber,
          reviewsCount: followedProfile.reviewsCount,
          isFollowing: viewerFollowingHandles.has(h),
        })
      } else if (PIONEERS[h]) {
        results.push({
          _id: `pioneer_${h}`,
          userId: `mock_${h}`,
          handle: h,
          displayName: PIONEERS[h].displayName,
          role: PIONEERS[h].role,
          bio: PIONEERS[h].bio,
          avatarUrl: undefined,
          bannerUrl: undefined,
          badge: 'Founding Critic',
          criticNumber: PIONEERS[h].criticNumber,
          reviewsCount: 3,
          isFollowing: viewerFollowingHandles.has(h),
        })
      } else {
        results.push({
          _id: `synthetic_${h}`,
          userId: `user_${h}`,
          handle: h,
          displayName: h.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          role: 'Interface Critic',
          bio: 'Software evaluator & interface critic in the public consensus layer.',
          avatarUrl: undefined,
          bannerUrl: undefined,
          badge: 'Critic',
          criticNumber: 100,
          reviewsCount: 0,
          isFollowing: viewerFollowingHandles.has(h),
        })
      }
    }

    return results
  },
})

export const listFollowersByHandle = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    const currentUserId = user ? String(user._id) : null
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    const followerRows = await ctx.db
      .query('follows')
      .withIndex('by_following_handle', (q) => q.eq('followingHandle', cleanHandle))
      .order('desc')
      .collect()

    let viewerFollowingHandles = new Set<string>()
    if (currentUserId) {
      const myFollows = await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerUserId', currentUserId))
        .collect()
      viewerFollowingHandles = new Set(myFollows.map((f) => f.followingHandle.toLowerCase()))
    }

    const results = []
    for (const row of followerRows) {
      const followerProfile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', row.followerUserId))
        .first()

      if (followerProfile) {
        let bannerUrl = followerProfile.bannerUrl
        if (!bannerUrl && followerProfile.bannerStorageId) {
          bannerUrl = (await ctx.storage.getUrl(followerProfile.bannerStorageId)) || undefined
        }
        results.push({
          _id: followerProfile._id,
          userId: followerProfile.userId,
          handle: followerProfile.handle,
          displayName: followerProfile.displayName,
          role: followerProfile.role,
          bio: followerProfile.bio,
          avatarUrl: followerProfile.avatarUrl,
          bannerUrl,
          badge: followerProfile.badge,
          criticNumber: followerProfile.criticNumber,
          reviewsCount: followerProfile.reviewsCount,
          isFollowing: viewerFollowingHandles.has(followerProfile.handle.toLowerCase()),
        })
      }
    }

    return results
  },
})


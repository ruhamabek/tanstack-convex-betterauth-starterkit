import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser, getOptionalAuthUser } from './helpers'

// Clean alphanumeric + underscore handle validation: 3 to 24 characters
const HANDLE_REGEX = /^[a-z0-9_]{3,24}$/

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx)
    if (!user) {
      return null
    }

    const userId = String(user._id)
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return null

    let bannerUrl = profile.bannerUrl
    if (!bannerUrl && profile.bannerStorageId) {
      bannerUrl = (await ctx.storage.getUrl(profile.bannerStorageId)) || undefined
    }
    return { ...profile, bannerUrl }
  },
})

export const getByHandle = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (!profile) return null

    let bannerUrl = profile.bannerUrl
    if (!bannerUrl && profile.bannerStorageId) {
      bannerUrl = (await ctx.storage.getUrl(profile.bannerStorageId)) || undefined
    }
    return { ...profile, bannerUrl }
  },
})

export const isHandleAvailable = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')
    if (!HANDLE_REGEX.test(cleanHandle)) {
      return { available: false, error: 'Handle must be 3-24 characters (letters, numbers, underscores).' }
    }

    const user = await getOptionalAuthUser(ctx)
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (!existing) {
      return { available: true }
    }

    // If it belongs to current authenticated user, it is valid to keep
    if (user && existing.userId === String(user._id)) {
      return { available: true }
    }

    return { available: false, error: 'This handle is already claimed by another critic.' }
  },
})

// Genesis critic threshold: First 500 critics earn the Founding Critic credential
export const GENESIS_CRITIC_CAP = 500

export const saveProfile = mutation({
  args: {
    handle: v.string(),
    displayName: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bannerStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')
    if (!HANDLE_REGEX.test(cleanHandle)) {
      throw new Error('Handle must be 3-24 characters containing only lowercase letters, numbers, and underscores.')
    }

    const displayName = args.displayName.trim()
    if (!displayName || displayName.length > 50) {
      throw new Error('Display name must be between 1 and 50 characters.')
    }

    const role = args.role.trim()
    if (!role || role.length > 60) {
      throw new Error('Role must be between 1 and 60 characters.')
    }

    // Check if handle is taken by someone else
    const existingHandle = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (existingHandle && existingHandle.userId !== userId) {
      throw new Error('This handle is already claimed by another critic.')
    }

    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    const now = Date.now()

    let finalBannerUrl = args.bannerUrl
    if (args.bannerStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.bannerStorageId)
      if (storageUrl) {
        finalBannerUrl = storageUrl
      }
    }

    if (existingProfile) {
      // If profile already exists but lacks a criticNumber, assign their sequence
      let criticNumber = existingProfile.criticNumber
      if (!criticNumber) {
        const allProfiles = await ctx.db.query('profiles').collect()
        criticNumber = Math.max(1, allProfiles.findIndex((p) => p._id === existingProfile._id) + 1)
      }

      const badge = existingProfile.badge || (criticNumber <= GENESIS_CRITIC_CAP ? 'Founding Critic' : 'Critic')

      await ctx.db.patch(existingProfile._id, {
        handle: cleanHandle,
        displayName,
        role,
        bio: args.bio?.trim() || undefined,
        avatarUrl: args.avatarUrl || existingProfile.avatarUrl,
        bannerUrl: finalBannerUrl !== undefined ? (finalBannerUrl || undefined) : existingProfile.bannerUrl,
        bannerStorageId: args.bannerStorageId !== undefined ? args.bannerStorageId : (finalBannerUrl === '' ? undefined : existingProfile.bannerStorageId),
        criticNumber,
        badge,
        updatedAt: now,
      })
      return existingProfile._id
    }

    // New profile: determine critic number in genesis sequence
    const allProfiles = await ctx.db.query('profiles').collect()
    const criticNumber = allProfiles.length + 1
    const badge = criticNumber <= GENESIS_CRITIC_CAP ? 'Founding Critic' : 'Critic'

    return await ctx.db.insert('profiles', {
      userId,
      handle: cleanHandle,
      displayName,
      role,
      bio: args.bio?.trim() || undefined,
      avatarUrl: args.avatarUrl || undefined,
      bannerUrl: finalBannerUrl || undefined,
      bannerStorageId: args.bannerStorageId || undefined,
      badge,
      criticNumber,
      reviewsCount: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

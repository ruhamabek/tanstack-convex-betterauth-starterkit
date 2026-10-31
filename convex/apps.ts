import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthUser } from './helpers'
import type { Id } from './_generated/dataModel'

export const list = query({
  args: {
    category: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    featuredOnly: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let apps = await ctx.db.query('apps').collect()

    if (args.sourceType && args.sourceType !== 'all') {
      apps = apps.filter((app) => (app.sourceType || 'product') === args.sourceType)
    }

    if (args.category && args.category !== 'all') {
      apps = apps.filter((app) => app.category === args.category)
    }

    if (args.featuredOnly) {
      apps = apps.filter((app) => Boolean(app.featured))
    }

    if (args.search) {
      const q = args.search.trim().toLowerCase()
      apps = apps.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.tagline.toLowerCase().includes(q) ||
          (app.sourceAuthor && app.sourceAuthor.toLowerCase().includes(q)),
      )
    }

    // Sort by craftScore descending by default
    return apps.sort((a, b) => b.craftScore - a.craftScore)
  },
})

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('apps')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const getById = query({
  args: {
    id: v.id('apps'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const seedInitialApps = mutation({
  args: {},
  handler: async () => {
    return {
      seeded: false,
      message: 'Production mode: Seed apps disabled. Apps are added dynamically by users.',
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    category: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.string(),
    websiteUrl: v.optional(v.string()),
    sourceType: v.optional(v.string()), // "product" | "dribbble" | "pinterest" | "mobbin" | "figma"
    sourceUrl: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    // Look up critic profile for attribution
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    const rawSlug = args.slug || args.name
    const cleanSlug = rawSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!cleanSlug) {
      throw new Error('Valid slug is required.')
    }

    const existing = await ctx.db
      .query('apps')
      .withIndex('by_slug', (q) => q.eq('slug', cleanSlug))
      .first()

    if (existing) {
      throw new Error(`A specimen with slug "${cleanSlug}" already exists.`)
    }

    return await ctx.db.insert('apps', {
      name: args.name.trim(),
      slug: cleanSlug,
      category: args.category.trim(),
      tagline: args.tagline.trim(),
      description: args.description?.trim() || undefined,
      iconUrl: args.iconUrl.trim(),
      websiteUrl: args.websiteUrl?.trim() || undefined,
      sourceType: args.sourceType || 'product',
      sourceUrl: args.sourceUrl?.trim() || undefined,
      sourceAuthor: args.sourceAuthor?.trim() || undefined,
      mediaUrl: args.mediaUrl?.trim() || undefined,
      submittedBy: userId,
      submittedByHandle: profile?.handle || 'founding_critic',
      craftScore: 0,
      utilityScore: 0,
      reviewCount: 0,
      status: 'Needs Polish',
      featured: false,
      createdAt: Date.now(),
    })
  },
})

function computeVerdict(craft: number, utility: number): string {
  if (craft >= 90 && utility >= 80) return 'lgtm'
  if (craft >= 70 || utility >= 70) return 'mixed'
  return 'rotten'
}

function computeAppStatus(craft: number, utility: number): string {
  if (craft >= 90 && utility >= 80) return 'Certified LGTM'
  if (craft < 70 && utility >= 75) return 'Bloated'
  if (craft >= 70 || utility >= 70) return 'Needs Polish'
  return 'Rotten'
}

export const createAndAppraiseSpecimen = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.string(),
    websiteUrl: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id('_storage')),
    craftScore: v.number(),
    utilityScore: v.number(),
    headline: v.string(),
    quote: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Please claim your critic persona before logging a specimen.')
    }

    const craft = Math.min(100, Math.max(0, Math.round(args.craftScore)))
    const utility = Math.min(100, Math.max(0, Math.round(args.utilityScore)))
    const verdict = computeVerdict(craft, utility)
    const status = computeAppStatus(craft, utility)
    const now = Date.now()

    let baseSlug = args.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!baseSlug) baseSlug = 'specimen'

    let cleanSlug = baseSlug
    let counter = 1
    while (
      await ctx.db
        .query('apps')
        .withIndex('by_slug', (q) => q.eq('slug', cleanSlug))
        .first()
    ) {
      cleanSlug = `${baseSlug}-${counter++}`
    }

    let finalMediaUrl = args.mediaUrl?.trim() || undefined
    if (args.mediaStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.mediaStorageId)
      if (storageUrl) {
        finalMediaUrl = storageUrl
      }
    }

    // 1. Insert specimen with initial appraisal scores
    const appId = await ctx.db.insert('apps', {
      name: args.name.trim(),
      slug: cleanSlug,
      category: args.category.trim(),
      tagline: args.tagline.trim(),
      description: args.description?.trim() || undefined,
      iconUrl: args.iconUrl.trim(),
      websiteUrl: args.websiteUrl?.trim() || undefined,
      sourceType: args.sourceType || 'product',
      sourceUrl: args.sourceUrl?.trim() || undefined,
      sourceAuthor: args.sourceAuthor?.trim() || undefined,
      mediaUrl: finalMediaUrl,
      mediaStorageId: args.mediaStorageId,
      submittedBy: userId,
      submittedByHandle: profile.handle,
      craftScore: craft,
      utilityScore: utility,
      reviewCount: 1,
      status,
      featured: true,
      createdAt: now,
    })

    // 2. Insert inaugural critique
    const reviewId = await ctx.db.insert('reviews', {
      appId,
      userId,
      authorHandle: profile.handle,
      authorDisplayName: profile.displayName,
      authorRole: profile.role,
      craftScore: craft,
      utilityScore: utility,
      headline: args.headline.trim(),
      quote: args.quote.trim(),
      verdict,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    })

    // 3. Increment profile review count & seal founding badge
    const newReviewsCount = (profile.reviewsCount || 0) + 1
    const isGenesis = (profile.criticNumber ?? 1) <= 500
    const updatedBadge = isGenesis ? 'Founding Critic' : profile.badge || 'Critic'

    await ctx.db.patch(profile._id, {
      reviewsCount: newReviewsCount,
      badge: updatedBadge,
      updatedAt: now,
    })

    return {
      appId,
      reviewId,
      status,
      verdict,
    }
  },
})

export const upsertAppAndEvaluate = mutation({
  args: {
    appName: v.string(),
    websiteUrl: v.string(),
    category: v.string(),
    iconUrl: v.optional(v.string()),
    tagline: v.optional(v.string()),
    featureName: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id('_storage')),
    mediaType: v.optional(v.string()),
    craftScore: v.number(),
    utilityScore: v.number(),
    headline: v.string(),
    quote: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx)
    const userId = String(user._id)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Please claim your critic persona before evaluating an app.')
    }

    const craft = Math.min(100, Math.max(0, Math.round(args.craftScore)))
    const utility = Math.min(100, Math.max(0, Math.round(args.utilityScore)))
    const verdict = computeVerdict(craft, utility)
    const now = Date.now()

    const cleanName = args.appName.trim()
    let cleanWebsite = args.websiteUrl.trim()
    if (!cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
      cleanWebsite = `https://${cleanWebsite}`
    }

    // Resolve icon if not provided
    let finalIcon = args.iconUrl?.trim()
    if (!finalIcon) {
      try {
        const domain = new URL(cleanWebsite).hostname.replace(/^www\./, '')
        finalIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      } catch {
        finalIcon = 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png'
      }
    }

    // Check if app already exists by name (case-insensitive)
    const allApps = await ctx.db.query('apps').collect()
    const existingApp = allApps.find(
      (a) => a.name.trim().toLowerCase() === cleanName.toLowerCase(),
    )

    let appId: Id<'apps'>
    let appStatus: string

    if (!existingApp) {
      let baseSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      if (!baseSlug) baseSlug = 'app'

      let cleanSlug = baseSlug
      let counter = 1
      while (
        await ctx.db
          .query('apps')
          .withIndex('by_slug', (q) => q.eq('slug', cleanSlug))
          .first()
      ) {
        cleanSlug = `${baseSlug}-${counter++}`
      }

      appStatus = computeAppStatus(craft, utility)

      appId = await ctx.db.insert('apps', {
        name: cleanName,
        slug: cleanSlug,
        category: args.category.trim() || 'Software Product',
        tagline: args.tagline?.trim() || `${cleanName} software evaluation.`,
        websiteUrl: cleanWebsite,
        iconUrl: finalIcon,
        craftScore: craft,
        utilityScore: utility,
        reviewCount: 1,
        status: appStatus,
        featured: false,
        sourceType: 'product',
        createdBy: userId,
        createdAt: now,
      })
    } else {
      appId = existingApp._id

      // Recalculate average scores across all reviews for this app
      const existingReviews = await ctx.db
        .query('reviews')
        .withIndex('by_app', (q) => q.eq('appId', appId))
        .collect()

      const totalCraft = existingReviews.reduce((sum, r) => sum + r.craftScore, 0) + craft
      const totalUtility = existingReviews.reduce((sum, r) => sum + r.utilityScore, 0) + utility
      const newCount = existingReviews.length + 1
      const newCraftAvg = Math.round(totalCraft / newCount)
      const newUtilityAvg = Math.round(totalUtility / newCount)
      appStatus = computeAppStatus(newCraftAvg, newUtilityAvg)

      await ctx.db.patch(appId, {
        craftScore: newCraftAvg,
        utilityScore: newUtilityAvg,
        reviewCount: newCount,
        status: appStatus,
      })
    }

    // 2. Insert the critique review with featureName & media
    let finalMediaUrl = args.mediaUrl?.trim() || undefined
    if (args.mediaStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.mediaStorageId)
      if (storageUrl) {
        finalMediaUrl = storageUrl
      }
    }

    const reviewId = await ctx.db.insert('reviews', {
      appId,
      userId,
      authorHandle: profile.handle,
      authorDisplayName: profile.displayName,
      authorRole: profile.role,
      featureName: args.featureName?.trim() || undefined,
      mediaUrl: finalMediaUrl,
      mediaStorageId: args.mediaStorageId,
      mediaType: args.mediaType || undefined,
      craftScore: craft,
      utilityScore: utility,
      headline: args.headline.trim(),
      quote: args.quote.trim(),
      verdict,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    })

    // 3. Update profile review count
    const newReviewsCount = (profile.reviewsCount || 0) + 1
    const isGenesis = (profile.criticNumber ?? 1) <= 500
    const updatedBadge = isGenesis ? 'Founding Critic' : profile.badge || 'Critic'

    await ctx.db.patch(profile._id, {
      reviewsCount: newReviewsCount,
      badge: updatedBadge,
      updatedAt: now,
    })

    return {
      appId,
      reviewId,
      status: appStatus,
      verdict,
    }
  },
})


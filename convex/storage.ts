import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Generate a short-lived upload URL for direct client file uploads to Convex storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Get the public HTTPS CDN URL for a given storage ID.
 */
export const getUrl = query({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

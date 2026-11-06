import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Preserved for migration safety while dashboard transitions
  todos: defineTable({
    userId: v.string(),
    text: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // Critic Personas & Persistent Pseudonyms (Zero career retaliation)
  profiles: defineTable({
    userId: v.string(),
    handle: v.string(), // Lowercase unique slug e.g. "pixel_detective"
    displayName: v.string(),
    bio: v.optional(v.string()),
    role: v.string(), // e.g. "Senior Design Engineer", "Product Architect"
    badge: v.optional(v.string()), // "Founding Critic", "Verified Critic"
    criticNumber: v.optional(v.number()), // e.g. 1, 2... Genesis order
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bannerStorageId: v.optional(v.id('_storage')),
    reviewsCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_handle', ['handle']),

  // Curated Software Products & Tools
  apps: defineTable({
    name: v.string(),
    slug: v.string(), // e.g. "linear", "raycast", "supabase"
    category: v.string(), // "Issue Tracking", "Desktop Launcher", "Database", etc.
    tagline: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.string(),
    websiteUrl: v.optional(v.string()),
    craftScore: v.number(), // Aggregate 0-100%
    utilityScore: v.number(), // Aggregate 0-100%
    reviewCount: v.number(),
    status: v.string(), // "Certified LGTM" | "Needs Polish" | "Bloated" | "Rotten"
    featured: v.optional(v.boolean()),
    // Multi-source digital craft specimen extensions
    sourceType: v.optional(v.string()), // "product" | "dribbble" | "pinterest" | "mobbin" | "figma"
    sourceUrl: v.optional(v.string()), // Outbound link to original post / shot / design
    sourceAuthor: v.optional(v.string()), // Attribution to original designer / creator
    mediaUrl: v.optional(v.string()), // Preview shot / video / interactive canvas URL
    mediaStorageId: v.optional(v.id('_storage')), // Convex storage file ID
    submittedBy: v.optional(v.string()), // UserId of critic who logged this specimen
    submittedByHandle: v.optional(v.string()), // @handle of founding critic/curator
    createdBy: v.optional(v.string()), // UserId of critic who dynamically registered this app
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_category', ['category'])
    .index('by_source_type', ['sourceType']),

  // Dual Meter Reviews & Living Scorecards
  reviews: defineTable({
    appId: v.id('apps'),
    userId: v.string(),
    authorHandle: v.string(),
    authorDisplayName: v.string(),
    authorRole: v.string(),
    // Specific Feature / Surface Being Evaluated
    featureName: v.optional(v.string()), // e.g. "Extension Store", "Formula Editor", or undefined for "Overall App"
    mediaUrl: v.optional(v.string()), // Compressed WebP screenshot or video/Loom embed URL
    mediaStorageId: v.optional(v.id('_storage')), // Convex storage file ID
    mediaType: v.optional(v.string()), // "image" | "loom" | "video_embed"
    // Dual Meter Scores
    craftScore: v.number(), // 0-100%
    utilityScore: v.number(), // 0-100%
    headline: v.string(),
    quote: v.string(), // Authentic critique body
    verdict: v.string(), // "lgtm" | "mixed" | "rotten"
    isVerified: v.boolean(),
    parentReviewId: v.optional(v.id('reviews')), // For Counter-Appraisals / Quote Critiques
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_app', ['appId'])
    .index('by_user', ['userId'])
    .index('by_app_and_user', ['appId', 'userId'])
    .index('by_parent_review', ['parentReviewId']),

  // Review Endorsements (Heart / Upvote)
  reviewReactions: defineTable({
    reviewId: v.id('reviews'),
    userId: v.string(),
    type: v.string(), // "endorse"
    createdAt: v.number(),
  })
    .index('by_review', ['reviewId'])
    .index('by_review_and_user', ['reviewId', 'userId'])
    .index('by_user', ['userId']),

  // Specimen Bookmarking & Personal Collections
  reviewBookmarks: defineTable({
    reviewId: v.id('reviews'),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_review', ['reviewId'])
    .index('by_user', ['userId'])
    .index('by_review_and_user', ['reviewId', 'userId']),

  // Critique Discussion Drawer (Threaded Comments)
  reviewComments: defineTable({
    reviewId: v.id('reviews'),
    userId: v.string(),
    authorHandle: v.string(),
    authorDisplayName: v.string(),
    authorRole: v.string(),
    authorBadge: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  })
    .index('by_review', ['reviewId'])
    .index('by_user', ['userId']),

  // Critic Social Graph / Following System
  follows: defineTable({
    followerUserId: v.string(),
    followingHandle: v.string(),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerUserId'])
    .index('by_following_handle', ['followingHandle'])
    .index('by_follower_and_handle', ['followerUserId', 'followingHandle']),

  // Critic Activity & Notifications Hub
  notifications: defineTable({
    userId: v.string(), // Recipient critic's userId
    actorUserId: v.string(), // Critic who performed the action
    actorHandle: v.string(), // @handle of actor
    actorDisplayName: v.string(), // Display name of actor
    actorAvatarUrl: v.optional(v.string()), // Avatar URL
    type: v.string(), // "follow" | "endorse" | "comment" | "quote"
    reviewId: v.optional(v.id('reviews')), // Related review if endorse, comment, or quote
    commentId: v.optional(v.id('reviewComments')), // Related comment if comment
    targetHandle: v.optional(v.string()), // Target handle
    appName: v.optional(v.string()), // Name of app being evaluated (for quick context)
    appIconUrl: v.optional(v.string()), // App icon
    previewText: v.optional(v.string()), // Snippet of comment text, quote text, or review headline
    read: v.boolean(), // Read / unread status
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_read', ['userId', 'read'])
    .index('by_user_and_created', ['userId', 'createdAt']),
})

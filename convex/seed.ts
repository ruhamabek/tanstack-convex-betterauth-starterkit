import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getOptionalAuthUser } from './helpers'
import type { Id } from './_generated/dataModel'

export const DEMO_CRITICS = [
  {
    handle: 'bananas',
    email: 'bananas@screenlog.dev',
    displayName: 'bananas',
    role: 'Founding Software Critic',
    bio: 'Taste tester of software craft. Measuring sub-millisecond interaction delays, tactile spring physics, and typography rhythm.',
    criticNumber: 1,
    badge: 'Founding Critic',
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=bananas&backgroundColor=ffd866',
    defaultUserId: 'user_bananas_genesis',
  },
  {
    handle: 'subgrid_sorcerer',
    email: 'marcus@screenlog.dev',
    displayName: 'Marcus Vance',
    role: 'Staff Frontend Engineer',
    bio: 'Measuring subgrid rhythm, layout shift, and tactile interactive microcopy. Never ship unquantified re-renders.',
    criticNumber: 2,
    badge: 'Founding Critic',
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=marcus_vance&backgroundColor=d1f4ff',
    defaultUserId: 'user_marcus_vance',
  },
  {
    handle: 'pixel_snob',
    email: 'elena@screenlog.dev',
    displayName: 'Elena Rostova',
    role: 'Principal Product Designer',
    bio: 'Cynical about inconsistent border-radius, obsessed with typography weight hierarchies and optical kerning.',
    criticNumber: 3,
    badge: 'Founding Critic',
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=elena_rostova&backgroundColor=ffd5d5',
    defaultUserId: 'user_elena_rostova',
  },
  {
    handle: 'kerning_ghost',
    email: 'alex@screenlog.dev',
    displayName: 'Alex Thorne',
    role: 'Verified Builder & Systems Architect',
    bio: 'Audit of font rendering engines, memory overhead, and macOS native desktop feel. Keyboard-first purist.',
    criticNumber: 4,
    badge: 'Founding Critic',
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=alex_thorne&backgroundColor=e6d8ff',
    defaultUserId: 'user_alex_thorne',
  },
  {
    handle: 'motion_curator',
    email: 'sarah@screenlog.dev',
    displayName: 'Sarah Lin',
    role: 'Design Technologist & Motion Director',
    bio: 'Frame-by-frame critique of spring physics, easing curves, and layout transitions. Reject default bezier curves.',
    criticNumber: 5,
    badge: 'Founding Critic',
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=sarah_lin&backgroundColor=dcfce7',
    defaultUserId: 'user_sarah_lin',
  },
]

export const SEEDED_APPS = [
  {
    name: 'Linear',
    slug: 'linear',
    category: 'Issue Tracking',
    tagline: 'The gold standard for keyboard-first, high-performance issue tracking and project planning.',
    description: 'Linear streamlines software projects, sprints, tasks, and bug tracking. Built for high-performance software teams.',
    iconUrl: '/assets/linear_icon.png',
    websiteUrl: 'https://linear.app',
    craftScore: 96,
    utilityScore: 89,
    status: 'Certified LGTM',
    featured: true,
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Raycast',
    slug: 'raycast',
    category: 'Productivity & Launcher',
    tagline: 'Supercharged productivity launcher replacing spotlight with extensible craft micro-tools.',
    description: 'Raycast lets you control your tools with a few keystrokes. Built natively in Swift with sub-millisecond execution times.',
    iconUrl: '/assets/raycast_favicon.png',
    websiteUrl: 'https://www.raycast.com',
    craftScore: 98,
    utilityScore: 94,
    status: 'Certified LGTM',
    featured: true,
    mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Arc Browser (v2)',
    slug: 'arc-browser-v2',
    category: 'Web Browser',
    tagline: 'Spatial web browser exploring tactile tab containers, split views, and easel canvases.',
    description: 'Arc reimagines the web experience with vertical spaces, split viewing, and easel notes, though memory overhead divides critics.',
    iconUrl: '/assets/arc_favicon.png',
    websiteUrl: 'https://arc.net',
    craftScore: 92,
    utilityScore: 48,
    status: 'Needs Polish',
    featured: true,
    mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Supabase',
    slug: 'supabase',
    category: 'Developer Platform',
    tagline: 'Open-source Firebase alternative with instant Postgres, realtime subscriptions, and auth.',
    description: 'Supabase delivers an enterprise-grade Postgres database with auto-generated REST and GraphQL APIs, storage, and authentication.',
    iconUrl: '/assets/supabase_icon.svg',
    websiteUrl: 'https://supabase.com',
    craftScore: 94,
    utilityScore: 95,
    status: 'Certified LGTM',
    featured: true,
    mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Notion Calendar',
    slug: 'cron',
    category: 'Time & Scheduling',
    tagline: 'Hyper-precise calendar with timezone travel scrubbing and global hotkeys.',
    description: 'Designed by the original Cron team, Notion Calendar pairs uncompromising typography hierarchy with instant scheduling.',
    iconUrl: '/assets/notion_logo.png',
    websiteUrl: 'https://calendar.notion.so',
    craftScore: 95,
    utilityScore: 90,
    status: 'Certified LGTM',
    featured: false,
    mediaUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cash Card Haptics',
    slug: 'cash-card-haptics',
    category: 'Mobbin Flow',
    tagline: 'Tactile physics-based card spring simulations and haptic balance scrubbing.',
    description: 'Digital craft specimen highlighting Cash App custom spring physics simulations during card reordering and balance scrubbing.',
    iconUrl: 'https://cash.app/favicon.ico',
    websiteUrl: 'https://cash.app',
    craftScore: 95,
    utilityScore: 92,
    status: 'Certified LGTM',
    featured: false,
    sourceType: 'mobbin',
    sourceUrl: 'https://mobbin.com',
    sourceAuthor: 'Cash App Design Team',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
  },
]

export const seedPlatformData = mutation({
  args: {
    forceResetLegacyReviews: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const caller = await getOptionalAuthUser(ctx)
    const callerUserId = caller ? String(caller._id) : null
    const now = Date.now()

    // 1. Seed Apps
    const appMap: Record<string, Id<'apps'>> = {}
    for (const appData of SEEDED_APPS) {
      let existing = await ctx.db
        .query('apps')
        .withIndex('by_slug', (q) => q.eq('slug', appData.slug))
        .first()

      if (!existing) {
        const id = await ctx.db.insert('apps', {
          ...appData,
          reviewCount: 0,
          createdAt: now - 30 * 86400000,
        })
        appMap[appData.slug] = id
      } else {
        await ctx.db.patch(existing._id, {
          name: appData.name,
          category: appData.category,
          tagline: appData.tagline,
          description: appData.description,
          iconUrl: appData.iconUrl,
          websiteUrl: appData.websiteUrl,
          craftScore: appData.craftScore,
          utilityScore: appData.utilityScore,
          status: appData.status,
          featured: appData.featured,
          sourceType: appData.sourceType,
          sourceUrl: appData.sourceUrl,
          sourceAuthor: appData.sourceAuthor,
          mediaUrl: appData.mediaUrl,
        })
        appMap[appData.slug] = existing._id
      }
    }

    // 2. Seed Critic Profiles
    const userToHandleMap: Record<string, string> = {}
    const handleToUserIdMap: Record<string, string> = {}

    for (const critic of DEMO_CRITICS) {
      // Find by handle
      let existing = await ctx.db
        .query('profiles')
        .withIndex('by_handle', (q) => q.eq('handle', critic.handle))
        .first()

      // If this is bananas and the caller is logged in, bind to caller
      let effectiveUserId = critic.defaultUserId
      if (critic.handle === 'bananas' && callerUserId) {
        effectiveUserId = callerUserId
      } else if (existing) {
        effectiveUserId = existing.userId
      }

      userToHandleMap[effectiveUserId] = critic.handle
      handleToUserIdMap[critic.handle] = effectiveUserId

      if (!existing) {
        await ctx.db.insert('profiles', {
          userId: effectiveUserId,
          handle: critic.handle,
          displayName: critic.displayName,
          role: critic.role,
          bio: critic.bio,
          badge: critic.badge,
          criticNumber: critic.criticNumber,
          avatarUrl: critic.avatarUrl,
          reviewsCount: 0,
          createdAt: now - 60 * 86400000,
          updatedAt: now,
        })
      } else {
        // Update profile fields to ensure crisp presentation
        await ctx.db.patch(existing._id, {
          displayName: existing.displayName || critic.displayName,
          role: existing.role || critic.role,
          bio: existing.bio || critic.bio,
          avatarUrl: existing.avatarUrl || critic.avatarUrl,
          badge: critic.badge,
          criticNumber: critic.criticNumber,
          userId: critic.handle === 'bananas' && callerUserId ? callerUserId : existing.userId,
          updatedAt: now,
        })
      }
    }

    // 3. Clean up legacy "Thursday Drop" / ballot review text if present
    const allReviews = await ctx.db.query('reviews').collect()
    for (const r of allReviews) {
      if (
        r.headline?.includes('Thursday Drop') ||
        r.quote?.includes('Thursday Drop') ||
        r.quote?.includes('Anonymous ballot')
      ) {
        if (args.forceResetLegacyReviews) {
          await ctx.db.delete(r._id)
        } else {
          // Cleanly replace with authentic craft critique
          await ctx.db.patch(r._id, {
            headline: r.headline.replace(/in Thursday Drop #\d+/g, 'Software Appraisal').replace(/Ballot/g, 'Appraisal'),
            quote: 'Uncompromising attention to tactile micro-interactions and sub-millisecond hotkey latency. One of the finest software implementations in its class.',
          })
        }
      }
    }

    // 4. Seed High-Craft Authenticated Reviews
    const REVIEWS_TO_SEED = [
      {
        appSlug: 'raycast',
        handle: 'bananas',
        featureName: 'Extension Store & Hotkeys',
        craftScore: 98,
        utilityScore: 94,
        headline: 'The Gold Standard of Keyboard-First Native Desktop Software',
        quote: 'Raycast completely replaced Spotlight and Alfred on day one. Hotkey response times are consistently under 16ms, and the community extensions ecosystem is the best-maintained API platform I have used.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 2,
      },
      {
        appSlug: 'linear',
        handle: 'subgrid_sorcerer',
        featureName: 'Project Command Palette & Triage',
        craftScore: 96,
        utilityScore: 89,
        headline: 'Instantaneous optimistic UI with zero layout shift',
        quote: 'Linear never makes the user wait for a network roundtrip. State transitions, optimistic cache updates, and keyboard shortcuts feel as responsive as a text editor. Truly inspiring craft.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 3,
      },
      {
        appSlug: 'arc-browser-v2',
        handle: 'pixel_snob',
        featureName: 'Spaces & Easels Canvas',
        craftScore: 92,
        utilityScore: 48,
        headline: 'Stunning visual styling marred by aggressive memory bloat',
        quote: 'The color palette generation and glassmorphism borders are breathtaking. But when 20 tabs are open across three spaces, the GPU fan screams and memory hits 4GB. Visual eye candy with a heavy battery tax.',
        verdict: 'mixed',
        mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 4,
      },
      {
        appSlug: 'supabase',
        handle: 'kerning_ghost',
        featureName: 'Table Editor & SQL Scratchpad',
        craftScore: 94,
        utilityScore: 95,
        headline: 'The developer platform Firebase always wished it was',
        quote: 'Postgres row-level security backed by a delightfully responsive Monaco-based SQL editor. Query tuning insights and instant foreign key dropdowns make database administration painless.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 5,
      },
      {
        appSlug: 'cron',
        handle: 'motion_curator',
        featureName: 'Timezone Travel & Scrubbing',
        craftScore: 95,
        utilityScore: 90,
        headline: 'Flawless typography hierarchy and scrubbing physics',
        quote: 'Dragging meeting blocks across timezones produces an audible, tactile click in your mind. The font choice and optical alignment of event badges is a masterclass in calendar UX.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 6,
      },
      {
        appSlug: 'cash-card-haptics',
        handle: 'subgrid_sorcerer',
        featureName: 'Card Spring Simulation',
        craftScore: 95,
        utilityScore: 92,
        headline: 'Dynamic spring damping tuned to perfection',
        quote: 'Mobbin flow dissecting Cash App 3D card tilt gestures. The friction damping coefficients prevent any jarring overshoot while retaining organic bounce.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 7,
      },
      {
        appSlug: 'arc-browser-v2',
        handle: 'bananas',
        featureName: 'Overall Experience',
        craftScore: 88,
        utilityScore: 52,
        headline: 'A bold experiment that requires an M3 Max to survive',
        quote: 'I love the tactile feel of pinning tabs and splitting views horizontally. But when collaborating on Figma while running Arc, productivity crawls. Needs an engine diet.',
        verdict: 'mixed',
        mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 1,
      },
      {
        appSlug: 'linear',
        handle: 'kerning_ghost',
        featureName: 'Issue Details & Markdown',
        craftScore: 95,
        utilityScore: 93,
        headline: 'Command-K UX done with absolute precision',
        quote: 'Linear taught the entire software industry how a modern desktop app should behave. You never have to lift your fingers off the home row.',
        verdict: 'lgtm',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        daysAgo: 8,
      },
    ]

    const reviewMap: Record<string, Id<'reviews'>> = {}

    for (const rData of REVIEWS_TO_SEED) {
      const handle = rData.handle
      const userId = handleToUserIdMap[handle] || criticUserId(handle)
      const appId = appMap[rData.appSlug]
      if (!appId) continue

      const critic = DEMO_CRITICS.find((c) => c.handle === handle)
      const authorDisplayName = critic?.displayName || handle
      const authorRole = critic?.role || 'Software Critic'

      // Check if already seeded
      const existing = await ctx.db
        .query('reviews')
        .withIndex('by_app_and_user', (q) => q.eq('appId', appId).eq('userId', userId))
        .first()

      const reviewDate = now - rData.daysAgo * 86400000

      if (!existing) {
        const id = await ctx.db.insert('reviews', {
          appId,
          userId,
          authorHandle: handle,
          authorDisplayName,
          authorRole,
          featureName: rData.featureName,
          mediaUrl: rData.mediaUrl,
          craftScore: rData.craftScore,
          utilityScore: rData.utilityScore,
          headline: rData.headline,
          quote: rData.quote,
          verdict: rData.verdict,
          isVerified: true,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        })
        reviewMap[`${handle}_${rData.appSlug}`] = id
      } else {
        await ctx.db.patch(existing._id, {
          headline: rData.headline,
          quote: rData.quote,
          craftScore: rData.craftScore,
          utilityScore: rData.utilityScore,
          verdict: rData.verdict,
          featureName: rData.featureName,
          mediaUrl: rData.mediaUrl,
        })
        reviewMap[`${handle}_${rData.appSlug}`] = existing._id
      }
    }

    // 5. Update reviewCount on apps and profiles
    for (const appData of SEEDED_APPS) {
      const appId = appMap[appData.slug]
      if (appId) {
        const count = (await ctx.db.query('reviews').withIndex('by_app', (q) => q.eq('appId', appId)).collect()).length
        await ctx.db.patch(appId, { reviewCount: Math.max(count, 3) })
      }
    }

    for (const critic of DEMO_CRITICS) {
      const userId = handleToUserIdMap[critic.handle]
      if (userId) {
        const profile = await ctx.db.query('profiles').withIndex('by_handle', (q) => q.eq('handle', critic.handle)).first()
        if (profile) {
          const count = (await ctx.db.query('reviews').withIndex('by_user', (q) => q.eq('userId', userId)).collect()).length
          await ctx.db.patch(profile._id, { reviewsCount: count })
        }
      }
    }

    // 6. Seed Cross-Following Relationships
    const FOLLOW_PAIRS = [
      { follower: 'subgrid_sorcerer', following: 'bananas' },
      { follower: 'pixel_snob', following: 'bananas' },
      { follower: 'motion_curator', following: 'bananas' },
      { follower: 'bananas', following: 'subgrid_sorcerer' },
      { follower: 'bananas', following: 'pixel_snob' },
      { follower: 'bananas', following: 'kerning_ghost' },
      { follower: 'subgrid_sorcerer', following: 'pixel_snob' },
      { follower: 'pixel_snob', following: 'subgrid_sorcerer' },
      { follower: 'kerning_ghost', following: 'motion_curator' },
      { follower: 'motion_curator', following: 'subgrid_sorcerer' },
    ]

    for (const pair of FOLLOW_PAIRS) {
      const followerUserId = handleToUserIdMap[pair.follower] || criticUserId(pair.follower)
      const existing = await ctx.db
        .query('follows')
        .withIndex('by_follower_and_handle', (q) =>
          q.eq('followerUserId', followerUserId).eq('followingHandle', pair.following),
        )
        .first()

      if (!existing) {
        await ctx.db.insert('follows', {
          followerUserId,
          followingHandle: pair.following,
          createdAt: now - Math.floor(Math.random() * 5 + 1) * 86400000,
        })
      }
    }

    // 7. Seed Threaded Comments with Nested Replies
    const targetReviewId = reviewMap['subgrid_sorcerer_linear'] || reviewMap['bananas_raycast']
    if (targetReviewId) {
      const rootComment = await ctx.db
        .query('reviewComments')
        .withIndex('by_review', (q) => q.eq('reviewId', targetReviewId))
        .first()

      if (!rootComment) {
        // Insert Root Comment from Elena
        const rootCommentId = await ctx.db.insert('reviewComments', {
          reviewId: targetReviewId,
          userId: handleToUserIdMap['pixel_snob'] || criticUserId('pixel_snob'),
          authorHandle: 'pixel_snob',
          authorDisplayName: 'Elena Rostova',
          authorRole: 'Principal Product Designer',
          authorBadge: 'Founding Critic',
          content: 'Spot on about optimistic cache updates. But have you noticed their modal dialog backdrop transitions drop frames on Safari? Still 9/10 though.',
          createdAt: now - 3600000 * 18,
        })

        // Insert Nested Reply from Marcus to Elena
        await ctx.db.insert('reviewComments', {
          reviewId: targetReviewId,
          userId: handleToUserIdMap['subgrid_sorcerer'] || criticUserId('subgrid_sorcerer'),
          authorHandle: 'subgrid_sorcerer',
          authorDisplayName: 'Marcus Vance',
          authorRole: 'Staff Frontend Engineer',
          authorBadge: 'Founding Critic',
          content: '@pixel_snob It is due to their backdrop-filter CSS blur combined with a scale transform! If they switch to opacity-only fades on webkit it stays locked at 60fps.',
          parentCommentId: rootCommentId,
          replyToHandle: 'pixel_snob',
          createdAt: now - 3600000 * 12,
        })

        // Insert Second Nested Reply from bananas to Marcus
        await ctx.db.insert('reviewComments', {
          reviewId: targetReviewId,
          userId: handleToUserIdMap['bananas'] || callerUserId || criticUserId('bananas'),
          authorHandle: 'bananas',
          authorDisplayName: 'bananas',
          authorRole: 'Founding Software Critic',
          authorBadge: 'Founding Critic',
          content: '@subgrid_sorcerer Great technical catch Marcus. Subgrid and compositing layers are why we have this consensus ledger.',
          parentCommentId: rootCommentId,
          replyToHandle: 'subgrid_sorcerer',
          createdAt: now - 3600000 * 6,
        })
      }
    }

    // 8. Seed Notifications for each Critic
    for (const critic of DEMO_CRITICS) {
      const recipientUserId = handleToUserIdMap[critic.handle] || criticUserId(critic.handle)

      const existingNotifs = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', recipientUserId))
        .take(5)

      if (existingNotifs.length < 2) {
        // Seed a follow notification
        const otherCritic = DEMO_CRITICS.find((c) => c.handle !== critic.handle)!
        await ctx.db.insert('notifications', {
          userId: recipientUserId,
          actorUserId: handleToUserIdMap[otherCritic.handle] || criticUserId(otherCritic.handle),
          actorHandle: otherCritic.handle,
          actorDisplayName: otherCritic.displayName,
          actorAvatarUrl: otherCritic.avatarUrl,
          type: 'follow',
          previewText: `${otherCritic.displayName} (@${otherCritic.handle}) started following your software appraisals.`,
          read: false,
          createdAt: now - 3600000 * 4,
        })

        const linearRevId = reviewMap['subgrid_sorcerer_linear'] || reviewMap[`${critic.handle}_linear`]
        const raycastRevId = reviewMap['bananas_raycast'] || reviewMap[`${critic.handle}_raycast`]

        // Seed a reply notification
        const thirdCritic = DEMO_CRITICS.find((c) => c.handle !== critic.handle && c.handle !== otherCritic.handle)!
        await ctx.db.insert('notifications', {
          userId: recipientUserId,
          actorUserId: handleToUserIdMap[thirdCritic.handle] || criticUserId(thirdCritic.handle),
          actorHandle: thirdCritic.handle,
          actorDisplayName: thirdCritic.displayName,
          actorAvatarUrl: thirdCritic.avatarUrl,
          type: 'reply',
          reviewId: linearRevId,
          appName: 'Linear',
          previewText: `replied to your take: "Spot on about optimistic cache updates. Truly inspiring craft."`,
          read: false,
          createdAt: now - 3600000 * 2,
        })

        // Seed an endorsement notification
        await ctx.db.insert('notifications', {
          userId: recipientUserId,
          actorUserId: handleToUserIdMap[otherCritic.handle] || criticUserId(otherCritic.handle),
          actorHandle: otherCritic.handle,
          actorDisplayName: otherCritic.displayName,
          actorAvatarUrl: otherCritic.avatarUrl,
          type: 'endorse',
          reviewId: raycastRevId,
          appName: 'Raycast',
          previewText: `endorsed your appraisal: "The Gold Standard of Keyboard-First Native Desktop Software"`,
          read: true,
          createdAt: now - 3600000 * 24,
        })
      }
    }

    // 9. Patch any existing notifications that are missing reviewId
    const allNotifs = await ctx.db.query('notifications').collect()
    for (const notif of allNotifs) {
      if (!notif.reviewId) {
        if (notif.appName === 'Linear' && reviewMap['subgrid_sorcerer_linear']) {
          await ctx.db.patch(notif._id, { reviewId: reviewMap['subgrid_sorcerer_linear'] })
        } else if (notif.appName === 'Raycast' && reviewMap['bananas_raycast']) {
          await ctx.db.patch(notif._id, { reviewId: reviewMap['bananas_raycast'] })
        } else if (notif.appName) {
          const matchedApp = await ctx.db
            .query('apps')
            .filter((q) => q.eq(q.field('name'), notif.appName))
            .first()
          if (matchedApp) {
            const rev = await ctx.db
              .query('reviews')
              .withIndex('by_app', (q) => q.eq('appId', matchedApp._id))
              .first()
            if (rev) {
              await ctx.db.patch(notif._id, { reviewId: rev._id })
            }
          }
        }
      }
    }

    return {
      success: true,
      seededApps: SEEDED_APPS.length,
      seededCritics: DEMO_CRITICS.length,
      seededReviews: REVIEWS_TO_SEED.length,
    }
  },
})

// Quick helper to link a logged in Better Auth user to one of the 5 demo personas
export const linkDemoUserToProfile = mutation({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getOptionalAuthUser(ctx)
    if (!caller) {
      return { success: false, reason: 'unauthenticated' }
    }

    const callerUserId = String(caller._id)
    const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
      .first()

    if (!profile) {
      return { success: false, reason: 'profile_not_found' }
    }

    // Update userId in profile
    await ctx.db.patch(profile._id, {
      userId: callerUserId,
      updatedAt: Date.now(),
    })

    // Re-bind reviews, comments, and notifications authored by or directed to this persona
    const reviews = await ctx.db
      .query('reviews')
      .filter((q) => q.eq(q.field('authorHandle'), cleanHandle))
      .collect()

    for (const r of reviews) {
      await ctx.db.patch(r._id, { userId: callerUserId })
    }

    const notifs = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('targetHandle'), cleanHandle))
      .collect()

    for (const n of notifs) {
      await ctx.db.patch(n._id, { userId: callerUserId })
    }

    return { success: true, handle: cleanHandle, userId: callerUserId }
  },
})

export const getSeedStatus = query({
  args: {},
  handler: async (ctx) => {
    const appsCount = (await ctx.db.query('apps').collect()).length
    const profilesCount = (await ctx.db.query('profiles').collect()).length
    const reviewsCount = (await ctx.db.query('reviews').collect()).length
    return {
      isSeeded: appsCount >= 5 && profilesCount >= 5 && reviewsCount >= 5,
      appsCount,
      profilesCount,
      reviewsCount,
    }
  },
})

function criticUserId(handle: string): string {
  const match = DEMO_CRITICS.find((c) => c.handle === handle)
  return match?.defaultUserId || `user_${handle}`
}

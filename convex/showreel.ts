import { v } from 'convex/values'
import { query } from './_generated/server'
import { getOptionalAuthUser } from './helpers'
import { normalizeAppIcon } from './apps'

export interface ArchetypeSlider {
  label: string
  score: number
}

export interface ArchetypeData {
  title: string
  narrative: string
  mascotUrl: string
  sliders: ArchetypeSlider[]
}

const PRESET_ARCHETYPES: Record<string, ArchetypeData> = {
  subgrid_sorcerer: {
    title: 'The Subgrid Purist',
    narrative:
      'You evaluated desktop specimens with microscopic motion sensitivity, strict 8pt spatial discipline, and zero ergonomic tolerance.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Micro-motion sensitivity', score: 94 },
      { label: 'Subgrid layout discipline', score: 98 },
      { label: 'Ergonomic tolerance', score: 48 },
    ],
  },
  pixel_snob: {
    title: 'The Optical Snob',
    narrative:
      'Cynical about inconsistent border-radius, obsessed with typography weight hierarchies, optical kerning, and strict token systems.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Kerning & optical kerning', score: 97 },
      { label: 'Border-radius consistency', score: 95 },
      { label: 'Design token fidelity', score: 91 },
    ],
  },
  kerning_ghost: {
    title: 'The Latency Architect',
    narrative:
      'Auditing font rendering engines, memory overhead, and macOS native desktop feel. Zero tolerance for unquantified re-renders.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Sub-16ms hotkey response', score: 99 },
      { label: 'Native desktop feel', score: 96 },
      { label: 'Memory bloat tolerance', score: 38 },
    ],
  },
  motion_curator: {
    title: 'The Spring Sculptor',
    narrative:
      'Frame-by-frame critique of spring physics, easing curves, and layout transitions. Default cubic-beziers are strictly banned.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Spring damping coefficient', score: 96 },
      { label: 'Frame-by-frame pacing', score: 98 },
      { label: 'Cubic-bezier aversion', score: 92 },
    ],
  },
  bananas: {
    title: 'The Genesis Taste Tester',
    narrative:
      'Measuring sub-millisecond interaction delays, tactile spring physics, typography rhythm, and uncompromising desktop craft.',
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Sub-millisecond latency', score: 98 },
      { label: 'Haptic spring feedback', score: 94 },
      { label: 'Feature-bloat immunity', score: 89 },
    ],
  },
}

function computeDynamicArchetype(
  avgCraft: number,
  avgUtility: number,
  totalReviews: number,
): ArchetypeData {
  if (avgCraft >= 90 && avgUtility < 70) {
    return {
      title: 'The Aesthetic Purist',
      narrative: `You appraised ${totalReviews} specimens prioritizing visual polish, bespoke typography rhythm, and surface elegance over raw utility.`,
      mascotUrl: '/assets/subgrid_purist_3d.jpg',
      sliders: [
        { label: 'Visual surface polish', score: Math.min(99, Math.round(avgCraft)) },
        { label: 'Optical balance strictness', score: Math.min(98, Math.round(avgCraft - 2)) },
        { label: 'Bloat tolerance', score: Math.max(25, Math.round(avgUtility)) },
      ],
    }
  }

  if (avgUtility >= 85 && avgCraft < 80) {
    return {
      title: 'The Utilitarian Realist',
      narrative: `You appraised ${totalReviews} specimens prioritizing keyboard efficiency, workflow density, and zero-nonsense software execution.`,
      mascotUrl: '/assets/subgrid_purist_3d.jpg',
      sliders: [
        { label: 'Workflow velocity', score: Math.min(99, Math.round(avgUtility)) },
        { label: 'Keyboard-first navigation', score: Math.min(96, Math.round(avgUtility - 3)) },
        { label: 'Decorative flourish tolerance', score: Math.max(30, Math.round(avgCraft)) },
      ],
    }
  }

  if (avgCraft >= 85 && avgUtility >= 80) {
    return {
      title: 'The Craft Connoisseur',
      narrative: `You appraised ${totalReviews} specimens holding software to the pinnacle of both engineering performance and aesthetic craftsmanship.`,
      mascotUrl: '/assets/subgrid_purist_3d.jpg',
      sliders: [
        { label: 'Micro-interaction precision', score: Math.min(98, Math.round(avgCraft)) },
        { label: 'Productivity leverage', score: Math.min(97, Math.round(avgUtility)) },
        {
          label: 'Ergonomic consistency',
          score: Math.min(96, Math.round((avgCraft + avgUtility) / 2)),
        },
      ],
    }
  }

  return {
    title: 'The Discerning Critic',
    narrative: `You evaluated ${totalReviews} software specimens with calibrated inspection of typography, interaction physics, and daily utility.`,
    mascotUrl: '/assets/subgrid_purist_3d.jpg',
    sliders: [
      { label: 'Interface inspection', score: Math.min(95, Math.max(70, Math.round(avgCraft || 85))) },
      { label: 'Everyday ergonomics', score: Math.min(95, Math.max(70, Math.round(avgUtility || 80))) },
      { label: 'Clutter tolerance', score: Math.max(35, Math.min(80, Math.round(100 - (avgCraft || 75) * 0.4))) },
    ],
  }
}

export const getCriticShowreelData = query({
  args: {
    handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalAuthUser(ctx)
    let profile = null

    // 1. Resolve target profile
    if (args.handle) {
      const cleanHandle = args.handle.trim().toLowerCase().replace(/^@/, '')
      profile = await ctx.db
        .query('profiles')
        .withIndex('by_handle', (q) => q.eq('handle', cleanHandle))
        .first()
    } else if (user) {
      const userId = String(user._id)
      profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first()

      if (!profile && user.email) {
        const emailLower = user.email.toLowerCase()
        const EMAIL_TO_HANDLE: Record<string, string> = {
          'marcus@screenlog.dev': 'subgrid_sorcerer',
          'elena@screenlog.dev': 'pixel_snob',
          'alex@screenlog.dev': 'kerning_ghost',
          'sarah@screenlog.dev': 'motion_curator',
          'bananas@screenlog.dev': 'bananas',
        }
        const targetHandle = EMAIL_TO_HANDLE[emailLower] || emailLower.split('@')[0]
        profile = await ctx.db
          .query('profiles')
          .withIndex('by_handle', (q) => q.eq('handle', targetHandle))
          .first()
      }
    }

    // Default fallback to genesis critic bananas
    if (!profile) {
      profile = await ctx.db
        .query('profiles')
        .withIndex('by_handle', (q) => q.eq('handle', 'bananas'))
        .first()
    }

    if (!profile) {
      return null
    }

    // 2. Fetch all reviews authored by this critic
    let reviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('userId', profile!.userId))
      .collect()

    if (reviews.length === 0 && profile.handle) {
      reviews = await ctx.db
        .query('reviews')
        .filter((q) => q.eq(q.field('authorHandle'), profile!.handle))
        .collect()
    }

    // 3. Resolve reviewed apps and enrich with app details
    const evaluatedAppsMap = new Map<
      string,
      {
        name: string
        slug: string
        category: string
        tagline: string
        iconUrl: string
        craftScore: number
        utilityScore: number
        status: string
        headline: string
        quote: string
        verdict: string
        isPersonalReview: boolean
      }
    >()

    for (const r of reviews) {
      let rawApp = await ctx.db.get(r.appId)
      if (!rawApp) continue
      const app = normalizeAppIcon(rawApp)

      const existing = evaluatedAppsMap.get(app.slug)
      // If reviewed multiple surfaces, keep the highest rated craft review
      if (!existing || r.craftScore > existing.craftScore) {
        evaluatedAppsMap.set(app.slug, {
          name: app.name,
          slug: app.slug,
          category: app.category,
          tagline: app.tagline,
          iconUrl: app.iconUrl,
          craftScore: r.craftScore,
          utilityScore: r.utilityScore,
          status: app.status,
          headline: r.headline,
          quote: r.quote,
          verdict: r.verdict,
          isPersonalReview: true,
        })
      }
    }

    let items = Array.from(evaluatedAppsMap.values()).sort(
      (a, b) => b.craftScore - a.craftScore || b.utilityScore - a.utilityScore,
    )

    // 4. Fallback blend if critic has evaluated fewer than 3 apps: backfill with top platform apps
    if (items.length < 3) {
      const allPlatformApps = await ctx.db.query('apps').collect()
      const sortedPlatformApps = allPlatformApps
        .map(normalizeAppIcon)
        .sort((a, b) => b.craftScore - a.craftScore || b.reviewCount - a.reviewCount)

      for (const pApp of sortedPlatformApps) {
        if (items.length >= 3) break
        if (!evaluatedAppsMap.has(pApp.slug)) {
          items.push({
            name: pApp.name,
            slug: pApp.slug,
            category: pApp.category,
            tagline: pApp.tagline,
            iconUrl: pApp.iconUrl,
            craftScore: pApp.craftScore,
            utilityScore: pApp.utilityScore,
            status: pApp.status,
            headline: pApp.tagline,
            quote: pApp.description || pApp.tagline,
            verdict: pApp.craftScore >= 90 ? 'lgtm' : 'mixed',
            isPersonalReview: false,
          })
        }
      }
    }

    // 5. Calculate aggregate scores & consensus delta
    const totalReviews = reviews.length
    const avgCraft =
      totalReviews > 0
        ? Math.round(reviews.reduce((sum, r) => sum + r.craftScore, 0) / totalReviews)
        : items.length > 0
          ? Math.round(items.reduce((sum, i) => sum + i.craftScore, 0) / items.length)
          : 96

    const avgUtility =
      totalReviews > 0
        ? Math.round(reviews.reduce((sum, r) => sum + r.utilityScore, 0) / totalReviews)
        : items.length > 0
          ? Math.round(items.reduce((sum, i) => sum + i.utilityScore, 0) / items.length)
          : 88

    // 6. Identify champion (#1 ranked specimen)
    const champion = items[0] || {
      name: 'Raycast',
      slug: 'raycast',
      category: 'Productivity & Launcher',
      tagline: 'Supercharged productivity launcher replacing spotlight.',
      iconUrl: '/assets/raycast_favicon.png',
      craftScore: 98,
      utilityScore: 94,
      status: 'Certified LGTM',
      headline: 'The Gold Standard of Keyboard-First Native Desktop Software',
      quote: 'Raycast completely replaced Spotlight on day one. Hotkey response times are consistently under 16ms.',
      verdict: 'lgtm',
      isPersonalReview: false,
    }

    // 7. Resolve Archetype
    let archetype = PRESET_ARCHETYPES[profile.handle]
    if (!archetype) {
      archetype = computeDynamicArchetype(avgCraft, avgUtility, Math.max(1, totalReviews))
    }

    // Dynamic issue number (Season 2026 Issue #04)
    const issueNumber = 4

    return {
      profile: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl || null,
        role: profile.role,
        badge: profile.badge || 'Founding Critic',
        criticNumber: profile.criticNumber || 1,
        reviewsCount: Math.max(profile.reviewsCount || 0, totalReviews),
      },
      issueNumber,
      champion,
      topSpecimens: items.slice(0, 3),
      allSpecimensCount: Math.max(totalReviews, items.length),
      avgCraft,
      avgUtility,
      archetype,
    }
  },
})

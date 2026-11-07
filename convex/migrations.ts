import { mutation } from './_generated/server'

/**
 * Cleanup mutation to remove legacy prototype documents from tables
 * that have been removed from schema.ts (e.g. dropBallots, drops).
 *
 * Once all documents in an out-of-schema table are deleted, Convex
 * automatically drops the table from the dashboard sidebar.
 */
export const clearLegacyTables = mutation({
  args: {},
  handler: async (ctx) => {
    let dropBallotsDeleted = 0
    let dropsDeleted = 0

    // 1. Clear dropBallots
    try {
      const ballots = await ctx.db.query('dropBallots' as any).collect()
      for (const ballot of ballots) {
        await ctx.db.delete(ballot._id)
        dropBallotsDeleted++
      }
    } catch {
      // table might already be empty or removed
    }

    // 2. Clear drops
    try {
      const drops = await ctx.db.query('drops' as any).collect()
      for (const drop of drops) {
        await ctx.db.delete(drop._id)
        dropsDeleted++
      }
    } catch {
      // table might already be empty or removed
    }

    return {
      dropBallotsDeleted,
      dropsDeleted,
      success: true,
      message:
        'Legacy documents deleted. The tables will disappear from your Convex dashboard.',
    }
  },
})

import { cronJobs } from 'convex/server'
import { api } from './_generated/api'

const crons = cronJobs()

// Periodically apply time-decay gravity to all apps' trending scores (every 30 minutes)
crons.interval(
  'recalculate-trending-scores',
  { minutes: 30 },
  api.trending.recalculateAllTrendingScores,
)

export default crons

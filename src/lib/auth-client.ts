import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { clientEnv } from './env'

export const authClient = createAuthClient({
  baseURL: clientEnv.siteUrl,
  basePath: '/api/auth',
  plugins: [convexClient()],
})

import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { components } from './_generated/api'
import { query } from './_generated/server'
import authConfig from './auth.config'

const authComponent = createClient(components.betterAuth)

const requiredConvexEnv = (
  name:
    | 'BETTER_AUTH_SECRET'
    | 'SITE_URL'
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET',
) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not set in the Convex deployment environment.`)
  }

  return value
}

type AuthContext = Parameters<typeof authComponent.adapter>[0]
type AuthUserContext = Parameters<typeof authComponent.getAuthUser>[0]

export const createAuth = (ctx: AuthContext) =>
  betterAuth({
    baseURL: requiredConvexEnv('SITE_URL'),
    secret: requiredConvexEnv('BETTER_AUTH_SECRET'),
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: requiredConvexEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requiredConvexEnv('GOOGLE_CLIENT_SECRET'),
      },
    },
    plugins: [
      convex({
        authConfig,
      }),
    ],
  })

export { authComponent }

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx as AuthUserContext)
  },
})

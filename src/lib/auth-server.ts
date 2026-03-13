import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

const requiredServerEnv = (
  name: 'VITE_CONVEX_URL' | 'VITE_CONVEX_SITE_URL',
) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `${name} is not set. Add it to /Volumes/External/Start/.env.local before using Better Auth.`,
    )
  }

  return value
}

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  convexUrl: requiredServerEnv('VITE_CONVEX_URL'),
  convexSiteUrl: requiredServerEnv('VITE_CONVEX_SITE_URL'),
})

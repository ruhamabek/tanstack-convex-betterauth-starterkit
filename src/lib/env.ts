const requiredClientEnv = (
  name: 'VITE_CONVEX_URL' | 'VITE_CONVEX_SITE_URL' | 'VITE_SITE_URL',
) => {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(
      `${name} is not set. Add it to /Volumes/External/Start/.env.local before starting the app.`,
    )
  }

  return value
}

export const clientEnv = {
  convexUrl: requiredClientEnv('VITE_CONVEX_URL'),
  convexSiteUrl: requiredClientEnv('VITE_CONVEX_SITE_URL'),
  siteUrl: requiredClientEnv('VITE_SITE_URL'),
}

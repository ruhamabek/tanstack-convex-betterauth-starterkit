import { authComponent } from './auth'

type AuthUserContext = Parameters<typeof authComponent.getAuthUser>[0]

export async function requireAuthUser(ctx: unknown) {
  const user = await authComponent.getAuthUser(ctx as AuthUserContext)
  if (!user) {
    throw new Error('Unauthenticated')
  }
  return user
}

export async function getOptionalAuthUser(ctx: unknown) {
  return await authComponent.safeGetAuthUser(ctx as AuthUserContext)
}

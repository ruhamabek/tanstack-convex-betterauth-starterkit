import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'

export interface RouterContext {
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
  token: string | undefined
  isAuthenticated: boolean
}

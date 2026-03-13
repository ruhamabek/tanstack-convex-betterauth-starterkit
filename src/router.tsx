import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { clientEnv } from './lib/env'
import type { RouterContext } from './lib/router-context'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const convexClient = new ConvexReactClient(clientEnv.convexUrl)
  const convexQueryClient = new ConvexQueryClient(convexClient, {
    expectAuth: true,
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: convexQueryClient.queryFn(),
        queryKeyHashFn: convexQueryClient.hashFn(),
      },
    },
  })

  convexQueryClient.connect(queryClient)

  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
      convexQueryClient,
      token: undefined,
      isAuthenticated: false,
    } satisfies RouterContext,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    ),
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

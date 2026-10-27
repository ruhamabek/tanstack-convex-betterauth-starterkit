import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { authClient } from '../lib/auth-client'
import type { RouterContext } from '../lib/router-context'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('dark');root.removeAttribute('data-theme');root.style.colorScheme='light';}catch(e){}})();`

const getAuthToken = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getToken } = await import('../lib/auth-server')
    return (await getToken()) ?? null
  } catch {
    // If Convex is unreachable or times out during SSR, gracefully fallback to unauthenticated
    return null
  }
})

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    try {
      const token = await getAuthToken()
      if (token) {
        context.convexQueryClient.serverHttpClient?.setAuth(token)
      } else {
        context.convexQueryClient.serverHttpClient?.clearAuth()
      }

      return {
        token,
        isAuthenticated: Boolean(token),
      }
    } catch {
      context.convexQueryClient.serverHttpClient?.clearAuth()
      return {
        token: null,
        isAuthenticated: false,
      }
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start with Better Auth + Convex',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  const { convexQueryClient, token } = Route.useRouteContext()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login'

  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={token ?? null}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
          <HeadContent />
        </head>
        <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
          {!isAuthPage && <Header />}
          <Outlet />
          {!isAuthPage && <Footer />}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}

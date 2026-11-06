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
        rel: 'preload',
        href: '/fonts/geist-sans/Geist-Variable.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#faf9f5] text-neutral-900">
      <div className="max-w-md p-6 rounded-2xl bg-white border border-black/10 shadow-lg space-y-4">
        <div className="size-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto font-bold text-lg">
          !
        </div>
        <h2 className="text-lg font-black tracking-tight">Something went wrong</h2>
        <p className="text-xs text-neutral-500 leading-relaxed font-mono">
          {error.message || 'An unexpected navigation or network error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="w-full py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  ),
  component: RootDocument,
})

function RootDocument() {
  const { convexQueryClient, token } = Route.useRouteContext()
  const location = useLocation()
  const isPublicMarketingPage =
    location.pathname === '/' || location.pathname === '/stageshow'
  const isStandaloneApp = !isPublicMarketingPage

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
          {!isStandaloneApp && <Header />}
          <Outlet />
          {!isStandaloneApp && <Footer />}
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

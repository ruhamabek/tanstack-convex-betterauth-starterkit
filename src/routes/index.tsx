import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { GoogleSignInButton, SignOutButton } from '../components/AuthControls'

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    if (!context.isAuthenticated) {
      return null
    }

    await context.queryClient.ensureQueryData(
      context.convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
    )

    return null
  },
  component: App,
})

function App() {
  const { convexQueryClient, isAuthenticated } = Route.useRouteContext()
  const { data: user } = useQuery({
    ...convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
    enabled: isAuthenticated,
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Better Auth + Convex</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Google sign-in for TanStack Start, backed by Convex.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Better Auth issues the session, Convex owns the auth backend, and the
          app server only proxies <code>/api/auth</code> plus route protection.
        </p>
        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
              >
                Open Todo List
              </Link>
              <SignOutButton className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]" />
            </>
          ) : (
            <>
              <GoogleSignInButton
                callbackURL="/dashboard"
                className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
              />
              <a
                href="https://better-auth.com/docs/integrations/convex"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
              >
                Convex Auth Docs
              </a>
            </>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            'Convex-backed Sessions',
            'Tokens are minted through Better Auth and resolved server-side for SSR queries.',
          ],
          [
            'Google OAuth',
            'Users sign in through Google and land in the protected dashboard route.',
          ],
          [
            'Protected Routing',
            'The dashboard lives under a pathless protected layout and redirects guests home.',
          ],
          [
            'Live Convex Queries',
            'Authenticated queries stream current user data without hand-written REST endpoints.',
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">
          {isAuthenticated ? 'Current Session' : 'Setup Notes'}
        </p>
        {isAuthenticated ? (
          <div className="space-y-3 text-sm text-[var(--sea-ink-soft)]">
            <p className="m-0">
              Signed in as{' '}
              <span className="font-semibold text-[var(--sea-ink)]">
                {user?.name ?? user?.email ?? 'your Google account'}
              </span>
              .
            </p>
            <p className="m-0">
              Your profile is coming from <code>api.auth.getCurrentUser</code>{' '}
              through Convex, not directly from the browser session object.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
            <li>
              Run <code>npm run convex:dev</code> to create or connect a Convex
              dev deployment.
            </li>
            <li>
              Set the Convex deployment env vars for{' '}
              <code>BETTER_AUTH_SECRET</code>, <code>SITE_URL</code>, and the
              Google OAuth credentials.
            </li>
            <li>
              Add the client-side values in <code>.env.local</code> so the app
              can reach both your Convex deployment and the auth proxy route.
            </li>
          </ul>
        )}
      </section>
    </main>
  )
}

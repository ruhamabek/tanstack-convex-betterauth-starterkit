import { Link } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { GoogleSignInButton, SignOutButton } from './AuthControls'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { data: session, isPending } = authClient.useSession()
  const displayName = session?.user.name ?? session?.user.email

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Start Todo
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Home
          </Link>
          {session?.session ? (
            <Link
              to="/dashboard"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Todos
            </Link>
          ) : null}
          <a
            href="https://better-auth.com/docs/integrations/convex"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Better Auth Docs
          </a>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <div className="hidden rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink-soft)] sm:block">
            {isPending ? 'Checking session…' : displayName ?? 'Guest'}
          </div>
          {session?.session ? (
            <SignOutButton className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--sea-ink)]" />
          ) : (
            <GoogleSignInButton
              callbackURL="/dashboard"
              className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)]"
            />
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

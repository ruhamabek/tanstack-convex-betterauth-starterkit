export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-20 px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} TanStack Start, Better Auth, and Convex.
        </p>
        <p className="island-kicker m-0">Google OAuth on Convex</p>
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <a
          href="https://better-auth.com/docs/integrations/tanstack"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          <span className="text-sm font-semibold">TanStack guide</span>
        </a>
        <a
          href="https://labs.convex.dev/better-auth/framework-guides/tanstack-start"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          <span className="text-sm font-semibold">Convex guide</span>
        </a>
      </div>
    </footer>
  )
}

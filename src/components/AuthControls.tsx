import { LoaderCircle, LogIn, LogOut } from 'lucide-react'
import { useTransition } from 'react'
import { authClient } from '../lib/auth-client'

function classes(baseClassName: string, className?: string) {
  return className ? `${baseClassName} ${className}` : baseClassName
}

export function GoogleSignInButton({
  callbackURL = '/dashboard',
  className,
}: {
  callbackURL?: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await authClient.signIn.social({
            provider: 'google',
            callbackURL,
          })
        })
      }}
      className={classes(
        'inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
    >
      {isPending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      <span>{isPending ? 'Redirecting…' : 'Continue with Google'}</span>
    </button>
  )
}

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
       onClick={() => {
        startTransition(async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                location.reload()
              },
            },
          })
        })
      }}
      className={classes(
        'inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
    >
      {isPending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{isPending ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}

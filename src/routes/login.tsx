import { useState, useTransition } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { authClient } from '../lib/auth-client'
import Logo from '../components/Logo'
import { useAppForm } from '../components/form'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function GitHubIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23.2c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.6C3.7 20.4 7.5 23.2 12 23.2z"
      />
    </svg>
  )
}
 
// Living editable showcase content for the right panel (can be changed dynamically or in code)
const SHOWCASE_DATA = {
  headline: (
    <>
      Dissect the craft.
      <br />
      Log your takes.
    </>
  ),
  subtitle: 'The Rotten Tomatoes for software craft.',
  scorecard: {
    category: 'Software craft scorecard',
    appTitle: 'Linear v2.4',
    appIcon: '/assets/linear_icon.png',
    craftScore: '96%',
    craftLabel: 'Craft (Builders)',
    utilityScore: '89%',
    utilityLabel: 'Utility (Users)',
    quote:
      '“Spicy review with tomato critic, and being verbally intense appetite for software craft.”',
    author: '@subgrid_sorcerer',
  },
}

const authSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success' | 'info'
    text: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: authSchema,
    },
    onSubmit: async ({ value }) => {
      setStatusMessage(null)
      try {
        if (authMode === 'signin') {
          const res = await authClient.signIn.email({
            email: value.email,
            password: value.password,
            callbackURL: '/dashboard',
          })

          if (res?.error) {
            const rawMessage = res.error.message || ''
            const text =
              rawMessage.toLowerCase().includes('user not found')
                ? "No critic account found with this email. Switch to 'Create Account' above to claim your desk."
                : rawMessage || 'Invalid email or password. Please try again.'
            setStatusMessage({
              type: 'error',
              text,
            })
            return
          }

          setStatusMessage({
            type: 'success',
            text: 'Signing you in… redirecting to desk.',
          })
          window.location.href = '/dashboard'
        } else {
          const res = await authClient.signUp.email({
            email: value.email,
            password: value.password,
            name: value.email.split('@')[0],
            callbackURL: '/dashboard',
          })

          if (res?.error) {
            setStatusMessage({
              type: 'error',
              text: res.error.message || 'Failed to create account. Please try again.',
            })
            return
          }

          setStatusMessage({
            type: 'success',
            text: 'Account created! Redirecting to desk…',
          })
          window.location.href = '/dashboard'
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text:
            err?.message ||
            'Authentication service requires provider credentials in environment.',
        })
      }
    },
  })

  const handleSocialSignIn = (provider: 'google' | 'github') => {
    setStatusMessage(null)
    startTransition(async () => {
      try {
        const res = await authClient.signIn.social({
          provider,
          callbackURL: '/dashboard',
        })
        if (res?.error) {
          setStatusMessage({
            type: 'error',
            text: res.error.message || `Failed to connect with ${provider}.`,
          })
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err?.message || `Failed to connect with ${provider}. Please check credentials.`,
        })
      }
    })
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-canvas relative overflow-x-hidden selection:bg-[rgba(79,184,178,0.24)]">
      {/* =====================================================================
          LEFT 50%: Warm Editorial Cream Authentication Panel
         ===================================================================== */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-canvas">
        {/* Top Header Row */}
        <header className="flex items-center justify-between w-full">
          <Logo size="md" />

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 bg-white/90 hover:bg-white text-xs font-bold !text-foreground !no-underline shadow-2xs transition-all hover:shadow-xs hover:scale-102 active:scale-95"
          >
            <span>←</span>
            <span>Back to desk</span>
          </Link>
        </header>

        {/* Center Auth Form Card */}
        <div className="w-full max-w-[390px] mx-auto my-auto py-8">
          {/* Editorial Segmented Control Pill: [ Sign In | Create Account ] */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center p-1 rounded-full bg-desk border border-black/5 shadow-2xs text-neutral-400 font-mono text-xs select-none">
               <button
                type="button"
                onClick={() => {
                  setAuthMode('signin')
                  setStatusMessage(null)
                  form.reset()
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer font-sans ${
                  authMode === 'signin'
                    ? 'bg-white text-foreground shadow-xs'
                    : 'text-neutral-500 hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <span className="px-1 text-neutral-300 font-light">|</span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup')
                  setStatusMessage(null)
                  form.reset()
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer font-sans ${
                  authMode === 'signup'
                    ? 'bg-white text-foreground shadow-xs'
                    : 'text-neutral-500 hover:text-foreground'
                }`}
              >
                Create Account
              </button>
             </div>
          </div>

          {/* Heading & Badge */}
          <div className="text-center mb-7">
            <h1 className="text-3xl sm:text-[34px] font-black text-foreground tracking-tight leading-tight">
              {authMode === 'signin'
                ? 'Welcome back, critic.'
                : 'Claim your critic desk.'}
            </h1>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`mb-4 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 leading-relaxed ${
                statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Social Auth Pill Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSocialSignIn('github')}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-full border border-black/15 bg-white hover:bg-neutral-50 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-black/30 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <GitHubIcon className="size-4 shrink-0" />
              <span>Continue with GitHub</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSocialSignIn('google')}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-full border border-black/15 bg-white hover:bg-neutral-50 text-xs font-bold text-foreground shadow-2xs transition-all hover:border-black/30 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <GoogleIcon className="size-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-black/10" />
            <span className="absolute bg-canvas px-3 text-[11px] font-medium text-neutral-400">
              or
            </span>
          </div>

          {/* Pill Credentials Form with TanStack Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-3"
          >
            <form.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                />
              )}
            />

            <form.AppField
              name="password"
              children={(field) => (
                <field.TextField
                  type="password"
                  placeholder="Password"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                />
              )}
            />

            <form.AppForm>
              <form.SubmitButton
                isPending={isPending}
                loadingLabel="Connecting…"
                className="mt-3"
              >
                {authMode === 'signin' ? 'Sign in' : 'Create Critic Account'}
              </form.SubmitButton>
            </form.AppForm>
          </form>
        </div>
      </section>

      {/* =====================================================================
          RIGHT 50%: LIVING DOM STUDIO SHOWCASE
          - Headline & subtitle: Living DOM text, completely editable in code
          - Scorecard: Living DOM component with tilt, scores, quote & attribution
          - Certified LGTM stamp + Sitting Tomato Critic
         ===================================================================== */}
      <section
        className="hidden lg:flex lg:w-1/2 min-h-screen bg-studio items-center justify-center p-8 xl:p-14 relative select-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at 55% 48%, var(--studio-surface) 0%, var(--studio) 75%)',
        }}
      >
        {/* Content Container: Headline + Scorecard */}
        <div className="w-full max-w-[420px] sm:max-w-[440px] flex flex-col items-start relative z-10 my-auto">
          {/* Editable Headline & Subtitle */}
          <div className="mb-7 select-none">
            <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-black tracking-tight text-white leading-[1.08]">
              {SHOWCASE_DATA.headline}
            </h2>
            <p className="mt-3 text-sm sm:text-base font-medium text-white/60">
              {SHOWCASE_DATA.subtitle}
            </p>
          </div>

          {/* Scorecard Stage with 3D Tilt */}
          <div className="relative w-full">
            <div
              className="w-full bg-scorecard rounded-[30px] border border-black/5 p-7 sm:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.55),0_12px_24px_-8px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:rotate-[-2deg]"
              style={{
                transform: 'rotate(-4.5deg)',
                transformOrigin: 'center center',
              }}
            >
              {/* Card Top: Category & App Identity */}
              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  {SHOWCASE_DATA.scorecard.category}
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <img
                    src={SHOWCASE_DATA.scorecard.appIcon}
                    alt={SHOWCASE_DATA.scorecard.appTitle}
                    className="size-11 sm:size-12 rounded-xl shadow-xs shrink-0 select-none pointer-events-none"
                  />
                  <span className="text-2xl sm:text-[27px] font-black tracking-tight text-foreground">
                    {SHOWCASE_DATA.scorecard.appTitle}
                  </span>
                </div>
              </div>

              {/* Horizontal Divider */}
              <div className="border-t border-black/10 my-4.5" />

              {/* Dual Score Columns */}
              <div className="grid grid-cols-2 divide-x divide-black/10 py-1">
                <div className="pr-4">
                  <div className="text-4xl sm:text-[42px] font-black text-foreground tracking-tight leading-none">
                    {SHOWCASE_DATA.scorecard.craftScore}
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-600 mt-2">
                    {SHOWCASE_DATA.scorecard.craftLabel}
                  </div>
                </div>
                <div className="pl-4">
                  <div className="text-4xl sm:text-[42px] font-black text-foreground tracking-tight leading-none">
                    {SHOWCASE_DATA.scorecard.utilityScore}
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-600 mt-2">
                    {SHOWCASE_DATA.scorecard.utilityLabel}
                  </div>
                </div>
              </div>

              {/* Horizontal Divider */}
              <div className="border-t border-black/10 my-4.5" />

              {/* Review Quote & Critic Attribution */}
              <div className="relative pb-1">
                <p className="text-xs sm:text-[13px] leading-relaxed text-neutral-800 font-medium italic max-w-[210px] sm:max-w-[230px]">
                  {SHOWCASE_DATA.scorecard.quote}
                </p>
                <p className="text-xs font-bold text-neutral-900 mt-2.5">
                  {SHOWCASE_DATA.scorecard.author}
                </p>

                {/* CERTIFIED LGTM Rubber Stamp (Authentically placed on card surface) */}
                <img
                  src="/assets/stamp_certified_lgtm.png"
                  alt="Certified LGTM"
                  className="absolute bottom-0 right-2 w-28 sm:w-32 rotate-[2deg] drop-shadow-xs select-none pointer-events-none z-10 opacity-95"
                />
              </div>
            </div>

            {/* Tomato Critic Mascot (sitting grounded beside scorecard) */}
            <img
              src="/assets/tomato_critic_sitting.png"
              alt="Tomato Critic"
              className="absolute -bottom-8 -right-10 w-28 sm:w-32 drop-shadow-2xl select-none pointer-events-none z-20"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          CENTER SPLIT DIVIDER: Peeking Green Builder Mascot
          Anchored at left: 50% at root level (z-40) so it's NEVER clipped!
         ===================================================================== */}
      <div
        className="hidden lg:block absolute left-1/2 top-1/2 z-40 pointer-events-none select-none"
        style={{
          // In green_builder_peeking_clean.png (320px wide), the vertical divider edge is at 216px (67.5%).
          // Shifting by -67.5% places the divider edge exactly at 50vw!
          transform: 'translate(-67.5%, -50%)',
        }}
        aria-hidden="true"
      >
        <img
          src="/assets/green_builder_peeking_clean.png"
          alt="Green Builder Mascot"
          className="w-[160px] xl:w-[185px] max-w-none drop-shadow-xl"
        />
      </div>
    </main>
  )
}

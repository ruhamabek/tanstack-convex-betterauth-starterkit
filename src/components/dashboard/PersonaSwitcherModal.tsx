import { useState } from 'react'
import { Check, RefreshCw, ArrowRight, ShieldCheck, User } from 'lucide-react'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { authClient } from '../../lib/auth-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import CriticAvatar from '../CriticAvatar'

export interface PersonaSwitcherModalProps {
  isOpen: boolean
  onClose: () => void
  currentHandle?: string
}

export const DEMO_PERSONAS = [
  {
    handle: 'bananas',
    email: 'bananas@screenlog.dev',
    displayName: 'bananas',
    role: 'Founding Software Critic',
    criticNumber: 1,
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=bananas&backgroundColor=ffd866',
    bio: 'Taste tester of software craft. Measuring sub-millisecond interaction delays.',
  },
  {
    handle: 'subgrid_sorcerer',
    email: 'marcus@screenlog.dev',
    displayName: 'Marcus Vance',
    role: 'Staff Frontend Engineer',
    criticNumber: 2,
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=marcus_vance&backgroundColor=d1f4ff',
    bio: 'Subgrid rhythm & CSS layout optimizer. Reject unquantified re-renders.',
  },
  {
    handle: 'pixel_snob',
    email: 'elena@screenlog.dev',
    displayName: 'Elena Rostova',
    role: 'Principal Product Designer',
    criticNumber: 3,
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=elena_rostova&backgroundColor=ffd5d5',
    bio: 'Typography weight hierarchies and optical kerning purist.',
  },
  {
    handle: 'kerning_ghost',
    email: 'alex@screenlog.dev',
    displayName: 'Alex Thorne',
    role: 'Verified Builder & Systems Architect',
    criticNumber: 4,
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=alex_thorne&backgroundColor=e6d8ff',
    bio: 'Font rendering engines and macOS native desktop responsiveness.',
  },
  {
    handle: 'motion_curator',
    email: 'sarah@screenlog.dev',
    displayName: 'Sarah Lin',
    role: 'Design Technologist & Motion Director',
    criticNumber: 5,
    avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=sarah_lin&backgroundColor=dcfce7',
    bio: 'Frame-by-frame critique of spring physics and easing curves.',
  },
]

export default function PersonaSwitcherModal({
  isOpen,
  onClose,
  currentHandle,
}: PersonaSwitcherModalProps) {
  const [switchingHandle, setSwitchingHandle] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null)

  const seedPlatformDataMutation = useConvexMutation(api.seed.seedPlatformData)
  const linkDemoUserMutation = useConvexMutation(api.seed.linkDemoUserToProfile)

  const handleSwitch = async (persona: (typeof DEMO_PERSONAS)[0]) => {
    if (persona.handle === currentHandle) return

    setSwitchingHandle(persona.handle)
    try {
      // 1. Sign out of current Better Auth session
      try {
        await authClient.signOut()
      } catch {
        // ignore
      }

      // 2. Sign in as the demo persona, or auto-create account on first switch
      const password = 'critic1234'
      const signInRes = await authClient.signIn.email({
        email: persona.email,
        password,
      })

      if (signInRes?.error) {
        // First time signing in with this persona: auto-create the Better Auth account
        const signUpRes = await authClient.signUp.email({
          email: persona.email,
          password,
          name: persona.displayName,
        })
        if (signUpRes?.error) {
          throw new Error(signUpRes.error.message || 'Authentication failed')
        }
      }

      // 3. Link current Better Auth user to the pre-seeded profile if authenticated
      try {
        await linkDemoUserMutation({ handle: persona.handle })
      } catch {
        // fallback to ensureMyProfile on reload
      }

      // 4. Reload to update the full session state
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Failed to switch persona:', err)
      setSwitchingHandle(null)
    }
  }

  const handleSeedData = async () => {
    setIsSeeding(true)
    setSeedSuccess(null)
    try {
      const res = await seedPlatformDataMutation({ forceResetLegacyReviews: true })
      setSeedSuccess(`Seeded ${res.seededApps} apps, ${res.seededCritics} critics, and ${res.seededReviews} reviews!`)
      setTimeout(() => setSeedSuccess(null), 4000)
    } catch (err: any) {
      console.error('Failed to seed:', err)
    } finally {
      setIsSeeding(false)
    }
  }

  const cleanCurrentHandle = currentHandle?.toLowerCase().replace(/^@/, '')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-canvas border border-black/10 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-black/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <User className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                Switch Critic Persona
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Test the platform across different critic accounts with real reviews and followers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Persona Selection List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {DEMO_PERSONAS.map((persona) => {
            const isActive = cleanCurrentHandle === persona.handle.toLowerCase()
            const isSwitching = switchingHandle === persona.handle

            return (
              <div
                key={persona.handle}
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive
                    ? 'bg-amber-500/5 border-amber-500/30 shadow-2xs'
                    : 'bg-white border-black/10 hover:border-black/20 hover:bg-neutral-50/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CriticAvatar
                    avatarUrl={persona.avatarUrl}
                    seed={persona.handle}
                    size="md"
                    className="shrink-0 border border-black/10 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-foreground truncate">
                        {persona.displayName}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-900 border border-amber-600/20 shrink-0">
                        #{persona.criticNumber}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                          <Check className="size-2.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-neutral-500 truncate mt-0.5">
                      @{persona.handle} · <span className="text-neutral-400 font-sans">{persona.role}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5 italic">
                      "{persona.bio}"
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isActive ? (
                    <span className="text-xs font-bold text-neutral-400 px-3 py-1.5 rounded-full bg-black/5">
                      Current
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={switchingHandle !== null}
                      onClick={() => handleSwitch(persona)}
                      className="px-3 py-1.5 rounded-full bg-foreground hover:bg-neutral-800 text-background text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                    >
                      {isSwitching ? (
                        <>
                          <RefreshCw className="size-3 animate-spin" />
                          <span>Switching…</span>
                        </>
                      ) : (
                        <>
                          <span>Switch</span>
                          <ArrowRight className="size-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Database Seeding Action Banner */}
        <div className="mt-4 pt-4 border-t border-black/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>Test password for all demo accounts: <code className="font-mono font-bold text-foreground bg-black/5 px-1 rounded">critic1234</code></span>
          </div>

          <button
            type="button"
            disabled={isSeeding}
            onClick={handleSeedData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/15 bg-white hover:bg-neutral-100 text-xs font-bold text-neutral-800 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Seed Linear, Raycast, Arc Browser, Supabase, Cron, Cash Card + 5 Critics and Reviews"
          >
            <RefreshCw className={`size-3 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding…' : 'Seed / Refresh Data'}</span>
          </button>
        </div>

        {seedSuccess && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-800 text-center animate-fade-in">
            {seedSuccess}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

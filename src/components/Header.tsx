import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { X, Sparkles } from 'lucide-react'
import { GoogleSignInButton } from './AuthControls'
import { authClient } from '../lib/auth-client'

export default function Header() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { data: session } = authClient.useSession()

  return (
    <>
      <header className="fixed top-4 sm:top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4 transition-all duration-300">
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 md:gap-8 rounded-full bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-black/[0.07] transition-all hover:shadow-[0_12px_36px_rgb(0,0,0,0.12)]"
        >
          {/* Left: Brand Emblem + Name (Haven style) */}
          <Link
            to="/"
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 text-sm font-bold tracking-tight !text-[#111215] !no-underline transition hover:opacity-85"
          >
            {/* Warm amber geometric emblem inspired by reference icon */}
            <div className="size-5.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center shadow-xs">
              <div className="size-2.5 rounded-full bg-white shadow-2xs" />
            </div>
            <span className="text-[15px] font-extrabold tracking-tight !text-[#111215]">
              Screenlog
            </span>
          </Link>

          {/* Center: Nav Links */}
          <div className="hidden sm:flex items-center gap-1 md:gap-1.5">
            <Link
              to="/"
              className="text-xs md:text-[13px] font-medium !text-[#111215] !no-underline px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
            >
              Home
            </Link>
            <a
              href="/#consensus"
              className="text-xs md:text-[13px] font-medium !text-[#111215] !no-underline px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
            >
              Consensus
            </a>
            <a
              href="/#drops"
              className="text-xs md:text-[13px] font-medium !text-[#111215] !no-underline px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
            >
              Drops
            </a>
            <a
              href="/#card-maker"
              className="text-xs md:text-[13px] font-medium !text-[#111215] !no-underline px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
            >
              Scorecard
            </a>
            <Link
              to="/dashboard"
              className="text-xs md:text-[13px] font-medium !text-[#111215] !no-underline px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
            >
              Dashboard
            </Link>
          </div>

          {/* Right: Black Pill Action Button */}
          {session?.user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[#111215] px-4 sm:px-5 py-2 text-xs font-semibold !text-white !no-underline shadow-xs transition hover:bg-neutral-800 active:scale-95 whitespace-nowrap"
            >
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#111215] px-4 sm:px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Login
            </button>
          )}
        </nav>
      </header>

      {/* =========================================================================
          SIGN IN MODAL
         ========================================================================= */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition cursor-pointer text-neutral-400 hover:text-black"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Emblem */}
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Sparkles className="size-6 text-amber-600" />
            </div>

            <h3 className="text-xl font-black text-[#111215] tracking-tight">
              Welcome to Screenlog
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 mb-6 leading-relaxed">
              The Rotten Tomatoes for software craft. Sign in to submit products, vote on consensus, and review audits.
            </p>

            <div className="flex flex-col gap-3">
              <GoogleSignInButton
                callbackURL="/dashboard"
                className="w-full justify-center rounded-xl bg-black px-4 py-3 text-xs font-bold text-white transition hover:bg-neutral-800 cursor-pointer shadow-xs"
              />
            </div>

            <p className="text-[11px] text-neutral-400 mt-4">
              Protected by Better Auth & Convex.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

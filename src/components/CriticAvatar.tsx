import { useState, useEffect } from 'react'
import { resolveAvatarUrl, generateBauhausDataUri } from '../lib/avatar'

export type CriticAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface CriticAvatarProps {
  avatarUrl?: string | null
  seed?: string
  size?: CriticAvatarSize
  className?: string
  alt?: string
  rounded?: 'squircle' | 'full'
  interactive?: boolean
  hasStory?: boolean
  onStoryClick?: (e?: React.MouseEvent) => void
}

const SIZE_CLASSES: Record<CriticAvatarSize, string> = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
  '2xl': 'size-24',
}

const ROUNDED_CLASSES = {
  squircle: 'rounded-2xl',
  full: 'rounded-full',
}

export default function CriticAvatar({
  avatarUrl,
  seed = 'critic',
  size = 'md',
  className = '',
  alt = 'Critic Avatar',
  rounded = 'squircle',
  interactive = false,
  hasStory = false,
  onStoryClick,
}: CriticAvatarProps) {
  const initialUrl = resolveAvatarUrl(avatarUrl, seed)
  const [currentSrc, setCurrentSrc] = useState(initialUrl)
  const [hasError, setHasError] = useState(false)

  // Re-sync when prop changes
  useEffect(() => {
    setCurrentSrc(resolveAvatarUrl(avatarUrl, seed))
    setHasError(false)
  }, [avatarUrl, seed])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // Fallback instantly to built-in offline Bauhaus SVG (100% reliable)
      setCurrentSrc(generateBauhausDataUri(seed))
    }
  }

  const sizeClass = SIZE_CLASSES[size]
  const roundedClass = ROUNDED_CLASSES[rounded]

  if (hasStory) {
    const ringPadding = size === '2xl' || size === 'xl' ? 'p-1 sm:p-1.5' : 'p-[2.5px]'
    const gapPadding = size === '2xl' || size === 'xl' ? 'p-[3px] sm:p-1' : 'p-0.5'

    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onStoryClick?.(e)
        }}
        title="Watch Critic Showreel"
        className={`relative inline-flex items-center justify-center ${ringPadding} rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md group ${sizeClass} ${className}`}
      >
        <div className={`bg-canvas ${gapPadding} rounded-full size-full flex items-center justify-center`}>
          <div
            className="relative inline-flex items-center justify-center shrink-0 bg-desk overflow-hidden select-none size-full rounded-full"
          >
            <img
              src={currentSrc}
              alt={alt}
              onError={handleError}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </button>
    )
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 bg-desk border border-black/10 shadow-2xs overflow-hidden select-none ${sizeClass} ${roundedClass} ${
        interactive ? 'transition-transform hover:scale-105' : ''
      } ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt}
        onError={handleError}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

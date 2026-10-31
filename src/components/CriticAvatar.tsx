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
        className="w-full h-full object-cover p-0.5"
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Dices,
  RotateCcw,
  Check,
  Pencil,
  Palette,
  Boxes,
  Bot,
  Smile,
  Shapes,
} from 'lucide-react'
import CriticAvatar from './CriticAvatar'
import {
  AVATAR_STYLES,
  getAvatarUrl,
  parseAvatarUrl,
} from '../lib/avatar'
import type { AvatarStyleId } from '../lib/avatar'

const STYLE_ICONS: Record<AvatarStyleId, React.ComponentType<{ className?: string }>> = {
  notionists: Pencil,
  micah: Palette,
  bauhaus: Boxes,
  bottts: Bot,
  lorelei: Smile,
  shapes: Shapes,
}

export interface AvatarPickerProps {
  value?: string
  baseSeed: string
  onChange: (avatarUrl: string) => void
}

export default function AvatarPicker({
  value,
  baseSeed,
  onChange,
}: AvatarPickerProps) {
  // Determine current active style & seed
  const parsed = parseAvatarUrl(value)
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId>(
    parsed?.style ?? 'notionists',
  )
  const [activeSeed, setActiveSeed] = useState<string>(
    parsed?.seed ?? (baseSeed || 'critic'),
  )

  // When baseSeed changes (e.g. user edits handle), update seed if it wasn't randomized
  useEffect(() => {
    if (!parsed) {
      const clean = baseSeed.trim().toLowerCase() || 'critic'
      setActiveSeed(clean)
      onChange(getAvatarUrl(selectedStyle, clean))
    }
  }, [baseSeed])

  const handleSelectStyle = (styleId: AvatarStyleId) => {
    setSelectedStyle(styleId)
    const newUrl = getAvatarUrl(styleId, activeSeed)
    onChange(newUrl)
  }

  const handleRollSeed = () => {
    // Generate a punchy randomized variation suffix
    const randomSuffix = Math.random().toString(36).slice(2, 6)
    const cleanBase = baseSeed.trim().toLowerCase() || 'critic'
    const newSeed = `${cleanBase}_${randomSuffix}`
    setActiveSeed(newSeed)
    onChange(getAvatarUrl(selectedStyle, newSeed))
  }

  const handleResetToHandle = () => {
    const cleanBase = baseSeed.trim().toLowerCase() || 'critic'
    setActiveSeed(cleanBase)
    onChange(getAvatarUrl(selectedStyle, cleanBase))
  }

  const isCustomSeed = activeSeed !== (baseSeed.trim().toLowerCase() || 'critic')

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-desk border border-black/10 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Large Avatar Live Preview */}
        <div className="relative group">
          <CriticAvatar
            avatarUrl={value}
            seed={activeSeed}
            size="xl"
            className="shadow-sm border-2 border-black/10"
          />
          <button
            type="button"
            onClick={handleRollSeed}
            title="Roll another variation"
            className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-neutral-800 transition active:scale-90 cursor-pointer"
          >
            <Dices className="size-4" />
          </button>
        </div>

        {/* Info & Roll Controls */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Critic Persona Avatar
            </span>
            {isCustomSeed && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 font-semibold border border-amber-500/20">
                Rolled Look
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-600">
            Pick a signature critic style or roll the dice for unique hairstyles, accessories, and craft geometries.
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={handleRollSeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-xs font-bold text-foreground border border-black/10 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Dices className="size-3.5 text-amber-600" />
              <span>Roll Look</span>
            </button>

            {isCustomSeed && (
              <button
                type="button"
                onClick={handleResetToHandle}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-foreground hover:bg-black/5 transition cursor-pointer"
                title="Reset to base handle"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Style Selection Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Aesthetic Preset
          </span>
          <span className="text-[11px] text-neutral-500 italic">
            {AVATAR_STYLES.find((s) => s.id === selectedStyle)?.description}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {AVATAR_STYLES.map((style) => {
            const isSelected = selectedStyle === style.id
            const Icon = STYLE_ICONS[style.id]
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleSelectStyle(style.id)}
                title={style.description}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-white border-primary shadow-xs ring-2 ring-primary/20'
                    : 'bg-white/60 hover:bg-white border-black/10'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg mb-1 flex items-center justify-center ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-black/5 text-neutral-600'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-[11px] font-bold text-foreground flex items-center justify-center gap-1 w-full px-0.5">
                  <span className="truncate">{style.name}</span>
                  {isSelected && <Check className="size-3 text-primary stroke-[3] shrink-0" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

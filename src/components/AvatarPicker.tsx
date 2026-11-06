import { useState, useEffect, useRef } from 'react'
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
  Upload,
  Camera,
  Trash2,
  AlertCircle,
  FileImage,
  User,
} from 'lucide-react'
import CriticAvatar from './CriticAvatar'
import {
  AVATAR_STYLES,
  getAvatarUrl,
  parseAvatarUrl,
} from '../lib/avatar'
import type { AvatarStyleId } from '../lib/avatar'
import type { Id } from '../../convex/_generated/dataModel'

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
  onAvatarFileSelect?: (file: File | null) => void
  pendingFile?: File | null
  avatarStorageId?: Id<'_storage'> | null
}

export default function AvatarPicker({
  value,
  baseSeed,
  onChange,
  onAvatarFileSelect,
  pendingFile,
  avatarStorageId,
}: AvatarPickerProps) {
  // Determine if the incoming value or profile is a custom uploaded photo
  const parsed = parseAvatarUrl(value)
  const isCustomPhoto = Boolean(pendingFile) || Boolean(avatarStorageId) || (Boolean(value) && parsed === null)

  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>(
    isCustomPhoto ? 'custom' : 'preset',
  )

  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId>(
    parsed?.style ?? 'notionists',
  )
  const [activeSeed, setActiveSeed] = useState<string>(
    parsed?.seed ?? (baseSeed || 'critic'),
  )

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track blob preview URL lifecycle
  useEffect(() => {
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile)
      setLocalPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setLocalPreviewUrl(null)
    }
  }, [pendingFile])

  // If handle changes and user is in illustrated preset mode without a rolled seed, sync seed
  useEffect(() => {
    if (activeTab === 'preset' && !parsed && !isCustomPhoto) {
      const clean = baseSeed.trim().toLowerCase() || 'critic'
      setActiveSeed(clean)
      onChange(getAvatarUrl(selectedStyle, clean))
    }
  }, [baseSeed, activeTab])

  const handleSelectStyle = (styleId: AvatarStyleId) => {
    setSelectedStyle(styleId)
    const newUrl = getAvatarUrl(styleId, activeSeed)
    onAvatarFileSelect?.(null)
    onChange(newUrl)
  }

  const handleRollSeed = () => {
    const randomSuffix = Math.random().toString(36).slice(2, 6)
    const cleanBase = baseSeed.trim().toLowerCase() || 'critic'
    const newSeed = `${cleanBase}_${randomSuffix}`
    setActiveSeed(newSeed)
    onAvatarFileSelect?.(null)
    onChange(getAvatarUrl(selectedStyle, newSeed))
  }

  const handleResetToHandle = () => {
    const cleanBase = baseSeed.trim().toLowerCase() || 'critic'
    setActiveSeed(cleanBase)
    onAvatarFileSelect?.(null)
    onChange(getAvatarUrl(selectedStyle, cleanBase))
  }

  const handleFileValidationAndSelect = (file: File) => {
    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, GIF).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size cannot exceed 5MB.')
      return
    }

    const preview = URL.createObjectURL(file)
    onAvatarFileSelect?.(file)
    onChange(preview)
    setActiveTab('custom')
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileValidationAndSelect(file)
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileValidationAndSelect(file)
    }
  }

  const handleRemoveCustomPhoto = () => {
    onAvatarFileSelect?.(null)
    setLocalPreviewUrl(null)
    setActiveTab('preset')
    const fallbackUrl = getAvatarUrl(selectedStyle, activeSeed)
    onChange(fallbackUrl)
  }

  const handleSwitchToPresets = () => {
    setActiveTab('preset')
    if (isCustomPhoto) {
      onAvatarFileSelect?.(null)
      const fallbackUrl = getAvatarUrl(selectedStyle, activeSeed)
      onChange(fallbackUrl)
    }
  }

  const isCustomSeed = activeSeed !== (baseSeed.trim().toLowerCase() || 'critic')
  const currentAvatarDisplay = localPreviewUrl || value

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-desk border border-black/10 shadow-2xs space-y-4 select-none">
      {/* Mode Switch Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Critic Profile Picture
        </label>

        <div className="flex items-center bg-black/5 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={handleSwitchToPresets}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-foreground shadow-2xs'
                : 'text-neutral-600 hover:text-foreground'
            }`}
          >
            <User className="size-3 text-amber-600" />
            <span>Illustrated Avatars</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-foreground shadow-2xs'
                : 'text-neutral-600 hover:text-foreground'
            }`}
          >
            <Camera className="size-3 text-indigo-600" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Mode 1: Illustrated Avatars Studio */}
      {activeTab === 'preset' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Large Avatar Live Preview */}
            <div className="relative group shrink-0">
              <CriticAvatar
                avatarUrl={currentAvatarDisplay}
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
                  Illustrated Persona
                </span>
                {isCustomSeed && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 font-semibold border border-amber-500/20">
                    Rolled Look
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-600">
                Choose a tech critic aesthetic or roll the dice for unique hairstyles, accessories, and craft geometries.
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
      )}

      {/* Mode 2: Custom Photo Upload */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {isCustomPhoto ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-white border border-black/10 shadow-2xs">
              {/* Photo Preview in Critic Squircle Avatar */}
              <div className="relative group shrink-0">
                <CriticAvatar
                  avatarUrl={currentAvatarDisplay}
                  seed={activeSeed}
                  size="xl"
                  className="shadow-sm border-2 border-black/10"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Choose a different image"
                  className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-neutral-800 transition active:scale-90 cursor-pointer"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              {/* Photo Status & Action Buttons */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 inline-flex items-center gap-1">
                    <Check className="size-3 text-emerald-600 stroke-[3]" />
                    <span>Custom Photo Active</span>
                  </span>
                  {pendingFile && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 font-semibold border border-amber-500/20 truncate max-w-[160px]">
                      {pendingFile.name} ({(pendingFile.size / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600">
                  This custom photo is displayed across all your interface evaluations, comments, and public consensus scorecard profile.
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-xs font-bold text-foreground border border-black/10 shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    <Upload className="size-3.5" />
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveCustomPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag and Drop Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border-2 border-dashed transition cursor-pointer text-center ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-black/15 bg-white/70 hover:bg-white hover:border-black/30'
              }`}
            >
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <FileImage className="size-6" />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">
                Click or drag & drop to upload your profile picture
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                PNG, JPG, WebP, or GIF up to 5MB. Square aspect ratio recommended.
              </p>
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold shadow-xs hover:bg-neutral-800 transition">
                <Upload className="size-3.5" />
                <span>Browse Files</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

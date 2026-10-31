import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Smartphone,
  Shapes,
  Boxes,
  Globe,
  Upload,
  Link as LinkIcon,
  Sparkles,
  LoaderCircle,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Pencil,
} from 'lucide-react'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { unfurlUrlFn, type SpecimenPlatform, type UnfurledMetadata } from '../../lib/unfurl'
import { compressImageToWebP } from '../../lib/imageCompression'
import type { Id } from '../../../convex/_generated/dataModel'

export type SourceType = 'product' | 'dribbble' | 'mobbin' | 'pinterest' | 'figma'

export interface CreateSpecimenModalProps {
  isOpen: boolean
  onClose: () => void
  criticNumber?: number
  onSubmit: (args: {
    name: string
    category: string
    tagline: string
    description?: string
    iconUrl: string
    websiteUrl?: string
    sourceType: SourceType
    sourceUrl?: string
    sourceAuthor?: string
    mediaUrl?: string
    mediaStorageId?: Id<'_storage'>
    craftScore: number
    utilityScore: number
    headline: string
    quote: string
  }) => Promise<{ appId: Id<'apps'>; reviewId: Id<'reviews'> }>
  onSpecimenCreated?: (specimenId: Id<'apps'>) => void
}

const PLATFORM_CONFIG: Record<
  SpecimenPlatform,
  {
    label: string
    icon: typeof Globe
    colorBg: string
    colorText: string
    defaultIcon: string
  }
> = {
  dribbble: {
    label: 'Dribbble Concept',
    icon: Palette,
    colorBg: 'bg-[#ea4c89]/10 border-[#ea4c89]/30 text-[#ea4c89]',
    colorText: 'text-[#ea4c89]',
    defaultIcon: 'https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944b005e83917a102c98d63a8904791e0a29f86.ico',
  },
  mobbin: {
    label: 'Mobbin Flow',
    icon: Smartphone,
    colorBg: 'bg-[#0066ff]/10 border-[#0066ff]/30 text-[#0066ff]',
    colorText: 'text-[#0066ff]',
    defaultIcon: 'https://mobbin.com/favicon.ico',
  },
  figma: {
    label: 'Figma Community',
    icon: Shapes,
    colorBg: 'bg-[#a259ff]/10 border-[#a259ff]/30 text-[#a259ff]',
    colorText: 'text-[#a259ff]',
    defaultIcon: 'https://static.figma.com/app/icon/1/favicon.svg',
  },
  pinterest: {
    label: 'Pinterest Board',
    icon: Boxes,
    colorBg: 'bg-[#e60023]/10 border-[#e60023]/30 text-[#e60023]',
    colorText: 'text-[#e60023]',
    defaultIcon: 'https://s.pinimg.com/webapp/favicon-54a5b2af.png',
  },
  x_twitter: {
    label: 'X / Twitter Drop',
    icon: Sparkles,
    colorBg: 'bg-neutral-800/10 border-neutral-800/30 text-neutral-900',
    colorText: 'text-neutral-900',
    defaultIcon: 'https://abs.twimg.com/favicons/twitter.3.ico',
  },
  product: {
    label: 'Live Product',
    icon: Globe,
    colorBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800',
    colorText: 'text-emerald-700',
    defaultIcon: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
  },
}

const CRAFT_CATEGORIES = [
  'Micro-interactions',
  'Mobile Interaction',
  'Design System',
  'Desktop Flow',
  'Typography & Layout',
  'Navigation & Command',
  'Dark Mode Surfaces',
  'Developer Experience',
]

const QUICK_SPECIMEN_TAGS = [
  'Micro-interactions',
  'Design System',
  'Mobile Flow',
  'Desktop Flow',
  'Typography',
]

export default function CreateSpecimenModal({
  isOpen,
  onClose,
  criticNumber = 1,
  onSubmit,
  onSpecimenCreated,
}: CreateSpecimenModalProps) {
  const generateUploadUrl = useConvexMutation(api.storage.generateUploadUrl)
  // Stepper state: 1 = Ingest & Media, 2 = Dual-Meter Appraisal
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Ingestion state
  const [urlInput, setUrlInput] = useState('')
  const [isUnfurling, startUnfurlTransition] = useTransition()
  const [unfurlSuccess, setUnfurlSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingImageBlob, setPendingImageBlob] = useState<Blob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Artifact card fields
  const [platform, setPlatform] = useState<SpecimenPlatform>('dribbble')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Micro-interactions')
  const [mediaUrl, setMediaUrl] = useState('')
  const [tagline, setTagline] = useState('')
  const [showDirectMediaInput, setShowDirectMediaInput] = useState(false)

  // Dual-Meter Appraisal fields (The Dribbble Dilemma!)
  const [craftScore, setCraftScore] = useState(96)
  const [utilityScore, setUtilityScore] = useState(35)
  const [headline, setHeadline] = useState('')
  const [quote, setQuote] = useState('')

  // Dynamic stamp computation
  const isLgtm = craftScore >= 90 && utilityScore >= 80
  const isDribbbleDilemma = craftScore >= 70 && utilityScore < 70
  const isRotten = craftScore < 70 && utilityScore < 70

  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setSubmitError(null)
    setUnfurlSuccess(false)
    setPendingImageBlob(null)

    // Quick regex validation before auto-fetching
    if (value.includes('.') && value.length > 8) {
      startUnfurlTransition(async () => {
        try {
          const res = (await unfurlUrlFn({ data: value })) as UnfurledMetadata
          if (res) {
            setPlatform(res.platform)
            if (res.title) setTitle(res.title)
            if (res.author) setAuthor(res.author)
            if (res.category) setCategory(res.category)
            if (res.image) setMediaUrl(res.image)
            if (res.description) setTagline(res.description.slice(0, 110))
            if (res.title) {
              setHeadline(`${res.title} — Specimen Appraisal`)
            }
            setUnfurlSuccess(true)
          }
        } catch {
          // If unfurl is blocked, platform is still detected from hostname
        }
      })
    }
  }

  // Handle local image file drop / upload with client-side WebP compression
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please drop a valid image file (PNG, JPG, WebP, GIF).')
      return
    }

    setSubmitError(null)
    try {
      const result = await compressImageToWebP(file, { maxWidth: 1600, quality: 0.82 })
      setPendingImageBlob(result.blob)
      setMediaUrl(result.dataUrl)
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
        setTitle(cleanName.replace(/\b\w/g, (c) => c.toUpperCase()))
      }
    } catch {
      setSubmitError('Failed to process image.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleContinueToAppraisal = () => {
    setSubmitError(null)
    if (!title.trim()) {
      setSubmitError('Please enter a specimen title before proceeding to appraisal.')
      return
    }
    setCurrentStep(2)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const finalTitle = title.trim()
    if (!finalTitle) {
      setSubmitError('Please enter a title for the specimen.')
      setCurrentStep(1)
      return
    }

    const finalAuthor = author.trim() || '@anonymous_creator'
    const finalHeadline = headline.trim() || `${craftScore}% Craft / ${utilityScore}% Utility Appraisal`
    const finalQuote =
      quote.trim() ||
      (isDribbbleDilemma
        ? 'Breathtaking visual fidelity and interaction micro-motion, burdened by low real-world ergonomic utility.'
        : isLgtm
          ? 'Rare and sublime harmony of aesthetic craftsmanship and daily workflow utility.'
          : isRotten
            ? 'Lacks interaction responsiveness and visual refinement.'
            : 'Unbalanced synthesis of craft and real-world ergonomics.')

    const finalTagline = tagline.trim() || `Specimen appraisal from ${PLATFORM_CONFIG[platform].label}.`

    const finalSourceType: SourceType =
      platform === 'x_twitter' ? 'dribbble' : platform

    setIsSubmitting(true)
    try {
      let uploadedStorageId: Id<'_storage'> | undefined = undefined

      // If a local image was dropped/uploaded, upload the compressed WebP blob to Convex storage
      if (pendingImageBlob) {
        const postUrl = await generateUploadUrl({})
        const uploadRes = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': pendingImageBlob.type || 'image/webp' },
          body: pendingImageBlob,
        })
        if (!uploadRes.ok) {
          throw new Error('Failed to upload specimen image to Convex storage.')
        }
        const json = await uploadRes.json()
        uploadedStorageId = json.storageId
      }

      const res = await onSubmit({
        name: finalTitle,
        category: category.trim() || 'Digital Craft',
        tagline: finalTagline,
        iconUrl: PLATFORM_CONFIG[platform].defaultIcon,
        sourceType: finalSourceType,
        sourceUrl: urlInput.trim() || undefined,
        sourceAuthor: finalAuthor,
        mediaUrl: uploadedStorageId ? undefined : (mediaUrl.trim() || undefined),
        mediaStorageId: uploadedStorageId,
        craftScore,
        utilityScore,
        headline: finalHeadline,
        quote: finalQuote,
      })

      setIsSubmitting(false)
      onClose()
      if (onSpecimenCreated && res?.appId) {
        onSpecimenCreated(res.appId)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setSubmitError(err?.message || 'Failed to stamp specimen.')
    }
  }

  const currentPlatformConfig = PLATFORM_CONFIG[platform]
  const PlatformIcon = currentPlatformConfig.icon

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-6 sm:p-8" onClose={onClose}>
        {/* Header */}
        <DialogHeader className="pb-5 border-b border-black/10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 border border-amber-500/25">
              <Award className="size-5 text-amber-700" />
            </span>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Specimen Studio
              </DialogTitle>
              <DialogDescription>
                Index UI artifacts from Dribbble, Figma, Mobbin, or Web. Dissect the craft and seal your Founding Critic scorecard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {submitError}
          </div>
        )}

        {/* Studio Two-Column Grid: Left Controls (Stepped) | Right Living Card */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls Workspace (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Stepper Track */}
              <div className="flex items-center gap-3 pb-6 border-b border-black/10 mb-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    currentStep === 1
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition ${
                      currentStep === 1
                        ? 'bg-foreground text-background'
                        : 'bg-emerald-500/15 text-emerald-800'
                    }`}
                  >
                    {currentStep > 1 ? <CheckCircle2 className="size-3.5" /> : '01'}
                  </span>
                  <span>01 Ingest</span>
                </button>

                <div className="h-px w-8 bg-black/15" />

                <button
                  type="button"
                  onClick={() => {
                    if (title.trim()) {
                      setCurrentStep(2)
                    } else {
                      setSubmitError('Please enter a specimen title first.')
                    }
                  }}
                  className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    currentStep === 2
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition ${
                      currentStep === 2
                        ? 'bg-foreground text-background'
                        : 'bg-black/5 text-muted-foreground'
                    }`}
                  >
                    02
                  </span>
                  <span>02 Appraise</span>
                </button>
              </div>

              {/* STEP 01: Ingestion & Metadata */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* URL Ingestion Field */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Specimen URL
                    </label>
                    <div className="relative flex items-center">
                      <LinkIcon className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="Paste Dribbble shot, Figma file, Mobbin flow, or Pinterest pin..."
                        className="w-full pl-10 pr-28 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs placeholder:text-neutral-400"
                      />
                      <div className="absolute right-2.5 flex items-center gap-1.5">
                        {isUnfurling && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <LoaderCircle className="size-3 animate-spin text-amber-700" />
                            <span>Unfurling...</span>
                          </span>
                        )}
                        {unfurlSuccess && !isUnfurling && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Extracted</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Auto-unfurls preview artwork, creator handle, and design taxonomy from supported sources.
                    </p>
                  </div>

                  {/* Specimen Title */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Specimen Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Dynamic Island Audio Expansion"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs placeholder:text-neutral-400"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Descriptive title for the artifact (auto-populated upon pasting URL).
                    </p>
                  </div>

                  {/* Creator & Craft Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        Creator / Studio <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="e.g. @peduarte or Cash App Team"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Individual designer or studio attribution.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-foreground block">
                          Craft Category
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Type any taxonomy
                        </span>
                      </div>
                      <input
                        type="text"
                        list="specimen-category-suggestions"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Micro-interactions, Design System, Spatial UI"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs placeholder:font-normal placeholder:text-neutral-400"
                      />
                      <datalist id="specimen-category-suggestions">
                        {CRAFT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-semibold text-neutral-400">Suggestions:</span>
                        {QUICK_SPECIMEN_TAGS.map((quickCat) => (
                          <button
                            key={quickCat}
                            type="button"
                            onClick={() => setCategory(quickCat)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                              category.trim().toLowerCase() === quickCat.toLowerCase()
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 font-bold shadow-2xs'
                                : 'bg-canvas border-black/10 text-neutral-600 hover:text-foreground hover:border-black/20'
                            }`}
                          >
                            {quickCat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Craft Thesis / Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-foreground">
                        Craft Thesis & Hook
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDirectMediaInput(!showDirectMediaInput)}
                        className="text-[10px] font-mono text-muted-foreground hover:text-amber-700 transition cursor-pointer"
                      >
                        {showDirectMediaInput ? 'Hide direct image URL' : 'Edit artwork link directly'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Spring fluid dynamics with sub-pixel optical font dilation."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      One sentence highlighting the standout interaction motion or design thesis.
                    </p>

                    {showDirectMediaInput && (
                      <div className="mt-2.5 animate-in fade-in duration-200">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                          Direct Artwork Image URL
                        </label>
                        <input
                          type="text"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://.../preview.jpg"
                          className="w-full text-xs font-mono bg-canvas px-3.5 py-2 rounded-xl border border-black/10 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 02: Dual-Meter Appraisal */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Rotten Tomatoes Rubric Sliders */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-desk border border-black/10 shadow-2xs space-y-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                        <span>The Rotten Tomatoes Dual-Meter Rubric</span>
                        <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-500/15 px-2 py-0.5 rounded-full">
                          Resolving the Dribbble Dilemma
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Grade visual execution against everyday real-world utility.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Craft Slider */}
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-canvas border border-black/10 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Palette className="size-3.5 text-emerald-600" />
                            <span>Craft Score</span>
                          </span>
                          <span className="font-black text-sm text-foreground font-mono">
                            {craftScore}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={craftScore}
                          onChange={(e) => setCraftScore(Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>10% Clunky</span>
                          <span>100% Masterpiece</span>
                        </div>
                      </div>

                      {/* Utility Slider */}
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-canvas border border-black/10 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Pencil className="size-3.5 text-amber-500" />
                            <span>Utility Score</span>
                          </span>
                          <span className="font-black text-sm text-foreground font-mono">
                            {utilityScore}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={utilityScore}
                          onChange={(e) => setUtilityScore(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>10% Gimmick</span>
                          <span>100% Workhorse</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editorial Headline */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Editorial Headline <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Pure visual poetry, but burdened by impossible contrast ratios."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      A punchy, memorable summary verdict for this specimen.
                    </p>
                  </div>

                  {/* Critic Pull Quote & Rationale */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Critic Pull Quote & Rationale <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="Explain why this artifact earned your stamp. (Fraunces serif italic scorecard statement)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-serif italic text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Your permanent founding critique preserved in the Screenlog consensus archive.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stepped Action Footer */}
            <div className="pt-6 mt-6 border-t border-black/10 flex items-center justify-between">
              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:text-foreground hover:bg-black/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueToAppraisal}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-6 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>Continue to Appraisal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:text-foreground hover:bg-black/5 transition cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-6 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin" />
                        <span>Sealing Scorecard...</span>
                      </>
                    ) : (
                      <>
                         <span>Stamp</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: The Persistent Living Exhibition Card (5 cols) */}
          <div className="lg:col-span-5 sticky top-0 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="size-3 text-amber-600" />
                <span>Live Specimen Exhibition Card</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Founding Critic #{criticNumber}
              </span>
            </div>

            {/* The Unified Card Container */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={handleDrop}
              className="relative rounded-2xl border border-black/15 bg-scorecard shadow-md overflow-hidden transition-all duration-300"
            >
              {/* TOP ZONE: Generous 16:10 Artwork Frame */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-[16/10] bg-desk border-b border-black/10 overflow-hidden flex items-center justify-center cursor-pointer group/art"
                title="Click to upload or replace artwork image"
              >
                {/* Platform Badge Overlay */}
                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border shadow-2xs backdrop-blur-xs ${currentPlatformConfig.colorBg}`}
                  >
                    <PlatformIcon className="size-3" />
                    <span>{currentPlatformConfig.label}</span>
                  </span>
                </div>

                {isUnfurling ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <div className="size-6 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                    <div className="text-xs font-bold text-neutral-800 animate-pulse">
                      Unfurling specimen...
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Extracting artwork & metadata
                    </div>
                  </div>
                ) : mediaUrl ? (
                  <>
                    <img
                      src={mediaUrl}
                      alt={title || 'Specimen Preview'}
                      referrerPolicy="no-referrer"
                      className="size-full object-cover group-hover/art:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                      <Upload className="size-4" />
                      <span>Replace Artwork</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
                    <Upload className="size-7 text-neutral-400 group-hover:text-amber-600 transition" />
                    <div className="text-xs font-bold text-neutral-700">
                      Drop screenshot here, or
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-black/15 text-[11px] font-bold text-neutral-700 shadow-2xs group-hover:bg-neutral-50 transition">
                      Click to browse
                    </span>
                    <div className="text-[10px] text-neutral-400">
                      Supports PNG, JPG, GIF, WebP
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0])
                    }
                  }}
                />
              </div>

              {/* BOTTOM ZONE: Integrated Scorecard Placard */}
              <div className="p-5 sm:p-6 space-y-3.5 relative">
                {/* Title & Creator */}
                <div className="border-b border-black/10 pb-3">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Specimen Title
                  </span>
                  <h4 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {title || 'Dynamic Island Audio Expansion'}
                  </h4>
                  <p className="text-xs font-bold text-neutral-600 mt-0.5 truncate">
                    {author || '@creator'} • <span className="font-normal text-muted-foreground">{category}</span>
                  </p>
                </div>

                {/* Scorecard Meters */}
                <div className="grid grid-cols-2 divide-x divide-black/10 py-1">
                  <div className="pr-3 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                      {craftScore}%
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 mt-0.5">
                      Craft Score
                    </div>
                  </div>
                  <div className="pl-3 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                      {utilityScore}%
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-800 mt-0.5">
                      Utility Score
                    </div>
                  </div>
                </div>

                {/* Editorial Headline & Quote Preview */}
                <div className="border-t border-black/10 pt-2.5 min-h-[70px] relative">
                  {headline ? (
                    <p className="text-xs font-bold text-foreground line-clamp-1 mb-1">
                      {headline}
                    </p>
                  ) : null}
                  <p className="text-[11px] leading-relaxed text-neutral-700 italic font-serif line-clamp-2">
                    &ldquo;{quote || 'Breathtaking visual fidelity and interaction micro-motion, burdened by low real-world ergonomic utility.'}&rdquo;
                  </p>
                  <p className="text-[10px] font-bold text-neutral-500 mt-2">
                    — Founding Critic #{criticNumber}
                  </p>

                  {/* Dynamic Physical Rubber Stamp */}
                  <AnimatePresence mode="wait">
                    {isLgtm ? (
                      <motion.img
                        key="stamp-lgtm"
                        initial={{ scale: 1.3, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 0.95, rotate: 2 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        src="/assets/stamp_certified_lgtm.png"
                        alt="Certified LGTM"
                        className="absolute bottom-0 right-0 w-28 sm:w-32 drop-shadow-xs select-none pointer-events-none z-10"
                      />
                    ) : isDribbbleDilemma ? (
                      <motion.img
                        key="stamp-dribbble"
                        initial={{ scale: 1.3, opacity: 0, rotate: 10 }}
                        animate={{ scale: 1, opacity: 0.95, rotate: -3 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        src="/assets/stamp_needs_polish.png"
                        alt="Needs Polish / Gimmick"
                        className="absolute bottom-0 right-0 w-28 sm:w-32 drop-shadow-xs select-none pointer-events-none z-10"
                      />
                    ) : (
                      <motion.img
                        key="stamp-rotten"
                        initial={{ scale: 1.3, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 0.95, rotate: 3 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        src="/assets/stamp_certified_rotten.png"
                        alt="Certified Rotten"
                        className="absolute bottom-0 right-0 w-28 sm:w-32 drop-shadow-xs select-none pointer-events-none z-10"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

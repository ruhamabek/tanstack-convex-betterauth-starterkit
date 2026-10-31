import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Zap,
  LoaderCircle,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Video,
  Image as ImageIcon,
  Layers,
} from 'lucide-react'
import { useSelector } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { useAppForm } from '../form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { compressImageToWebP } from '../../lib/imageCompression'
import { parseVideoUrl } from '../../lib/videoEmbed'
import { getFaviconFromUrl } from '../../lib/domainFavicon'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

export interface EvaluateAppModalProps {
  isOpen: boolean
  onClose: () => void
  apps: Doc<'apps'>[]
  profile?: Doc<'profiles'> | null
  initialAppId?: Id<'apps'> | string
  onSubmit: (args: {
    appName: string
    websiteUrl: string
    category: string
    iconUrl?: string
    tagline?: string
    featureName?: string
    mediaUrl?: string
    mediaStorageId?: Id<'_storage'>
    mediaType?: 'image' | 'loom' | 'video_embed'
    craftScore: number
    utilityScore: number
    headline: string
    quote: string
  }) => Promise<void>
}

const SUGGESTED_APP_CATEGORIES = [
  'Desktop Productivity',
  'Developer Tools',
  'Design & Creative',
  'Issue & Task Tracking',
  'Knowledge Base & Docs',
  'Communication & Chat',
  'Browser & Navigation',
  'AI & Machine Learning',
  'Finance & Operations',
  'Utility & System',
  'Audio & Media',
  'Terminal & CLI',
  'Security & Privacy',
]

const QUICK_CATEGORY_TAGS = [
  'Developer Tools',
  'Desktop Productivity',
  'Design Tool',
  'AI & ML',
  'Knowledge Base',
  'Utility',
]

export default function EvaluateAppModal({
  isOpen,
  onClose,
  apps,
  profile,
  initialAppId,
  onSubmit,
}: EvaluateAppModalProps) {
  const generateUploadUrl = useConvexMutation(api.storage.generateUploadUrl)

  // Transient UI-only states
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [pendingImageBlob, setPendingImageBlob] = useState<Blob | null>(null)
  const [mediaTab, setMediaTab] = useState<'screenshot' | 'video'>('screenshot')
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // TanStack Form instance
  const form = useAppForm({
    defaultValues: {
      selectedAppId: (initialAppId as string) || '',
      appName: '',
      websiteUrl: '',
      category: '',
      featureName: '',
      mediaUrl: '',
      mediaType: 'image' as 'image' | 'loom' | 'video_embed',
      videoInputUrl: '',
      craftScore: 94,
      utilityScore: 90,
      headline: '',
      quote: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)

      const finalName = (selectedExistingApp?.name || value.appName).trim()
      if (!finalName) {
        setSubmitError('Please provide an app name.')
        setCurrentStep(1)
        return
      }

      const finalWebsite = (selectedExistingApp?.websiteUrl || value.websiteUrl).trim()
      if (!finalWebsite) {
        setSubmitError('Please provide a website URL.')
        setCurrentStep(1)
        return
      }

      const finalHeadline =
        value.headline.trim() ||
        `${value.craftScore}% Craft / ${value.utilityScore}% Utility Evaluation`

      const finalQuote =
        value.quote.trim() ||
        (isLgtm
          ? 'Superb craftsmanship and deep workflow utility. An exemplary daily driver.'
          : isDribbbleDilemma
            ? 'Visually refined interface, but compromised by ergonomic friction in daily use.'
            : 'Suffers from interaction lag and lack of tactile refinement.')

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
            throw new Error('Failed to upload compressed screenshot to Convex storage.')
          }
          const json = await uploadRes.json()
          uploadedStorageId = json.storageId
        }

        await onSubmit({
          appName: finalName,
          websiteUrl: finalWebsite,
          category: (selectedExistingApp?.category || value.category).trim() || 'Software Product',
          iconUrl: liveIconUrl || undefined,
          featureName: value.featureName.trim() || undefined,
          mediaUrl: uploadedStorageId ? undefined : (value.mediaUrl.trim() || undefined),
          mediaStorageId: uploadedStorageId,
          mediaType: (uploadedStorageId || value.mediaUrl) ? value.mediaType : undefined,
          craftScore: value.craftScore,
          utilityScore: value.utilityScore,
          headline: finalHeadline,
          quote: finalQuote,
        })

        onClose()
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to submit evaluation.')
      }
    },
  })

  // Reactive subscription to all form values for the live appraisal card
  const formValues = useSelector(form.store, (s) => s.values)
  const isSubmitting = useSelector(form.store, (s) => s.isSubmitting)

  // Selected existing app from catalog
  const selectedExistingApp = useMemo(
    () => apps.find((a) => a._id === formValues.selectedAppId),
    [apps, formValues.selectedAppId],
  )

  // Synchronize when modal opens or initialAppId changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setSubmitError(null)
      setPendingImageBlob(null)
      setCompressionInfo(null)
      if (initialAppId) {
        const found = apps.find((a) => a._id === initialAppId)
        if (found) {
          form.setFieldValue('selectedAppId', found._id)
          form.setFieldValue('appName', found.name)
          form.setFieldValue('websiteUrl', found.websiteUrl || '')
          form.setFieldValue('category', found.category)
        }
      }
    }
  }, [isOpen, initialAppId, apps])

  // When an existing app is clicked from the catalog
  const handleSelectExistingApp = (app: Doc<'apps'>) => {
    form.setFieldValue('selectedAppId', app._id)
    form.setFieldValue('appName', app.name)
    form.setFieldValue('websiteUrl', app.websiteUrl || '')
    form.setFieldValue('category', app.category)
  }

  const handleStartNewApp = (customName?: string) => {
    form.setFieldValue('selectedAppId', '')
    if (customName !== undefined) {
      form.setFieldValue('appName', customName)
    }
  }

  // Auto-resolve icon from website URL
  const liveIconUrl = useMemo(() => {
    if (selectedExistingApp?.iconUrl) return selectedExistingApp.iconUrl
    if (formValues.websiteUrl) return getFaviconFromUrl(formValues.websiteUrl)
    return ''
  }, [selectedExistingApp, formValues.websiteUrl])

  // Dynamic stamp computation
  const isLgtm = formValues.craftScore >= 90 && formValues.utilityScore >= 80
  const isDribbbleDilemma = formValues.craftScore >= 70 && formValues.utilityScore < 70

  // Handle local image file drop / upload with client-side WebP compression
  const handleFileDropOrSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please drop a valid image file (PNG, JPG, WebP).')
      return
    }

    setSubmitError(null)
    setIsCompressing(true)
    try {
      const result = await compressImageToWebP(file, { maxWidth: 1600, quality: 0.82 })
      setPendingImageBlob(result.blob)
      form.setFieldValue('mediaUrl', result.dataUrl)
      form.setFieldValue('mediaType', 'image')
      setCompressionInfo(
        `Optimized: ${(result.sizeBytes / 1024).toFixed(0)} KB (saved ${result.compressionRatio})`,
      )
    } catch {
      setSubmitError('Failed to optimize image.')
    } finally {
      setIsCompressing(false)
    }
  }

  // Handle video/Loom URL input
  const handleVideoUrlChange = (val: string) => {
    form.setFieldValue('videoInputUrl', val)
    setSubmitError(null)
    setPendingImageBlob(null)
    const parsed = parseVideoUrl(val)
    if (parsed) {
      form.setFieldValue('mediaUrl', parsed.embedUrl)
      form.setFieldValue('mediaType', parsed.type === 'loom' ? 'loom' : 'video_embed')
    } else {
      form.setFieldValue('mediaUrl', '')
    }
  }

  const handleContinueToRubric = () => {
    setSubmitError(null)
    const finalName = (selectedExistingApp?.name || formValues.appName).trim()
    if (!finalName) {
      setSubmitError('Please specify an app name to evaluate.')
      return
    }

    if (!selectedExistingApp && !formValues.websiteUrl.trim()) {
      setSubmitError('Please provide the official website URL for this new app.')
      return
    }

    if (!formValues.headline.trim()) {
      form.setFieldValue(
        'headline',
        `${finalName}${formValues.featureName ? ` (${formValues.featureName})` : ''} — Software Evaluation`,
      )
    }

    setCurrentStep(2)
  }

  const activeDisplayAppName = selectedExistingApp?.name || formValues.appName || 'Software Application'
  const activeDisplayCategory =
    selectedExistingApp?.category || formValues.category.trim() || 'Software Product'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-6 sm:p-8" onClose={onClose}>
        {/* Header */}
        <DialogHeader className="pb-5 border-b border-black/10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
              <Award className="size-5 text-emerald-700" />
            </span>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Evaluate Software Product
              </DialogTitle>
              <DialogDescription>
                Evaluate living software applications or dissect a specific feature surface.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {submitError}
          </div>
        )}

        {/* Studio Grid: Left Controls (Stepped) | Right Living Scorecard */}
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
                  <span>01 App & Feature</span>
                </button>

                <div className="h-px w-8 bg-black/15" />

                <button
                  type="button"
                  onClick={() => {
                    const finalName = (selectedExistingApp?.name || formValues.appName).trim()
                    if (finalName) {
                      setCurrentStep(2)
                    } else {
                      setSubmitError('Please specify an app name first.')
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
                  <span>02 Proof & Rubric</span>
                </button>
              </div>

              {/* STEP 01: App Selection & Feature Scope */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Existing App Catalog Selector */}
                  {apps.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-foreground">
                          Select from Community Catalog
                        </label>
                        <button
                          type="button"
                          onClick={() => handleStartNewApp('')}
                          className={`text-[11px] font-bold transition cursor-pointer ${
                            !formValues.selectedAppId
                              ? 'text-foreground underline'
                              : 'text-amber-800 hover:text-amber-900'
                          }`}
                        >
                          + Add a new app instead
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 rounded-xl bg-desk border border-black/10">
                        {apps.map((app) => {
                          const isSelected = formValues.selectedAppId === app._id
                          return (
                            <button
                              key={app._id}
                              type="button"
                              onClick={() => handleSelectExistingApp(app)}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                                isSelected
                                  ? 'bg-white border-foreground shadow-xs ring-2 ring-black/10'
                                  : 'bg-white/70 hover:bg-white border-black/10'
                              }`}
                            >
                              {app.iconUrl && (
                                <img
                                  src={app.iconUrl}
                                  alt={app.name}
                                  className="size-6 rounded-md object-contain shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-foreground truncate block">
                                  {app.name}
                                </span>
                                <span className="text-[9px] font-mono text-muted-foreground truncate block">
                                  {app.category}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* If entering a new app (not from catalog) */}
                  {!formValues.selectedAppId && (
                    <div className="p-4 rounded-2xl bg-desk border border-black/10 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-500/15 px-2 py-0.5 rounded-full">
                          Register New Software Product
                        </span>
                        {liveIconUrl && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                            <img
                              src={liveIconUrl}
                              alt="App Icon"
                              className="size-5 rounded-md object-contain border border-black/10 bg-white"
                            />
                            <span>Icon Detected</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <form.Field name="appName">
                          {(field) => (
                            <div>
                              <label className="text-xs font-bold text-foreground block mb-1">
                                App Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Superhuman, Raycast, Arc"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field name="websiteUrl">
                          {(field) => (
                            <div>
                              <label className="text-xs font-bold text-foreground block mb-1">
                                Official Website URL <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="https://raycast.com"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>

                      <form.Field name="category">
                        {(field) => (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-foreground block">
                                Product Category
                              </label>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Type any category or niche
                              </span>
                            </div>
                            <input
                              type="text"
                              list="product-category-suggestions"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Developer Tools, Personal CRM, Terminal Emulator"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs placeholder:font-normal placeholder:text-neutral-400"
                            />
                            <datalist id="product-category-suggestions">
                              {SUGGESTED_APP_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat} />
                              ))}
                            </datalist>

                            {/* Quick category suggestion pills */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] font-semibold text-neutral-400">Suggestions:</span>
                              {QUICK_CATEGORY_TAGS.map((quickCat) => (
                                <button
                                  key={quickCat}
                                  type="button"
                                  onClick={() => field.handleChange(quickCat)}
                                  className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                                    field.state.value.trim().toLowerCase() === quickCat.toLowerCase()
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 font-bold shadow-2xs'
                                      : 'bg-canvas border-black/10 text-neutral-600 hover:text-foreground hover:border-black/20'
                                  }`}
                                >
                                  {quickCat}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </form.Field>
                    </div>
                  )}

                  {/* Feature / Scope Being Evaluated */}
                  <form.Field name="featureName">
                    {(field) => (
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Feature / Surface Evaluated{' '}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <div className="relative flex items-center">
                          <Layers className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. Extension Store Window, Command Bar, or leave empty for Overall App"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Pinpoint the exact feature interaction you are critiquing, or evaluate the overall application experience.
                        </p>
                      </div>
                    )}
                  </form.Field>
                </div>
              )}

              {/* STEP 02: Visual Proof & Dual-Meter Rubric */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Visual Proof Uploader (WebP Compressed Image OR Zero-Byte Video Embed) */}
                  <div className="p-4 rounded-2xl bg-desk border border-black/10 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Attach Visual Proof
                      </span>
                      <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setMediaTab('screenshot')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                            mediaTab === 'screenshot'
                              ? 'bg-white text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Screenshot
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaTab('video')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                            mediaTab === 'video'
                              ? 'bg-white text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Loom / Video
                        </button>
                      </div>
                    </div>

                    {mediaTab === 'screenshot' ? (
                      <div>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-black/15 hover:border-black/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-canvas transition group"
                        >
                          <Upload className="size-6 text-neutral-400 group-hover:text-emerald-700 transition mb-1.5" />
                          <div className="text-xs font-bold text-neutral-700">
                            {isCompressing ? 'Optimizing WebP image...' : 'Drop screenshot of the feature, or Click to browse'}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Auto-compresses to modern WebP (~100 KB) in the browser to protect storage.
                          </div>
                          {compressionInfo && (
                            <div className="mt-2 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {compressionInfo}
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileDropOrSelect(e.target.files[0])
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative flex items-center">
                          <Video className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            value={formValues.videoInputUrl}
                            onChange={(e) => handleVideoUrlChange(e.target.value)}
                            placeholder="Paste Loom link (https://www.loom.com/share/...) or YouTube URL"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 shadow-2xs"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Zero storage used on your cloud bucket. Video streams directly from Loom or YouTube.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dual-Meter Rubric Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Craft Slider */}
                    <form.Field name="craftScore">
                      {(field) => (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-desk border border-black/10 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Palette className="size-3.5 text-emerald-600" />
                              <span>Craft Score</span>
                            </span>
                            <span className="font-black text-sm text-foreground font-mono">
                              {field.state.value}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>10% Clunky</span>
                            <span>100% Masterpiece</span>
                          </div>
                        </div>
                      )}
                    </form.Field>

                    {/* Utility Slider */}
                    <form.Field name="utilityScore">
                      {(field) => (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-desk border border-black/10 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Zap className="size-3.5 text-amber-500" />
                              <span>Utility Score</span>
                            </span>
                            <span className="font-black text-sm text-foreground font-mono">
                              {field.state.value}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="w-full accent-amber-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>10% Gimmick</span>
                            <span>100% Workhorse</span>
                          </div>
                        </div>
                      )}
                    </form.Field>
                  </div>

                  {/* Editorial Headline */}
                  <form.Field name="headline">
                    {(field) => (
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Editorial Headline <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Sublime keyboard shortcuts, but high memory footprint."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    )}
                  </form.Field>

                  {/* Critic Pull Quote */}
                  <form.Field name="quote">
                    {(field) => (
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Critic Pull Quote & Rationale <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Explain why this application or feature earned your score. (Fraunces serif italic scorecard statement)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-black/10 text-xs sm:text-sm font-serif italic text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    )}
                  </form.Field>
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
                    onClick={handleContinueToRubric}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-6 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>Continue to Rubric</span>
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
                    onClick={() => form.handleSubmit()}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground hover:bg-neutral-800 px-6 py-2.5 text-xs font-bold text-background shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin" />
                        <span>Sealing Evaluation...</span>
                      </>
                    ) : (
                      <>
                        <Award className="size-3.5 text-amber-400" />
                        <span>Publish App Evaluation</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: The Persistent Living Scorecard Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-0 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="size-3 text-emerald-700" />
                <span>Live Appraisal Card</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Critic #{profile?.criticNumber ?? 1}
              </span>
            </div>

            {/* The Unified Card Container */}
            <div className="relative rounded-2xl border border-black/15 bg-scorecard shadow-md overflow-hidden transition-all duration-300">
              {/* Top Media / Video Frame */}
              <div className="relative aspect-[16/10] bg-desk border-b border-black/10 overflow-hidden flex items-center justify-center">
                {/* Feature Scope Pill Overlay */}
                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 border border-black/10 text-neutral-800 shadow-2xs backdrop-blur-xs">
                    <Layers className="size-3 text-neutral-600" />
                    <span>{formValues.featureName ? `Feature: ${formValues.featureName}` : 'Overall App'}</span>
                  </span>
                </div>

                {formValues.mediaUrl ? (
                  formValues.mediaType === 'loom' || formValues.mediaType === 'video_embed' ? (
                    <iframe
                      src={formValues.mediaUrl}
                      title="Video Proof"
                      className="size-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={formValues.mediaUrl}
                      alt="Feature Screenshot"
                      className="size-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
                    {liveIconUrl ? (
                      <img
                        src={liveIconUrl}
                        alt="App Logo"
                        className="size-12 rounded-xl object-contain border border-black/10 bg-white p-1 shadow-2xs"
                      />
                    ) : (
                      <Upload className="size-7 text-neutral-400" />
                    )}
                    <div className="text-xs font-bold text-neutral-700">
                      {formValues.featureName ? `Visual proof for "${formValues.featureName}"` : 'Visual proof for app evaluation'}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Attach screenshot or paste Loom video link in Step 2
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Placard */}
              <div className="p-5 sm:p-6 space-y-3.5 relative">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-black/10 pb-3">
                  {liveIconUrl && (
                    <img
                      src={liveIconUrl}
                      alt={activeDisplayAppName}
                      className="size-9 rounded-xl object-contain border border-black/10 bg-white p-0.5 shrink-0 shadow-2xs"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                      {activeDisplayAppName}
                    </h4>
                    <p className="text-xs font-bold text-neutral-600 truncate">
                      {activeDisplayCategory}
                    </p>
                  </div>
                </div>

                {/* Scorecard Meters */}
                <div className="grid grid-cols-2 divide-x divide-black/10 py-1">
                  <div className="pr-3 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                      {formValues.craftScore}%
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 mt-0.5">
                      Craft Score
                    </div>
                  </div>
                  <div className="pl-3 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                      {formValues.utilityScore}%
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-800 mt-0.5">
                      Utility Score
                    </div>
                  </div>
                </div>

                {/* Editorial Headline & Quote Preview */}
                <div className="border-t border-black/10 pt-2.5 min-h-[70px] relative">
                  {formValues.headline ? (
                    <p className="text-xs font-bold text-foreground line-clamp-1 mb-1">
                      {formValues.headline}
                    </p>
                  ) : null}
                  <p className="text-[11px] leading-relaxed text-neutral-700 italic font-serif line-clamp-2">
                    &ldquo;
                    {formValues.quote ||
                      (isLgtm
                        ? 'Superb craftsmanship and deep workflow utility. An exemplary daily driver.'
                        : isDribbbleDilemma
                          ? 'Visually refined interface, but compromised by ergonomic friction in daily use.'
                          : 'Suffers from interaction lag and lack of tactile refinement.')}
                    &rdquo;
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    — {profile?.displayName || 'Critic'}, {profile?.role || 'Reviewer'}
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

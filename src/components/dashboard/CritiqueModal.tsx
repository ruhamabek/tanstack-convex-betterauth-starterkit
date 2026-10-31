import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, CheckCircle2, Palette, Edit, Pencil, Plus } from 'lucide-react'
import { z } from 'zod'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import CriticAvatar from '../CriticAvatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { useSelector } from '@tanstack/react-form'
import { useAppForm } from '../form'

export interface CritiqueModalProps {
  isOpen: boolean
  onClose: () => void
  apps: Doc<'apps'>[]
  profile?: Doc<'profiles'> | null
  initialAppId?: Id<'apps'> | string
  onOpenCreateSpecimen?: () => void
  onSubmit: (args: {
    appId: Id<'apps'>
    craftScore: number
    utilityScore: number
    headline: string
    quote: string
  }) => Promise<void>
}

const critiqueSchema = z.object({
  appId: z.string().min(1, 'Please select an application to evaluate.'),
  craftScore: z.number().min(10).max(100),
  utilityScore: z.number().min(10).max(100),
  headline: z
    .string()
    .min(1, 'Please enter a punchy review headline.')
    .max(120, 'Headline cannot exceed 120 characters.'),
  quote: z
    .string()
    .min(1, 'Please enter your critique body.')
    .max(600, 'Critique cannot exceed 600 characters.'),
})

type CritiqueFormValues = z.infer<typeof critiqueSchema>

export default function CritiqueModal({
  isOpen,
  onClose,
  apps,
  profile,
  initialAppId,
  onOpenCreateSpecimen,
  onSubmit,
}: CritiqueModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const defaultAppId = initialAppId || (apps.length > 0 ? (apps[0]._id as string) : '')

  const form = useAppForm({
    defaultValues: {
      appId: defaultAppId,
      craftScore: 94,
      utilityScore: 90,
      headline: '',
      quote: '',
    } as CritiqueFormValues,
    validators: {
      onSubmit: critiqueSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        await onSubmit({
          appId: value.appId as Id<'apps'>,
          craftScore: value.craftScore,
          utilityScore: value.utilityScore,
          headline: value.headline.trim(),
          quote: value.quote.trim(),
        })
        form.reset()
        onClose()
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to submit critique.')
      }
    },
  })

  // Ensure default app is selected if apps load or change
  useEffect(() => {
    if (apps.length > 0 && !form.getFieldValue('appId')) {
      form.setFieldValue('appId', apps[0]._id as string)
    }
  }, [apps, form])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null)
      if (apps.length > 0 && !form.getFieldValue('appId')) {
        form.setFieldValue('appId', apps[0]._id as string)
      }
    }
  }, [isOpen, apps, form])

  const filteredApps = useMemo(() => {
    if (sourceFilter === 'all') return apps
    return apps.filter((a) => (a.sourceType || 'product') === sourceFilter)
  }, [apps, sourceFilter])

  // Reactive subscription to form values for the live scorecard preview
  const formValues = useSelector(form.store, (s) => s.values)
  const isSubmitting = useSelector(form.store, (s) => s.isSubmitting)

  const selectedApp = useMemo(
    () => apps.find((a) => a._id === formValues.appId),
    [apps, formValues.appId],
  )

  const liveVerdict = useMemo(() => {
    const craft = formValues.craftScore ?? 94
    const utility = formValues.utilityScore ?? 90
    if (craft >= 90 && utility >= 80) return 'lgtm'
    if (craft >= 70 || utility >= 70) return 'mixed'
    return 'rotten'
  }, [formValues.craftScore, formValues.utilityScore])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 sm:p-8" onClose={onClose}>
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between pb-5 border-b border-black/10 mb-6 pr-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-800">
              <Edit className="size-4 text-emerald-600" />
            </span>
            <div>
              <DialogTitle>Log a Software Critique</DialogTitle>
              <DialogDescription>
                Grade craft vs utility. 
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {submitError}
          </div>
        )}

        {/* Body: Form Controls + Live Scorecard Preview */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* App Picker */}
            <form.AppField
              name="appId"
              children={(field) => {
                const isTouched = field.state.meta.isTouched || field.form.state.submissionAttempts > 0
                const rawError = isTouched && field.state.meta.errors.length > 0 ? field.state.meta.errors[0] : null
                const appError = typeof rawError === 'string' ? rawError : rawError && typeof rawError === 'object' && 'message' in rawError ? (rawError as { message?: string }).message : null

                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Select Craft Specimen
                      </label>
                      {onOpenCreateSpecimen && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onOpenCreateSpecimen()
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 transition cursor-pointer"
                        >
                          <Plus className="size-3" />
                          <span>+ Log New Specimen</span>
                        </button>
                      )}
                    </div>

                    {/* Source filter tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'product', label: 'Products' },
                        { id: 'dribbble', label: 'Dribbble' },
                        { id: 'mobbin', label: 'Mobbin' },
                        { id: 'figma', label: 'Figma' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSourceFilter(tab.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition shrink-0 cursor-pointer ${
                            sourceFilter === tab.id
                              ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                              : 'bg-black/5 hover:bg-black/10 text-muted-foreground border border-transparent'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
                      {filteredApps.map((app) => {
                        const isSelected = field.state.value === app._id
                        return (
                          <button
                            key={app._id}
                            type="button"
                            onClick={() => field.handleChange(app._id as string)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
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
                              <span className="text-[9px] font-mono text-muted-foreground truncate block uppercase">
                                {app.sourceType || 'product'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {appError && (
                      <p className="text-[11px] font-semibold text-rose-600 px-1 mt-1" role="alert">
                        {appError}
                      </p>
                    )}
                  </div>
                )
              }}
            />

            {/* Dual Tactile Sliders (No emojis - crisp Lucide icons) */}
            <div className="space-y-4 p-4 rounded-2xl bg-desk border border-black/10 shadow-2xs">
              {/* Craft Slider */}
              <form.AppField
                name="craftScore"
                children={(field) => (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Palette className="size-4 text-emerald-600" />
                        <span>Craft Score (Design & Polish)</span>
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
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 font-semibold mt-0.5">
                      <span>Clunky (10%)</span>
                      <span>Flawless 60fps (100%)</span>
                    </div>
                  </div>
                )}
              />

              {/* Utility Slider */}
              <form.AppField
                name="utilityScore"
                children={(field) => (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Pencil className="size-4 text-amber-500" />
                        <span>Utility Score (Workhorse Value)</span>
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
                    <div className="flex justify-between text-[10px] text-neutral-400 font-semibold mt-0.5">
                      <span>Gimmick (10%)</span>
                      <span>Daily Driver (100%)</span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Headline using TanStack Form */}
            <form.AppField
              name="headline"
              children={(field) => (
                <field.TextField
                  label="Critique Headline"
                  placeholder="e.g. Sublime keyboard shortcuts, but high memory footprint."
                  maxLength={120}
                />
              )}
            />

            {/* Quote using TanStack Form TextareaField */}
            <form.AppField
              name="quote"
              children={(field) => (
                <field.TextareaField
                  label="Critique Body / Quote"
                  placeholder="e.g. Instant 60fps animations, sublime typographic hierarchy. Other devtools feel like mud compared to this."
                  rows={3}
                  maxLength={600}
                />
              )}
            />

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-neutral-600 hover:text-foreground transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                <span>Publish Critique Scorecard</span>
              </button>
            </div>
          </div>

          {/* Right: Live Tactile Paper Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2 text-center">
              Scorecard Preview
            </span>

            <div className="relative rounded-[28px] border border-black/15 bg-scorecard p-6 shadow-md rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-black/10">
                {selectedApp?.iconUrl && (
                  <img
                    src={selectedApp.iconUrl}
                    alt={selectedApp.name}
                    className="size-10 rounded-xl object-contain border border-black/5 bg-white shrink-0 p-0.5 shadow-2xs"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div>
                  <h4 className="text-base font-black text-foreground">
                    {selectedApp?.name ?? 'Application'}
                  </h4>
                  <p className="text-[10px] font-medium text-neutral-500">
                    {selectedApp?.category ?? 'Category'}
                  </p>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 divide-x divide-black/10 py-3 my-2">
                <div className="pr-3 text-center">
                  <div className="text-3xl font-black text-foreground">
                    {formValues.craftScore}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
                    Craft
                  </div>
                </div>
                <div className="pl-3 text-center">
                  <div className="text-3xl font-black text-foreground">
                    {formValues.utilityScore}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
                    Utility
                  </div>
                </div>
              </div>

              {/* Quote and signature */}
              <div className="relative min-h-[90px] pt-2 border-t border-black/10">
                {formValues.headline && (
                  <p className="text-xs font-bold text-foreground mb-1 leading-snug">
                    {formValues.headline}
                  </p>
                )}
                <p className="text-[11px] leading-relaxed text-neutral-700 italic">
                  &ldquo;{formValues.quote || 'Your critique will be stamped here as permanent consensus.'}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <CriticAvatar
                    avatarUrl={profile?.avatarUrl}
                    seed={profile?.handle ?? 'critic'}
                    size="xs"
                    rounded="full"
                  />
                  <p className="text-[11px] font-bold text-neutral-900">
                    — {profile?.displayName ?? 'Your Critic Name'}, {profile?.role ?? 'Role'}
                  </p>
                </div>

                {/* Dynamic Spring Stamp */}
                {liveVerdict === 'lgtm' && (
                  <motion.img
                    key="stamp-lgtm"
                    initial={{ scale: 1.4, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 0.95, rotate: 3 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    src="/assets/stamp_certified_lgtm.png"
                    alt="Certified LGTM"
                    className="absolute bottom-0 right-0 w-28 drop-shadow-xs select-none pointer-events-none z-10"
                  />
                )}
                {liveVerdict === 'mixed' && (
                  <motion.img
                    key="stamp-mixed"
                    initial={{ scale: 1.4, opacity: 0, rotate: 10 }}
                    animate={{ scale: 1, opacity: 0.95, rotate: -3 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    src="/assets/stamp_needs_polish.png"
                    alt="Needs Polish"
                    className="absolute bottom-0 right-0 w-28 drop-shadow-xs select-none pointer-events-none z-10"
                  />
                )}
                {liveVerdict === 'rotten' && (
                  <motion.img
                    key="stamp-rotten"
                    initial={{ scale: 1.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 0.95, rotate: 4 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    src="/assets/stamp_certified_rotten.png"
                    alt="Certified Rotten"
                    className="absolute bottom-0 right-0 w-28 drop-shadow-xs select-none pointer-events-none z-10"
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

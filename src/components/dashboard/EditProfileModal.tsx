import { useState, useEffect } from 'react'
import { UserCircle2, LoaderCircle, Image as ImageIcon, Upload, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import AvatarPicker from '../AvatarPicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { useSelector } from '@tanstack/react-form'
import { useAppForm } from '../form'

export interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile?: (Doc<'profiles'> & { bannerUrl?: string }) | null
  userEmail?: string
  defaultName?: string
  onSave: (args: {
    handle: string
    displayName: string
    role: string
    bio?: string
    avatarUrl?: string
    bannerUrl?: string
    bannerStorageId?: Id<'_storage'>
  }) => Promise<void>
}

const SUGGESTED_ROLES = [
  'Design Engineer',
  'Staff Product Designer',
  'Frontend Architect',
  'Product Crafter',
  'Systems Engineer',
  'Founding Engineer',
]

const profileSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters.')
    .max(24, 'Handle cannot exceed 24 characters.')
    .regex(/^[a-z0-9_]+$/, 'Handle can only contain lowercase letters, numbers, and underscores.'),
  displayName: z
    .string()
    .min(1, 'Display name is required.')
    .max(50, 'Display name cannot exceed 50 characters.'),
  role: z
    .string()
    .min(1, 'Professional role is required.')
    .max(50, 'Role cannot exceed 50 characters.'),
  bio: z.string().max(250, 'Bio cannot exceed 250 characters.').optional(),
  avatarUrl: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  userEmail,
  defaultName = 'Critic',
  onSave,
}: EditProfileModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile?.bannerUrl || null)
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null)
  const [isBannerRemoved, setIsBannerRemoved] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  const generateUploadUrl = useConvexMutation(api.storage.generateUploadUrl)

  const getInitialValues = (): ProfileFormValues => {
    if (profile) {
      return {
        handle: profile.handle,
        displayName: profile.displayName,
        role: profile.role,
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
      }
    }
    const sanitized = defaultName.toLowerCase().replace(/[^a-z0-9]/g, '')
    return {
      handle: `${sanitized}_critic`,
      displayName: defaultName || 'Software Critic',
      role: 'Design Engineer',
      bio: '',
      avatarUrl: '',
    }
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image size cannot exceed 5MB.')
      return
    }
    setPendingBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setIsBannerRemoved(false)
    setSubmitError(null)
  }

  const handleRemoveBanner = () => {
    setPendingBannerFile(null)
    setBannerPreview(null)
    setIsBannerRemoved(true)
  }

  const form = useAppForm({
    defaultValues: getInitialValues(),
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const cleanHandle = value.handle.trim().toLowerCase().replace(/^@/, '')

      try {
        let uploadedStorageId: Id<'_storage'> | undefined = undefined

        if (pendingBannerFile) {
          setIsUploadingBanner(true)
          const postUrl = await generateUploadUrl({})
          const uploadRes = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': pendingBannerFile.type || 'image/jpeg' },
            body: pendingBannerFile,
          })
          if (!uploadRes.ok) {
            throw new Error('Failed to upload background picture.')
          }
          const json = await uploadRes.json()
          uploadedStorageId = json.storageId
        }

        await onSave({
          handle: cleanHandle,
          displayName: value.displayName.trim() || 'Anonymous Critic',
          role: value.role.trim() || 'Product Crafter',
          bio: value.bio?.trim() || undefined,
          avatarUrl: value.avatarUrl || undefined,
          bannerStorageId: uploadedStorageId,
          bannerUrl: isBannerRemoved ? '' : (uploadedStorageId ? undefined : profile?.bannerUrl),
        })
        onClose()
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to save critic identity.')
      } finally {
        setIsUploadingBanner(false)
      }
    },
  })

  // Synchronize form when opened or when profile changes
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null)
      const initial = getInitialValues()
      form.setFieldValue('handle', initial.handle)
      form.setFieldValue('displayName', initial.displayName)
      form.setFieldValue('role', initial.role)
      form.setFieldValue('bio', initial.bio)
      form.setFieldValue('avatarUrl', initial.avatarUrl)
      setBannerPreview(profile?.bannerUrl || null)
      setPendingBannerFile(null)
      setIsBannerRemoved(false)
    }
  }, [isOpen, profile, defaultName])

  const formValues = useSelector(form.store, (s) => s.values)
  const isSaving = useSelector(form.store, (s) => s.isSubmitting)
  const isBusy = isSaving || isUploadingBanner

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 scrollbar-none" onClose={onClose}>
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between pb-5 border-b border-black/10 mb-6 pr-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-800">
              <UserCircle2 className="size-4 text-amber-600" />
            </span>
            <div>
              <DialogTitle>
                {profile ? 'Edit Critic Identity' : 'Claim Critic Pseudonym'}
              </DialogTitle>
              <DialogDescription>
                {userEmail ? `Signed in as ${userEmail} • ` : ''}Your real identity is protected behind your critic persona.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {submitError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          {/* Background Cover Picture Uploader */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Background Cover Picture
              </label>
              {bannerPreview && (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="size-3" />
                  <span>Remove picture</span>
                </button>
              )}
            </div>

            <div className="relative h-28 sm:h-36 w-full rounded-2xl overflow-hidden border border-black/10 bg-gradient-to-r from-amber-200/50 via-stone-200/60 to-orange-100/60 group">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Background cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-1.5 p-4 text-center">
                  <div className="size-9 rounded-full bg-white/70 flex items-center justify-center shadow-2xs">
                    <ImageIcon className="size-4.5 text-neutral-500" />
                  </div>
                  <span className="text-xs font-medium text-neutral-600">Default ambient stationery cover</span>
                </div>
              )}

              {/* Upload Hover Overlay */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-foreground text-xs font-bold shadow-md hover:bg-neutral-100 transition cursor-pointer active:scale-95">
                  <Upload className="size-3.5" />
                  <span>{bannerPreview ? 'Change Picture' : 'Upload Picture'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerFileChange}
                  />
                </label>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition cursor-pointer active:scale-95"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Recommended: 1500 × 500 px. PNG, JPG, or WebP up to 5MB. Hover over banner to upload.
            </p>
          </div>

          {/* Avatar Studio */}
          <form.AppField
            name="avatarUrl"
            children={(field) => (
              <AvatarPicker
                value={field.state.value || ''}
                baseSeed={formValues.handle || 'critic'}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          />

          {/* Handle & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.AppField
              name="handle"
              children={(field) => (
                <field.TextField
                  label="Handle (Unique Slug)"
                  startAdornment="@"
                  placeholder="pixel_detective"
                  helperText="3-24 characters: lowercase letters, numbers, underscores."
                  className="font-mono"
                  onChange={(e) => {
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    field.handleChange(cleaned)
                  }}
                />
              )}
            />

            <form.AppField
              name="displayName"
              children={(field) => (
                <field.TextField
                  label="Display Name"
                  placeholder="e.g. Kerning Purist"
                  helperText="Your public pseudonym across scorecards."
                />
              )}
            />
          </div>

          {/* Professional Role */}
          <form.AppField
            name="role"
            children={(field) => (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Professional Role / Discipline
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SUGGESTED_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => field.handleChange(r)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                        field.state.value === r
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-black/5 hover:bg-black/10 text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <field.TextField
                  placeholder="Or enter your custom role..."
                  aria-label="Custom role"
                />
              </div>
            )}
          />

          {/* Bio / Craft Creed */}
          <form.AppField
            name="bio"
            children={(field) => (
              <field.TextareaField
                label="Bio / Craft Creed (Optional)"
                placeholder="e.g. Obsessed with 60fps keyboard latency, tactile typography, and micro-interactions."
                rows={2}
                maxLength={250}
              />
            )}
          />

          {/* Submit */}
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
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {isBusy && <LoaderCircle className="size-4 animate-spin" />}
              <span>{isUploadingBanner ? 'Uploading Cover...' : 'Save Persona'}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

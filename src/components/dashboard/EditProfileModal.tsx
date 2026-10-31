import { useState, useEffect } from 'react'
import { UserCircle2, LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import type { Doc } from '../../../convex/_generated/dataModel'
import AvatarPicker from '../AvatarPicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { useSelector } from '@tanstack/react-form'
import { useAppForm } from '../form'

export interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile?: Doc<'profiles'> | null
  userEmail?: string
  defaultName?: string
  onSave: (args: {
    handle: string
    displayName: string
    role: string
    bio?: string
    avatarUrl?: string
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

  const form = useAppForm({
    defaultValues: getInitialValues(),
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const cleanHandle = value.handle.trim().toLowerCase().replace(/^@/, '')

      try {
        await onSave({
          handle: cleanHandle,
          displayName: value.displayName.trim() || 'Anonymous Critic',
          role: value.role.trim() || 'Product Crafter',
          bio: value.bio?.trim() || undefined,
          avatarUrl: value.avatarUrl || undefined,
        })
        onClose()
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to save critic identity.')
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
    }
  }, [isOpen, profile, defaultName])

  const formValues = useSelector(form.store, (s) => s.values)
  const isSaving = useSelector(form.store, (s) => s.isSubmitting)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-6 sm:p-8" onClose={onClose}>
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
          className="space-y-5"
        >
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
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <LoaderCircle className="size-4 animate-spin" />}
              <span>Save Persona</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

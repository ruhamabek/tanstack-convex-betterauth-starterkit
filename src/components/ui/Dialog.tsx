import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/* =========================================================================
   DIALOG CONTEXT
   ========================================================================= */

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be rendered within a <Dialog />')
  }
  return context
}

/* =========================================================================
   ROOT COMPONENT
   ========================================================================= */

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

/* =========================================================================
   TRIGGER
   ========================================================================= */

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialog()

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented) {
            onOpenChange(true)
          }
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DialogTrigger.displayName = 'DialogTrigger'

/* =========================================================================
   PORTAL
   ========================================================================= */

export interface DialogPortalProps {
  children: React.ReactNode
}

export function DialogPortal({ children }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}

/* =========================================================================
   OVERLAY
   ========================================================================= */

export interface DialogOverlayProps {
  className?: string
  onClick?: () => void
}

export function DialogOverlay({ className = '', onClick }: DialogOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity ${className}`}
      aria-hidden="true"
    />
  )
}

/* =========================================================================
   CONTENT
   ========================================================================= */

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean
  onClose?: () => void
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, showCloseButton = true, onClose, ...props }, ref) => {
    const { open, onOpenChange } = useDialog()

    const handleClose = React.useCallback(() => {
      onClose?.()
      onOpenChange(false)
    }, [onClose, onOpenChange])

    // Handle ESC key
    React.useEffect(() => {
      if (!open) return

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, handleClose])

    // Body scroll lock
    React.useEffect(() => {
      if (!open) return
      const originalStyle = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }, [open])

    return (
      <DialogPortal>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <DialogOverlay onClick={handleClose} />

              <motion.div
                ref={ref}
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full rounded-[32px] bg-canvas border border-black/10 shadow-2xl p-6 sm:p-8 z-50 my-auto ${className}`}
                {...(props as any)}
              >
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-6 top-6 rounded-full p-2 text-neutral-400 hover:text-foreground hover:bg-black/5 transition cursor-pointer z-10"
                    aria-label="Close dialog"
                  >
                    <X className="size-5" />
                  </button>
                )}
                {children}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </DialogPortal>
    )
  },
)
DialogContent.displayName = 'DialogContent'

/* =========================================================================
   HEADER & SUBCOMPONENTS
   ========================================================================= */

export function DialogHeader({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col gap-1 pb-4 border-b border-black/10 mb-6 ${className}`}
      {...props}
    />
  )
}

export function DialogTitle({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-xl font-extrabold text-foreground tracking-tight ${className}`}
      {...props}
    />
  )
}

export function DialogDescription({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs text-neutral-500 font-medium ${className}`}
      {...props}
    />
  )
}

export function DialogFooter({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`pt-4 flex items-center justify-end gap-3 border-t border-black/10 mt-6 ${className}`}
      {...props}
    />
  )
}

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { onOpenChange } = useDialog()
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) {
          onOpenChange(false)
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
})
DialogClose.displayName = 'DialogClose'

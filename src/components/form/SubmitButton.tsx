import { LoaderCircle } from 'lucide-react'
import { useFormContext } from './context'

export interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  loadingLabel?: string
  isPending?: boolean
}

export function SubmitButton({
  children,
  label,
  loadingLabel = 'Submitting…',
  isPending = false,
  className = '',
  disabled,
  ...rest
}: SubmitButtonProps) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }) => {
        const busy = isSubmitting || isPending
        const isDisabled = disabled || !canSubmit || busy

        return (
          <button
            {...rest}
            type="submit"
            disabled={isDisabled}
            className={`w-full py-3.5 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 ${className}`}
          >
            {busy ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              children || label || 'Submit'
            )}
          </button>
        )
      }}
    </form.Subscribe>
  )
}

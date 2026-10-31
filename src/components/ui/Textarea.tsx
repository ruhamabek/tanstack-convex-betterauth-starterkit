import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, id, ...props }, ref) => {
    const hasError = Boolean(error)

    return (
      <textarea
        ref={ref}
        id={id}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition shadow-2xs ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200/50'
            : 'border-input focus:ring-primary/20 focus:border-primary'
        } ${className}`}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

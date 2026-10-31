import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error, startAdornment, endAdornment, id, ...props }, ref) => {
    const hasError = Boolean(error)

    return (
      <div className="relative w-full flex items-center">
        {startAdornment && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
            {startAdornment}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition shadow-2xs ${
            hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200/50'
              : 'border-input focus:ring-primary/20 focus:border-primary'
          } ${startAdornment ? 'pl-9' : ''} ${endAdornment ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-neutral-400">
            {endAdornment}
          </div>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useFieldContext } from './context'

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
  label?: string
  helperText?: string
  startAdornment?: ReactNode
  showPasswordToggle?: boolean
}

export function TextField({
  label,
  helperText,
  startAdornment,
  type = 'text',
  placeholder,
  className = '',
  showPasswordToggle = true,
  autoComplete,
  id,
  ...rest
}: TextFieldProps) {
  const field = useFieldContext<string>()
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordField = type === 'password'
  const effectiveType = isPasswordField && showPassword ? 'text' : type

  const isTouched = field.state.meta.isTouched || field.form.state.submissionAttempts > 0
  const rawError = isTouched && field.state.meta.errors.length > 0 ? field.state.meta.errors[0] : null
  const errorMessage =
    typeof rawError === 'string'
      ? rawError
      : rawError && typeof rawError === 'object' && 'message' in rawError
        ? (rawError as { message?: string }).message
        : rawError
          ? String(rawError)
          : null

  const inputId = id || field.name

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startAdornment && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400 font-semibold text-sm">
            {startAdornment}
          </div>
        )}
        <input
          {...rest}
          id={inputId}
          name={field.name}
          type={effectiveType}
          value={field.state.value ?? ''}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition shadow-2xs ${
            errorMessage
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200/50'
              : 'border-input focus:border-primary focus:ring-primary/20'
          } ${startAdornment ? 'pl-8' : ''} ${isPasswordField && showPasswordToggle ? 'pr-12' : ''} ${className}`}
        />
        {isPasswordField && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer transition p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {errorMessage ? (
        <p className="text-[11px] font-semibold text-rose-600 px-1 mt-1" role="alert">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-muted-foreground px-1 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

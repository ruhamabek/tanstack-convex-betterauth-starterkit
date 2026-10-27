import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useFieldContext } from './context'

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
  label?: string
  showPasswordToggle?: boolean
}

export function TextField({
  label,
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
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
          className={`w-full px-5 py-3 rounded-full border bg-white text-xs text-foreground placeholder:text-neutral-400 focus:outline-hidden focus:border-black/40 focus:ring-1 focus:ring-black/10 shadow-2xs transition ${
            errorMessage
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-input'
          } ${isPasswordField && showPasswordToggle ? 'pr-12' : ''} ${className}`}
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
      {errorMessage && (
        <p className="text-[11px] font-medium text-red-600 px-4 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

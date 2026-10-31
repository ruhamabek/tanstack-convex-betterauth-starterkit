import * as React from 'react'
import { useFieldContext } from './context'
import { Textarea } from '../ui/Textarea'

export interface TextareaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue'> {
  label?: string
  helperText?: string
}

export function TextareaField({
  label,
  helperText,
  placeholder,
  className = '',
  rows = 3,
  id,
  ...rest
}: TextareaFieldProps) {
  const field = useFieldContext<string>()

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
      <Textarea
        {...rest}
        id={inputId}
        name={field.name}
        rows={rows}
        value={field.state.value ?? ''}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        error={Boolean(errorMessage)}
        className={className}
      />
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

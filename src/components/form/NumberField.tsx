import { useFieldContext } from './context'

export interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'type'> {
  label?: string
}

export function NumberField({
  label,
  placeholder,
  className = '',
  id,
  min,
  max,
  step,
  ...rest
}: NumberFieldProps) {
  const field = useFieldContext<number>()

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
      <input
        {...rest}
        id={inputId}
        name={field.name}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(field.state.value) ? '' : (field.state.value ?? '')}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
        className={`w-full px-5 py-3 rounded-full border bg-white text-xs text-foreground placeholder:text-neutral-400 focus:outline-hidden focus:border-black/40 focus:ring-1 focus:ring-black/10 shadow-2xs transition ${
          errorMessage
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-input'
        } ${className}`}
      />
      {errorMessage && (
        <p className="text-[11px] font-medium text-red-600 px-4 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

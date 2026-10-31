import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext, useFieldContext, useFormContext } from './context'
import { TextField } from './TextField'
import { NumberField } from './NumberField'
import { TextareaField } from './TextareaField'
import { SubmitButton } from './SubmitButton'

// Generator of consistent, type-safe form instances with pre-bound design components
export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
    TextareaField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})

export {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  TextField,
  NumberField,
  TextareaField,
  SubmitButton,
}

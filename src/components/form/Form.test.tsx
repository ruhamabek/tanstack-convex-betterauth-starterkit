import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { z } from 'zod'
import { useAppForm } from './index'

function TestForm() {
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Password too short'),
      }),
    },
    onSubmit: () => {},
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.AppField
        name="email"
        children={(field) => (
          <field.TextField label="Email Address" placeholder="Enter email" />
        )}
      />
      <form.AppField
        name="password"
        children={(field) => (
          <field.TextField label="Password" type="password" placeholder="Enter password" />
        )}
      />
      <form.AppForm>
        <form.SubmitButton label="Sign In" />
      </form.AppForm>
    </form>
  )
}

describe('TanStack Form Composition', () => {
  test('renders email, password fields and submit button correctly', () => {
    const html = renderToStaticMarkup(<TestForm />)

    expect(html).toContain('Email Address')
    expect(html).toContain('placeholder="Enter email"')
    expect(html).toContain('Password')
    expect(html).toContain('placeholder="Enter password"')
    expect(html).toContain('Sign In')
  })
})

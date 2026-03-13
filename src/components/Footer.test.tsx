import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Footer from './Footer'

describe('Footer', () => {
  test('renders the current stack label', () => {
    const html = renderToStaticMarkup(<Footer />)

    expect(html).toContain('TanStack Start, Better Auth, and Convex')
  })
})

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handler } = await import('../../../lib/auth-server')
        return handler(request)
      },
      POST: async ({ request }) => {
        const { handler } = await import('../../../lib/auth-server')
        return handler(request)
      },
    },
  },
})

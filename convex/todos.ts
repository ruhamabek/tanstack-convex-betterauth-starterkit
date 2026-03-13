import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

type AuthUserContext = Parameters<typeof authComponent.getAuthUser>[0]

async function requireUserId(ctx: unknown) {
  const user = await authComponent.getAuthUser(ctx as AuthUserContext)
  return String(user._id)
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const todos = await ctx.db
      .query('todos')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    return todos.sort((left, right) => right.createdAt - left.createdAt)
  },
})

export const create = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const text = args.text.trim()

    if (!text) {
      throw new Error('Todo text cannot be empty.')
    }

    if (text.length > 160) {
      throw new Error('Todo text must be 160 characters or fewer.')
    }

    return await ctx.db.insert('todos', {
      userId,
      text,
      completed: false,
      createdAt: Date.now(),
    })
  },
})

export const toggle = mutation({
  args: {
    id: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const todo = await ctx.db.get(args.id)

    if (!todo) {
      throw new Error('Todo not found.')
    }

    if (todo.userId !== userId) {
      throw new Error('You do not have access to this todo.')
    }

    await ctx.db.patch(args.id, {
      completed: !todo.completed,
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const todo = await ctx.db.get(args.id)

    if (!todo) {
      throw new Error('Todo not found.')
    }

    if (todo.userId !== userId) {
      throw new Error('You do not have access to this todo.')
    }

    await ctx.db.delete(args.id)
  },
})

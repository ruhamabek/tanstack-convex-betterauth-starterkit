import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { SignOutButton } from '../components/AuthControls'

export const Route = createFileRoute('/_protected/dashboard')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
      ),
      context.queryClient.ensureQueryData(
        context.convexQueryClient.queryOptions(api.todos.list, {}),
      ),
    ])

    return null
  },
  component: DashboardPage,
})

function DashboardPage() {
  const [draft, setDraft] = useState('')
  const { convexQueryClient } = Route.useRouteContext()
  const { data: user } = useQuery(
    convexQueryClient.queryOptions(api.auth.getCurrentUser, {}),
  )
  const { data: todos = [] } = useQuery(
    convexQueryClient.queryOptions(api.todos.list, {}),
  )

  const createTodoMutation = useConvexMutation(api.todos.create)
  const toggleTodoMutation = useConvexMutation(api.todos.toggle)
  const removeTodoMutation = useConvexMutation(api.todos.remove)

  const createTodo = useMutation({
    mutationFn: createTodoMutation,
  })
  const toggleTodo = useMutation({
    mutationFn: toggleTodoMutation,
  })
  const removeTodo = useMutation({
    mutationFn: removeTodoMutation,
  })

  const completedCount = todos.filter((todo) => todo.completed).length
  const remainingCount = todos.length - completedCount
  const activityMessage =
    createTodo.error?.message ??
    toggleTodo.error?.message ??
    removeTodo.error?.message

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = draft.trim()
    if (!text || createTodo.isPending) {
      return
    }

    createTodo.mutate(
      { text },
      {
        onSuccess: () => {
          setDraft('')
        },
      },
    )
  }

  const formatCreatedAt = (createdAt: number) =>
    `${new Date(createdAt).toISOString().slice(0, 16).replace('T', ' ')} UTC`

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.24),transparent_68%)]" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.14),transparent_68%)]" />
        <p className="island-kicker mb-3">Protected Todo List</p>
        <h1 className="display-title mb-4 max-w-3xl text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          A simple Convex-backed todo list for {user?.name ?? 'your account'}.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Every item is scoped to the signed-in user and updates live through
          Convex queries and mutations. No REST layer, no extra client state.
        </p>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            <article className="feature-card rounded-3xl border border-[var(--line)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="island-kicker mb-2">New Todo</p>
                  <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                    Keep this intentionally small.
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink-soft)]">
                  {remainingCount} open
                </div>
              </div>

              <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--sea-ink)]">
                    What needs doing?
                  </span>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    maxLength={160}
                    placeholder="Reply to the client, refactor the auth callback, ship the build..."
                    className="w-full rounded-3xl border border-[var(--line)] bg-white/65 px-4 py-3 text-base text-[var(--sea-ink)] outline-none transition placeholder:text-[color:var(--sea-ink-soft)] focus:border-[rgba(50,143,151,0.5)] focus:bg-white/80"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                    {draft.trim().length}/160 characters
                  </p>
                  <button
                    type="submit"
                    disabled={!draft.trim() || createTodo.isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(50,143,151,0.28)] bg-[rgba(79,184,178,0.16)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createTodo.isPending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{createTodo.isPending ? 'Adding…' : 'Add Todo'}</span>
                  </button>
                </div>
              </form>

              {activityMessage ? (
                <p className="mt-3 rounded-2xl border border-[rgba(180,70,70,0.2)] bg-[rgba(180,70,70,0.08)] px-4 py-3 text-sm text-[var(--sea-ink)]">
                  {activityMessage}
                </p>
              ) : null}
            </article>

            <article className="feature-card rounded-3xl border border-[var(--line)] p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="island-kicker mb-2">Your Items</p>
                  <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                    {todos.length === 0
                      ? 'Nothing queued yet.'
                      : `${todos.length} todo${todos.length === 1 ? '' : 's'} in play.`}
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink-soft)]">
                  {completedCount} done
                </div>
              </div>

              {todos.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-[var(--line)] bg-white/35 px-5 py-10 text-center">
                  <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
                    Your list is empty.
                  </p>
                  <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
                    Add one small task above and the list will start syncing through Convex immediately.
                  </p>
                </div>
              ) : (
                <ul className="m-0 space-y-3 p-0">
                  {todos.map((todo) => {
                    const isToggling =
                      toggleTodo.isPending && toggleTodo.variables.id === todo._id
                    const isRemoving =
                      removeTodo.isPending && removeTodo.variables.id === todo._id
                    const isMutating = isToggling || isRemoving

                    return (
                      <li
                        key={todo._id}
                        className="flex list-none items-start gap-3 rounded-[1.75rem] border border-[var(--line)] bg-white/45 px-4 py-4"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTodo.mutate({ id: todo._id })}
                          disabled={isMutating}
                          className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={
                            todo.completed
                              ? `Mark ${todo.text} as incomplete`
                              : `Mark ${todo.text} as complete`
                          }
                        >
                          {isToggling ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : todo.completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`m-0 text-base font-semibold ${
                              todo.completed
                                ? 'text-[var(--sea-ink-soft)] line-through'
                                : 'text-[var(--sea-ink)]'
                            }`}
                          >
                            {todo.text}
                          </p>
                          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                            Added {formatCreatedAt(todo.createdAt)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeTodo.mutate({ id: todo._id })}
                          disabled={isMutating}
                          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(23,58,64,0.15)] bg-white/70 text-[var(--sea-ink-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${todo.text}`}
                        >
                          {isRemoving ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          </div>

          <aside className="feature-card rounded-3xl border border-[var(--line)] p-6">
            <p className="island-kicker mb-2">Session</p>
            <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
              Signed in and ready.
            </h2>
            <dl className="mt-5 grid gap-4 text-sm text-[var(--sea-ink-soft)]">
              <div>
                <dt className="font-semibold text-[var(--sea-ink)]">Name</dt>
                <dd className="m-0">{user?.name ?? 'Not provided by Google'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--sea-ink)]">Email</dt>
                <dd className="m-0">{user?.email ?? 'Unavailable'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--sea-ink)]">Progress</dt>
                <dd className="m-0">
                  {completedCount} complete, {remainingCount} remaining
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/40 p-4">
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                Sign out still reloads the page so the authenticated Convex cache
                clears cleanly.
              </p>
              <SignOutButton className="mt-4 rounded-full border border-[rgba(23,58,64,0.2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--sea-ink)]" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

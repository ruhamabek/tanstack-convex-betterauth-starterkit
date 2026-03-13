# TanStack Start + Better Auth + Convex

This project boots a plain TanStack Start app and wires authentication through
Better Auth running on Convex. The TanStack app proxies `/api/auth/*`, protects
the dashboard route, and reads the signed-in user from Convex queries.

## Stack

- TanStack Start with file-based routing
- Convex as the backend and auth runtime
- Better Auth with Google OAuth
- TanStack Query + `@convex-dev/react-query` for live Convex queries

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create or connect a Convex dev deployment:

   ```bash
   npm run convex:dev
   ```

   This also replaces the local `_generated` stubs with real Convex-generated
   files.

3. Set Convex deployment environment variables:

   ```bash
   npx convex env set BETTER_AUTH_SECRET "replace-with-a-random-secret"
   npx convex env set SITE_URL "http://localhost:3000"
   npx convex env set GOOGLE_CLIENT_ID "your-google-client-id"
   npx convex env set GOOGLE_CLIENT_SECRET "your-google-client-secret"
   ```

4. Copy the app envs from `.env.example` into `.env.local` and fill in the
   Convex URLs from your deployment:

   ```bash
   VITE_CONVEX_URL="https://your-dev-deployment.convex.cloud"
   VITE_CONVEX_SITE_URL="https://your-dev-deployment.convex.site"
   VITE_SITE_URL="http://localhost:3000"
   ```

5. In Google Cloud Console, add this redirect URI:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

6. Start both processes:

   ```bash
   npm run convex:dev
   npm run dev
   ```

## Production callback

For production, set `SITE_URL` and `VITE_SITE_URL` to your deployed domain and
add:

```text
https://your-domain.example/api/auth/callback/google
```

## Important files

- `convex/auth.ts`: Better Auth server and `api.auth.getCurrentUser`
- `convex/http.ts`: Better Auth HTTP routes mounted inside Convex
- `src/lib/auth-server.ts`: TanStack Start server helpers for Convex auth
- `src/routes/api/auth/$.ts`: TanStack auth proxy route
- `src/routes/_protected.dashboard.tsx`: protected example page

## Note on generated files

This repo includes minimal `_generated` stubs so the project can type-check
before a Convex deployment exists. Once you run `npm run convex:dev`, Convex
will overwrite them with the real generated files for your deployment.

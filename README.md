# Traces Known

AI-assisted allergy intelligence in a single Turborepo. The Next.js web app offers an agentic surface that routes between product lookup, report submission, and allergen-preference experiences. The Expo companion gives travelers a lightweight way to search items and log reactions on the go.

## Stack

- **Next.js 15 + React 19** with shadcn/ui, TanStack Query, and tRPC v11
- **Expo SDK 53** + NativeWind for the mobile client
- **Drizzle ORM + Vercel Postgres** (edge-friendly)
- **Better Auth** shared between web + mobile
- **OpenAI** (`gpt-4o-mini` by default) for the agent router + risk summaries

## Monorepo layout

```
apps/
  nextjs/   → Traces Known web + agent API routes
  expo/     → React Native client via Expo Router
packages/
  api/      → tRPC router + shared server-side logic
  auth/     → Better Auth bootstrapper
  db/       → Drizzle schema & migrations
  ui/       → Reusable shadcn components
tooling/    → ESLint, Prettier, Tailwind, TS configs
```

## Getting started

```bash
pnpm install
cp .env.example .env
# fill in DB, Better-Auth, and OpenAI keys

# apply database schema
pnpm db:push

# seed optional sample data
pnpm -F @acme/db seed
```

### Environment variables

See `.env.example` for the full list. Minimum viable config:

| Variable | Description |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres (pooled) connection string |
| `AUTH_SECRET` | Better Auth secret |
| `OPENAI_API_KEY` | Used by `/api/agent` + risk summaries |
| `OPENAI_MODEL` | Optional override (defaults to `gpt-4o-mini`) |

## Running locally

```bash
# Web (Next.js)
pnpm dev --filter @acme/nextjs...

# Expo (runs against the same Next API)
cd apps/expo
pnpm dev
```

Helpful scripts:

| Command | Description |
| --- | --- |
| `pnpm --filter @acme/nextjs typecheck` | Type-check web app |
| `pnpm --filter @acme/expo typecheck` | Type-check Expo app |
| `pnpm db:push` | Apply Drizzle migrations |
| `pnpm -F @acme/db seed` | Seed baseline allergens/products |

## Agent + AI services

The agent entrypoint lives at `apps/nextjs/src/app/api/agent/route.ts`.

It:

1. Gathers user/allergen context via the tRPC caller
2. Sends a structured prompt to OpenAI
3. Maps the model response to renderable blocks (`lookupResults`, `productSummary`, `reportForm`, etc.)
4. Ensures `product.aiSummary` is generated (or refreshed) before rendering summary blocks

OpenAI config is centralized in `apps/nextjs/src/server/ai/*`.

## Mobile (Expo) parity

The Expo router now mirrors the core flows:

- `/` — quick actions + live community feed
- `/lookup` — search products and deep link into product details
- `/product/[id]` — condensed risk summary + latest reports
- `/report` — inline search + severity logging UI

All screens use the same tRPC client as the web app for full type safety.

## Deployment notes

### Next.js (Vercel)

1. Create a project pointing to `apps/nextjs`
2. Provide env vars: `POSTGRES_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, any OAuth secrets
3. Run `pnpm db:push` (or `drizzle-kit push`) against the production database
4. Deploy – the `/api/agent` route is edge-ready

### Expo (EAS)

1. Update `apps/expo/src/utils/base-url.ts` to point at your deployed Next.js domain
2. Configure EAS:
   ```bash
   cd apps/expo
   pnpm expo install
   pnpm expo start
   eas build:configure
   ```
3. Build & submit:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

## QA checklist

- `pnpm --filter @acme/nextjs typecheck`
- `pnpm --filter @acme/api build`
- `pnpm --filter @acme/expo typecheck`
- Manual smoke tests:
  - sign in/out (Better Auth email/password)
  - submit a report via agent + Expo screen
  - agent prompt “Show me recent alerts”, “Search for cereal”, “Update my allergens”
  - verify `/api/agent` returns `meta.source = openai`

Happy shipping! 🛰️

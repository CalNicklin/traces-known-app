# Traces Known – Web App

The Next.js app is the primary interface for Traces Known – a community-driven database of allergy experiences. Users can authenticate with Better Auth, search products, submit reaction reports, configure their allergens, and (soon) interact with an AI agent that assembles screens on demand.

## Stack

- [Next.js 15](https://nextjs.org/) with the App Router & React Server Components
- [tRPC v11](https://trpc.io/) for end-to-end typesafe APIs
- [Drizzle ORM](https://orm.drizzle.team/) talking to Vercel Postgres
- [Better Auth](https://www.better-auth.com/) for authentication (expo-compatible)
- [shadcn/ui](https://ui.shadcn.com/) design system packaged inside `@acme/ui`

## Environment variables

Copy the example file and fill in the values before running anything locally:

```bash
cp ../../.env.example ../../.env
```

Mandatory values:

| Variable         | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `POSTGRES_URL`   | Connection string for Drizzle + Vercel Postgres (pooled). |
| `AUTH_SECRET`    | Better Auth secret (generate something long & random).    |
| `OPENAI_API_KEY` | Used for AI-generated risk summaries + the agent router.  |

Optional values:

| Variable                                  | Description                                         |
| ----------------------------------------- | --------------------------------------------------- |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | Enable Discord OAuth in Better Auth.                |
| `OPENAI_MODEL`                            | Override the default OpenAI model (`gpt-4.1-mini`). |
| `VERCEL_PROJECT_PRODUCTION_URL`           | Needed when deriving the public base URL on Vercel. |

## Development

```bash
# install dependencies for the whole monorepo
pnpm install

# run database migrations before booting the app
pnpm db:push

# launch Next.js with Turbopack
pnpm dev --filter @acme/nextjs...
```

The agent experience and the Expo client both call into the Next.js API (`/api/trpc`, `/api/agent`). Always keep this app running when working on other surfaces.

## Deployment

Deploy `apps/nextjs` to Vercel (project root: `apps/nextjs`). Required env values:

- `POSTGRES_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- any OAuth provider secrets you configured locally

Run `pnpm db:push` (or the Drizzle migrations) against your production DB, then trigger a Vercel build. Expo apps and all client surfaces should talk to the same deployed backend URL.

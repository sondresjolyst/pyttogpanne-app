<p align="center">
  <img src="docs/pyttogpanne.png" alt="Pyttogpanne" width="220">
</p>

# pyttogpanne-app

Admin console for Pyttogpanne, where the recipes the mobile app shows are
written. Content is stored in
[pyttogpanne-api](https://github.com/sondresjolyst/pyttogpanne-api) and read by
[pyttogpanne-mobile](https://github.com/sondresjolyst/pyttogpanne-mobile).

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS 4, next-auth, Axios, Vitest.

## Quick start

```bash
npm ci
cp .env.example .env
npm run dev
```

pyttogpanne-api must be running and reachable at `NEXT_PUBLIC_API_URL`.
`npm run build` prerenders the legal pages against it and fails when it is
unreachable.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serves the production build |
| `npm test` | Vitest |
| `npm run lint` | ESLint |

## Environment

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, for example `http://localhost:7297/api` |
| `NEXTAUTH_URL` | URL of this app |
| `NEXTAUTH_SECRET` | next-auth session secret |
| `PYTTOGPANNE_API_JWT_SECRET` | Must match the API's `Jwt__Key` |

## Content

| Area | Holds |
| --- | --- |
| Recipes | Ingredients and ordered steps, times, servings, difficulty, categories, photos. Content from a gift, discount or payment is marked as advertising. Saved as a draft until published |
| Categories | Filters recipes are listed under |
| Articles | Gear and trail tips, written in markdown |
| Legal pages | Terms, privacy and cookies, per language |
| Users, settings, statistics | Invitations and roles, company details, totals and daily history |

Sign-in is admin only and there is no public registration. The legal pages are
the only routes a visitor can reach.

## Languages

Every page lives under a locale segment, `/no/...`, and `/` redirects to
Norwegian. UI strings come from `src/i18n/locales/*.json`. Legal text is stored
per language in the API.

To add a language: add its tag to `LOCALES` in `src/i18n/config.ts`, add a
dictionary file next to the others, add the same tag to `Locales.Supported` in
the API, then seed its legal text.

## Layout

```
src/
├── app/[locale]/ # routes: legal pages, (auth), (protected)/admin
├── app/api/      # route handlers (next-auth, revalidation)
├── components/   # shared UI
├── i18n/         # locale config, dictionaries, client provider
├── services/     # API clients, one per domain
├── lib/          # company info, fetch wrappers, cache tags, formatting
├── types/        # shared types
└── proxy.ts      # locale redirect for unprefixed paths
```

## Deployment

Image [`sondresjo/pyttogpanne-app`](https://hub.docker.com/r/sondresjo/pyttogpanne-app)
on Docker Hub, chart `pyttogpanne-app` in
[tumogroup-charts](https://github.com/sondresjolyst/tumogroup-charts), applied by
Flux from [tumo-flux](https://github.com/sondresjolyst/tumo-flux) to
`pyttogpanne-dev` and `pyttogpanne-prod`.

The container runs as the non-root `node` user with a read-only root filesystem,
so anything written at runtime needs a volume. The incremental cache is kept in
memory for that reason.

A push to `main` builds the `dev` tag. A release-please release builds `vX.Y.Z`,
tags it `latest` and opens a chart bump against
[tumogroup-charts](https://github.com/sondresjolyst/tumogroup-charts). Cluster
secrets are created by
[`scripts/pyttogpanne/bootstrap.sh`](https://github.com/sondresjolyst/tumo-platform/blob/main/scripts/pyttogpanne/bootstrap.sh)
in [tumo-platform](https://github.com/sondresjolyst/tumo-platform).

## License

Proprietary. Copyright (c) 2026 Sondre Sjølyst.

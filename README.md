<p align="center">
  <img src="docs/pyttogpanne.png" alt="Pyttogpanne" width="220">
</p>

<p align="center">
  The admin console for Pyttogpanne — where the recipes in the app are written.
</p>

---

pyttogpanne-app is the admin console for **Pyttogpanne** — turmat cooked in one
pan on a gas burner. Pyttogpanne writes recipes, gear tips and site text here,
and the mobile app reads them from
[pyttogpanne-api](https://github.com/sondresjolyst/pyttogpanne-api).

## What's in it

- **Recipes** — an editor for ingredients and steps in order, with times,
  servings, difficulty, categories and a cover photo. Saved as a draft until it
  is published to the app.
- **Categories** — the filters recipes are listed under.
- **Gear and trail tips** — markdown articles alongside the recipes.
- **Legal pages** — terms, privacy and cookies, per language.
- **Users, settings and statistics** — invitations and roles, company details,
  totals and daily history.

Sign-in is admin-only; there is no public registration. The legal pages are the
only routes a visitor can reach.

## Languages

Every page lives under a locale segment — `/no/...` — and `/` redirects to
Norwegian. UI strings come from `src/i18n/locales/*.json`; legal text is stored
per language in the API.

To add a language: add its tag to `LOCALES` in `src/i18n/config.ts`, drop in a
dictionary file next to the others, add the same tag to `Locales.Supported` in
the API, and seed its legal text.

---

## For developers

<details>
<summary>Run, build, and test from source</summary>

### Stack

Next.js (App Router) · TypeScript · Tailwind CSS · next-auth · Axios · Vitest.

### Run locally

```bash
npm install
cp .env.example .env   # set NEXTAUTH_SECRET and PYTTOGPANNE_API_JWT_SECRET (= the API's Jwt__Key)
npm run dev            # http://localhost:3000
```

[pyttogpanne-api](https://github.com/sondresjolyst/pyttogpanne-api) must be running and
reachable at `NEXT_PUBLIC_API_URL`. `npm run build` prerenders the legal pages against it and
fails when it is unreachable.

### Environment

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API (e.g. `http://localhost:7297/api`). |
| `NEXTAUTH_URL` | This app's URL (e.g. `http://localhost:3000`). |
| `NEXTAUTH_SECRET` | next-auth session secret. |
| `PYTTOGPANNE_API_JWT_SECRET` | Must match the API's `Jwt__Key` (verifies its tokens). |

### Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm start       # serve the production build
npm run lint    # ESLint
npm test        # Vitest
```

### Layout

```
src/
├── app/[locale]/ # routes — legal pages, (auth), (protected)/admin
├── app/api/      # route handlers (next-auth, revalidation)
├── components/   # shared UI
├── i18n/         # locale config, dictionaries, client provider
├── services/     # API clients (one per domain)
├── lib/          # helpers (company info, fetch wrappers, cache tags, formatting)
├── types/        # shared types
└── proxy.ts      # locale redirect for unprefixed paths
```

</details>

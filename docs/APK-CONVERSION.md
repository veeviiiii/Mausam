# Converting Mausam to an installable Android APK

A self-contained brief for a fresh session. Everything here was verified against
the codebase, not assumed — including the two things that will break first.

---

## What this project is

A personalized homepage for IMD's Mausam weather app, built for Smart India
Hackathon 2026 (problem statement SIH26076). It is a React single-page app,
currently deployed to Vercel as a web app.

**Goal of this task:** produce an installable Android `.apk` from this same
codebase, using Capacitor, **without breaking the existing web deployment.**
Both targets must build and run from one source tree.

## Stack, as actually installed

Read `client/package.json` — do not assume. As of this writing:

- **Runtime dependencies, four total:** `react` 18.3.1, `react-dom` 18.3.1,
  `framer-motion` ^11.11.17, `maplibre-gl` ^4.7.1
- **Build:** Vite 5.4, TypeScript 5.6, Tailwind 3.4
- **Backend:** two Vercel serverless functions in `client/api/` —
  `aqi.ts` and `warnings.ts`. Plain Node `(req, res)` handlers with **zero
  dependencies**. There is no Express, no `vercel.json`, and no `/server` folder.
- Everything lives under `client/`. There is no monorepo tooling.

## The two blockers, already identified

These are the only two things known to stand between this codebase and a working
native build. Both are small. Fix them first.

### 1. The API calls are relative

- `client/src/lib/useLiveAqi.ts:62` → `fetch(\`/api/aqi?city=...\`)`
- `client/src/lib/useLiveWarnings.ts:30` → `fetch("/api/warnings")`

Inside a Capacitor shell the app is served from `capacitor://localhost`, where
no such routes exist. Both must resolve through a single configurable base URL —
empty string on web (so the current relative behaviour is unchanged), and the
deployed Vercel origin on native.

Put the base in one place. Do not scatter `import.meta.env` reads through the
hooks.

### 2. The serverless routes set no CORS headers

Neither route in `client/api/` sets `access-control-allow-origin`. Once the app
calls them cross-origin every request fails. Add CORS headers, and handle the
`OPTIONS` preflight.

Be careful here: both routes already set `cache-control` deliberately, with
**separate lifetimes for success and failure** (`no-store` on failure is
intentional — it fixed a real bug where a failed response stayed cached for 15
minutes while the app showed stale "seeded" labels). Do not touch that logic.

### Not a blocker: location permissions

There is **no** `navigator.geolocation` anywhere in `src/`. The app works from a
list of saved places, so there is no native location permission to request.

## What must not break

- **`npm run check` must pass.** It runs `tsc --noEmit` plus eight verification
  passes in `client/scripts/verify-tokens.ts` — design-token drift, WCAG contrast
  on 28 sky gradients, 700 hourly-tint samples, dictionary parity across two
  languages, seeded-string drift, and a guard that serverless routes contain no
  relative imports. Read that file before changing anything it checks.
- **The web build must still work.** `npm run build` then deploy to Vercel should
  behave exactly as before. The native path is additive.
- **The `/api` cache headers.** See above.
- **The seeded fallback.** `client/src/data/seed.ts` is the demo-safe floor: if a
  live feed fails, cards keep seeded values and relabel themselves. This is a
  hard requirement, not polish.

## Things to verify in the Android WebView

These are the real risks once it builds. Check each on a device or emulator:

- **MapLibre GL** — WebGL in the WebView. The map screen is lazy-loaded
  (`client/src/screens/PlacesScreen.tsx`), so it will not fail until opened.
- **Framer Motion** — layout animations and the pull-to-refresh gesture.
- **`backdrop-filter`** — the frosted glass. If it drops frames on the test
  device, the app already ships a flat fallback: the "flat glass" toggle on the
  You screen.
- **Google Fonts** — four families load from `fonts.googleapis.com` in
  `client/index.html`. On a first launch with no network, text falls back to a
  system font. Consider self-hosting the fonts for the native build.
- **Safe areas** — status bar and gesture bar insets on a real phone.

## Prerequisites the developer must have

- **Android Studio** with an SDK platform and build tools
- **JDK 17+**
- An emulator or a phone with USB debugging on

If Android Studio is not installed, stop and say so — that is a ~10 GB download
and the blocker is the toolchain, not the code.

## Acceptance criteria

1. `npm run check` passes.
2. `npm run build` still produces a working web build.
3. `npx cap run android` launches the app on a device or emulator.
4. A release or debug `.apk` exists and installs on a phone from the file.
5. The app shows live CPCB air quality and live NDMA warnings — proving the CORS
   and base-URL fixes work, not just that the shell launched.
6. App icon and splash screen use the brand mark at `docs/brand/mausam-icon.svg`.

## Fill this in before starting

- Deployed Vercel origin: `https://__________.vercel.app`
  (needed as the native API base URL — get it from the Vercel dashboard)

## Useful background, optional

- `CLAUDE.md` — the original project constraints and hard rules
- `docs/PROJECT-REFERENCE.md` — architecture written from the codebase
- `docs/technical-brief.html` — the full technical brief, including which data is
  live and which is seeded

## One honest note for the pitch

A Capacitor build is a **hybrid app** — the web app running in a native shell,
not a native-UI rewrite. That is a legitimate and widely used production
approach, but say so plainly if asked. Claiming it is fully native is the kind of
thing that falls apart on the follow-up question.

# Mausam — Project Reference

**What this document is:** a description of what the code in this repository
actually does, written by reading the code rather than the plan. Where the
original design document (`CLAUDE.md`) describes something that was never built,
this document says so. Where something cannot be determined from the code alone,
it says that too.

**Accurate as of commit `9825a91`** (branch `main`, remote
`github.com/veeviiiii/Mausam`). Anything dated is dated 06 Sep 2026.

**What the project is:** a personalised home screen for Mausam, the India
Meteorological Department's public weather app. Instead of showing everyone the
same page, it reorders a stack of cards around one to three "personas" the user
picks (health-conscious, commuter, farmer, and so on). Built as a hackathon
prototype for Smart India Hackathon 2026, problem statement SIH26076.

---

## 1. Screens and navigation

There are **exactly four navigation destinations**, defined once in
`client/src/components/navItems.tsx` and shared by both navigation bars:

| id | Label (English) | Label (Hindi) |
|---|---|---|
| `home` | Home | होम |
| `alerts` | **Warnings** | चेतावनियाँ |
| `places` | Places | स्थान |
| `you` | You | आप |

Note the second tab is labelled **"Warnings"**, not "Alerts" — `alerts` is the
internal id only (`navItems.tsx`, dictionary key `nav.alerts`).

**Two navigation bars, one source of truth.** Below the Tailwind `lg` breakpoint
(1024px) a bottom tab bar renders (`components/TabBar.tsx`). At `lg` and above
the tab bar is hidden and a vertical side rail takes over
(`components/SideNav.tsx`), which additionally carries the brand mark, the saved
places list, and a freshness line. Both read `NAV_ITEMS`, so they cannot drift
apart.

**There is no router.** No React Router, no URL-based navigation. The active tab
is a single string in React state (`AppState.tsx`, `tab: TabId`), switched by
`setTab`. Consequences: no deep links, no browser back/forward, and a page
reload always returns to Home.

**Two overlay surfaces sit above the tabs**, neither of which is a nav
destination:

- **Detail sheet** (`components/DetailSheet.tsx`) — a full-screen panel opened
  by tapping a persona card or a warning banner.
- **Radar** (`components/RadarMap.tsx`) — a full-screen map opened from a button
  on the Places screen.

### What each screen shows

**Home** (`screens/HomeScreen.tsx`)
Brand header and a horizontal row of the six saved-city chips (mobile only —
both move into the side rail on desktop); then the pinned severe-weather banner
(or a "no active warnings" chip if there is none); an optional offline strip;
the current-conditions hero (city name, large temperature, condition, station,
feels-like, plus humidity / wind / visibility / sunset); a 24-hour scrolling
strip; the persona card stack; a switchable 24-hour bar chart; and, if a chosen
persona was suppressed, a sentence explaining why.

**Warnings** (`screens/AlertsScreen.tsx`)
A heading, a provenance line stating how many CAP alerts were scanned and how
many matched saved places, then every saved city — those with a warning as a
coloured banner, those without as a "no warning" chip. 49 lines; it is the
simplest screen.

**Places** (`screens/PlacesScreen.tsx`)
An interactive map of the saved cities with an "Open full radar" button, then a
grid of city plates showing condition, that city's own time of day, station,
temperature, and warning state. Tapping a plate switches the active city and
jumps to Home.

**You** (`screens/YouScreen.tsx`)
Persona picker (max three); language picker; two display toggles (Arrange cards,
Reduce transparency); and a "Demo controls" section containing a simulated
offline toggle and chip rows that override the sky's weather condition and time
of day. The demo section is labelled on screen as not-shipped UI.

---

## 2. Features actually implemented

### Home

- **Persona-driven card ordering.** One to three personas chosen from eight;
  cards are scored and sorted (`personalization/rules.ts`). Score = a base value
  from the order you picked the persona (100, 90, 80) plus an urgency boost if a
  reading crosses a threshold.
- **"Why this card" disclosure.** Every card expands to a plain-language
  sentence explaining its position — for example *"Health-conscious is persona 1
  of 2, worth 100. In Mumbai right now, AQI is 119, above the 100 watch line —
  that adds +18, for 118."* (`rules.ts`, `explain()`).
- **Manual reordering.** Turning on "Arrange cards" (You screen) replaces the
  chips with up/down buttons; a manual order overrides the score.
- **Suppressed-persona explanation.** The beach card is hidden for inland
  cities; instead of vanishing silently, a sentence says why.
- **Pinned severe-weather banner** above all persona cards regardless of persona
  choice, carrying a **LIVE** or **SEEDED** badge.
- **24-hour strip** with a per-hour colour tint that darkens at night and
  brightens toward local solar noon.
- **Switchable 24-hour bar chart** — Rain / Wind / Humidity / UV
  (`components/HourlyMetricChart.tsx`).
- **Pull-to-refresh** with a custom rain-gauge dial (`components/PullToRefresh.tsx`).
- **Skeleton loading states** on persona/location change.

### Warnings

- Every saved city's warning state in one list, live and seeded mixed but
  individually badged.
- A provenance line: *"Live · 1 of 99 CAP alerts match your places"*, or a
  seeded fallback line if the feed did not answer.

### Places

- **Interactive map** (MapLibre + OpenFreeMap tiles) with city markers. If the
  map style fails to load within 6 s, it falls back to a hand-drawn static plate
  with a graticule and positioned markers — a designed state, not an error
  (`components/LocationMap.tsx`).
- **Full-screen radar** with three switchable layers: Rain (RainViewer raster),
  Wind (OpenWeather raster, needs a key), Air quality (**not** a raster — the
  app draws its own city labels).
- **Zoom-tiered AQI labels.** 36 capitals/metros below zoom 5, +46 large cities
  to 6.4, +74 regional cities above (`data/aqi-cities.ts`, thresholds in
  `design/tokens.ts` `AQI_ZOOM`). The rule is captioned on screen.
- Provider attribution that switches with the active layer.

### You

- Persona picker capped at three.
- **English / हिन्दी** switch, applied instantly and remembered per device.
- **"Other languages"** panel listing ten unbundled Indian languages with sizes
  and a working download-progress state that ends in a plain statement that this
  build ships two languages (`components/LanguagePicker.tsx`).
- **Reduce transparency** — drops `backdrop-filter` across the app for low-end
  GPUs, raising fill opacity to compensate.
- **Demo controls** — simulated offline, and manual overrides of weather
  condition and time of day for reviewing the design system without waiting for
  weather.

### Detail sheet (from a card or a banner)

- Card details: a lede, a table of readings, and a "Where this comes from"
  provenance paragraph.
- Warning details: colour code, alert type, validity, issuing office, district,
  and — for live alerts — the CAP district list and a link to the original
  bulletin on NDMA's site.
- **"What to do"** advice list: up to four rule-derived actions, each showing the
  reading that triggered it *and* a source label saying whether that reading is
  live or seeded (`personalization/advisories.ts`, `data/provenance.ts`).

### App-wide

- **Weather background** — a gradient chosen from a 7 conditions × 4
  times-of-day table, with animated ambient particles per condition (rain,
  storm with lightning, snow, fog, drifting cloud, stars, dust motes)
  (`components/SkyBackground.tsx`, `components/AmbientLayer.tsx`).
- **Measured contrast.** Which glass polarity (light-on-dark or dark-on-light)
  each sky uses is decided by computing WCAG contrast against the real gradient,
  not by eye (`design/tokens.ts`). `npm run check` fails the build if any of the
  28 combinations drops below AA.
- **Full English/Hindi coverage** — 342 keys, both languages checked for parity
  at build time.
- **Performance overlay** at `?perf=1` — fps, worst frame, jank, long tasks.
- **Error boundaries** around the sky and each screen.

---

## 3. Tech stack

Everything below is from `client/package.json` and actual `import` statements.

### Runtime dependencies — all four of them

| Package | Version | Used for |
|---|---|---|
| `react` | ^18.3.1 | UI (23 imports) |
| `react-dom` | ^18.3.1 | Rendering (1 import) |
| `framer-motion` | ^11.11.17 | All animation (19 imports) |
| `maplibre-gl` | ^4.7.1 | Both maps (2 imports) |

### Build / dev dependencies

`typescript` 5.6 (typecheck only — Vite transpiles), `vite` 5.4,
`@vitejs/plugin-react`, `tailwindcss` 3.4, `postcss`, `autoprefixer`,
`tsx` (runs the verification script), and the `@types/*` packages.

### Fonts

Loaded from Google Fonts by `<link>` in `client/index.html`: Google Sans Flex
(UI), Google Sans Code (monospace), Figtree (fallback), Noto Sans Devanagari
(Hindi). Not bundled.

### Backend

**Two Vercel serverless functions and nothing else:**

- `client/api/aqi.ts` (370 lines)
- `client/api/warnings.ts` (333 lines)

Both are plain Node request handlers — `(req, res)` typed with `node:http`,
using the global `fetch`. **They have zero dependencies.** CAP XML is parsed
with regular expressions, not an XML library.

`client/vite-plugin-api.ts` is a ~45-line custom Vite middleware that runs those
same two files during local development via Vite's SSR loader, so one code path
serves both dev and production.

### Deployment

Vercel, deploying from GitHub. Root Directory is set to `client` and the
framework preset to Vite — **in the Vercel dashboard**. There is no
`vercel.json` in the repository.

### Explicit confirmations and denials

| Commonly assumed | Reality |
|---|---|
| Express | ❌ **Not present.** No web framework at all. |
| TanStack Query / React Query | ❌ **Not installed, never imported.** All fetching and caching is hand-written. |
| SQLite | ❌ **Not present.** Caching is in-memory `Map`s. |
| A separate `/server` folder | ❌ **Does not exist.** The two API routes live under `client/api/`. |
| A PWA (manifest + service worker) | ❌ **Neither exists.** No `manifest.json`, no service worker, no `vite-plugin-pwa`. The app is not installable and has no true offline capability. |
| React Router | ❌ Not present; navigation is React state. |
| A test suite (Jest/Vitest/Playwright) | ❌ None. The only automated check is `scripts/verify-tokens.ts`. |
| React, Vite, TypeScript, Tailwind, Framer Motion, MapLibre, Vercel | ✅ All real and in use. |

---

## 4. Data flow — where every displayed value comes from

Two feeds are live. **Everything else on every screen is seeded**, meaning it is
a hand-written constant in `client/src/data/seed.ts` chosen to be realistic for
early September in that city. Seeded values are not random and not fetched; they
are the same on every load.

### The two live feeds

**Air quality — CPCB via data.gov.in**
Browser → `/api/aqi?city=<CPCB city name>` → `client/api/aqi.ts` → data.gov.in.
The government API publishes one row per pollutant per station — concentrations,
not an index. The server computes CPCB's own per-pollutant sub-indices and takes
the maximum, which is the definition of the Indian AQI, then returns the worst
station's figure along with that station's name, the governing pollutant, its
concentrations, and CPCB's publish timestamp. The API key (`DATA_GOV_KEY`) is
server-side only and is verifiably absent from the built bundle.

*Carbon monoxide is deliberately excluded* — the dataset publishes CO with no
declared unit and with values inconsistent with CPCB's mg/m³ breakpoints
(`api/aqi.ts`, comment at the `BREAKPOINTS` table).

**Severe warnings — NDMA Sachet CAP feed**
Browser → `/api/warnings` → `client/api/warnings.ts` → `sachet.ndma.gov.in`.
NDMA republishes the bulletins IMD, the state SDMAs and CWC actually issue, as
public CAP 1.2 XML with no key. The route scans ~99 alerts, fetches each one's
full XML under a 7-second budget, drops anything expired or cancelled, matches
district names to saved cities, and keeps the most severe match per city.

**IMD's own APIs are not called anywhere.** They require the calling server's IP
to be whitelisted. Verified 401 from an unwhitelisted host.

### Home screen

| Displayed | Produced by | Live or seeded |
|---|---|---|
| "Mausam" / "IMD" wordmark | `BrandHeader.tsx` | Static text |
| "4 min ago" freshness | `AppState.tsx:90` — hardcoded `dataAgeMinutes: 4` | **Fake.** Not a real data age |
| City chips (6) | `seed.ts` `BASE_PLACES` | Seeded |
| Warning banner | `api/warnings.ts` if matched, else `seed.ts` | **Live or seeded** — badged on the banner |
| Offline strip | Only appears when the You-screen demo toggle is on | Simulation |
| City name, station | `seed.ts` | Seeded |
| Temperature, feels-like, condition | `seed.ts` | Seeded |
| Humidity, wind, visibility | `seed.ts` | Seeded |
| Sunset time | `seed.ts` | Seeded |
| Sky gradient + ambient animation | `design/tokens.ts` + `AmbientLayer.tsx` | Derived from the seeded condition and the **real** clock |
| Hourly strip **labels** (`NOW`, `23:00`, …) | `lib/time.ts` `nowMinutesInZone` | **Real local time**, ticking every minute |
| Hourly strip **values** (temp, icon, rain %) | `seed.ts` `buildHourly()` | **Synthetic** — a diurnal curve over seeded values, with a per-city deterministic jitter |
| Hourly bar chart | Same `buildHourly()` output | Synthetic |
| Persona card order | `personalization/rules.ts` | Computed from whichever values above are current |

**Important subtlety on time of day:** the *clock* is real (converted to the
city's IANA zone via `Intl`), but the *sunrise and sunset* it is compared
against are seeded strings. So "night" is a real determination made against a
fixed sunrise time (`lib/time.ts` `timeOfDayFor`).

### Persona cards

| Card | Values shown | Live or seeded |
|---|---|---|
| **Air & allergens** | AQI + band | **Live** (CPCB) when the station answers |
| | Governing pollutant + concentration | **Live** |
| | Station name + publish time | **Live** |
| | Pollen, humidity | Seeded |
| **Best run window** | Run window, peak UV, wind, feels-like | Seeded |
| | Temperature bars | Synthetic (`buildHourly`) |
| **Sea & tide** | Wave height, tides, sea temp, moon phase | **Seeded — no marine API exists in this project at all** |
| **Saved destinations** | Other cities' names + temps | Seeded |
| | Their warning states | Live or seeded per city |
| | Airport visibility, crosswind | Seeded |
| **School run** | 07:30 / 14:45 rain probabilities | Seeded constants (`schoolDropRain`, `schoolPickupRain`) |
| **Field conditions** | 24 h rainfall, soil moisture, Agromet advisory | Seeded |
| **Commute watch** | Visibility, gusts, waterlogging risk, urban advisory | Seeded |
| **Comfort index** | Comfort score, 10-day rain probability, tourism outlook | Seeded |

All seven non-air cards carry a source label ending in **"· seeded"**. The air
card's label switches between `CPCB · LIVE`, `CPCB · SEEDED` and
`CPCB · NO STATION` depending on what actually happened.

### Warnings screen

Provenance counts come from `/api/warnings`. Banners are live where a CAP alert
matched, seeded otherwise, each badged individually.

### Places screen

| Displayed | Source | Live or seeded |
|---|---|---|
| Basemap tiles | OpenFreeMap (`tiles.openfreemap.org`) | **Live**, keyless |
| City marker positions | `seed.ts` lat/lon | Seeded coordinates |
| City plates: condition, temp, station | `seed.ts` | Seeded |
| Plate time-of-day | Real clock vs seeded sunrise | Mixed |
| Warning badges | Live or seeded per city |

### Radar

| Layer | Source | Live or seeded |
|---|---|---|
| Rain | RainViewer, keyless | **Live** |
| Wind | OpenWeather `wind_new` tiles, needs `VITE_OWM_KEY` | **Live** with a key; the chip disables itself and says why without one |
| Air quality labels | Open-Meteo `us_aqi`, keyless | **Live** |
| City names/coordinates for labels | `data/aqi-cities.ts` — 156 hand-entered cities | Static reference data |

The radar's air-quality figures are **US AQI**, a different scale from the CPCB
figures on the cards. This is deliberate and labelled on screen; the two use
different breakpoints and are not interchangeable.

### You screen

Personas list, toggles, language and demo overrides are all local React state or
`localStorage`. Nothing is fetched. Language choice persists under the
`localStorage` key `mausam.lang`.

### A note about OpenWeather

OpenWeather is used for **exactly one thing**: the radar's wind raster tiles.
There is no current-conditions call anywhere in the codebase. Any visibility,
temperature or humidity figure in this app is seeded, not OpenWeather data.

---

## 5. Architecture as implemented

### Folder structure

```
/CLAUDE.md                  original design brief (partly superseded)
/design/mausam-home.html    frozen design study; verify-tokens diffs against it
/docs/                      this file and six others
/client/
  index.html
  vite.config.ts            also copies non-VITE_ env vars into process.env
  vite-plugin-api.ts        runs api/*.ts during local dev
  api/
    aqi.ts                  CPCB proxy + Indian AQI computation
    warnings.ts             NDMA CAP fetch, parse, match
  scripts/
    verify-tokens.ts        the build-time check (see below)
  src/
    App.tsx                 layout, tab switching, sheet lifecycle
    main.tsx                LanguageProvider > AppProvider > App
    state/AppState.tsx      all app state; merges live data into places
    data/                   seed.ts, types.ts, provenance.ts, aqi-cities.ts
    design/tokens.ts        783 lines: colours, contrast maths, springs, config
    personalization/        rules.ts (card scoring), advisories.ts (advice)
    features/cards/         PersonaCard, registry (all 8 card bodies), viz
    components/             18 components
    screens/                the four screens
    lib/                    time, hooks, the two live-data hooks, Open-Meteo
    i18n/                   dictionary (862 lines), provider, context, capText
    index.css               glass surfaces, all reading CSS custom properties
```

There is **no `/server` folder** and no `public/` folder.

### How the app is wired

`main.tsx` nests `LanguageProvider` → `AppProvider` → `App`. `AppState.tsx` is
the single state container: it holds persona choices, the active city, UI
toggles, and it is where the two live feeds are merged **into the place objects
themselves**. That merge is the key architectural decision — because
`place.alert` and `place.aqi` are replaced in one place, the banner, the
Warnings tab, the side-rail dots, the advisories and the card scoring all pick up
live data with no further wiring and without knowing where it came from.

The i18n context and hooks live in `i18n/context.ts`, separate from
`i18n/LanguageProvider.tsx`, because React Fast Refresh can only hot-swap a
module that exports components and nothing else.

### Caching, as it actually works

There is no cache library. Five layers, all hand-written:

| Layer | File | Behaviour |
|---|---|---|
| CPCB, server-side | `api/aqi.ts:190` | In-memory `Map`. 20 min on success, **2 min on failure** |
| CPCB, HTTP header | `api/aqi.ts:363` | `max-age=900` on success, **`no-store` on failure** |
| CPCB, client-side | `lib/useLiveAqi.ts:36` | Module `Map`. 10 min on success, **45 s on failure** |
| CAP warnings, server-side | `api/warnings.ts:27` | In-memory `Map`. 5 min on success, 1 min on failure |
| Open-Meteo radar AQI | `lib/openMeteoAqi.ts:26` | Module `Map`, 30 min |

Successes and failures are cached separately at every layer. This is not
symmetry for its own sake: a single shared TTL meant one transient upstream
stall pinned a card to seeded data long after the source recovered.

**These caches are per-process.** On Vercel that means per warm container, not
shared across instances. It works at prototype scale but it is not a cache tier.

### Build-time verification

`npm run check` runs `tsc --noEmit` then `scripts/verify-tokens.ts`, which fails
the build on any of:

1. Colour/spring drift between `design/tokens.ts` and `design/mausam-home.html`
2. Any of the 28 sky combinations dropping below WCAG AA on glass or bare text
3. Any of 700 hourly-tint samples dropping below AA
4. English and Hindi dictionaries disagreeing on keys
5. A literal `t("some.key")` in source with no matching dictionary entry
6. The dictionary's English copy of a CAP warning drifting from `seed.ts`
7. **Any relative import inside `api/`** — because Vercel emits those files as
   ESM and an extensionless relative import fails at runtime

Current output: 28 skies, 2 glass tiers, 4 springs, 700 tint samples,
342 × 2 language keys, 179 literal keys, 10 CAP strings, 2 API routes.

---

## 6. Known issues and unresolved items

### Confirmed limitations

1. **Forecast data is not real.** Temperatures, humidity, wind, visibility,
   rain probability, tides, soil moisture and comfort scores are seeded
   constants. Only air quality and severe warnings are live. This is a
   dependency on IMD whitelisting a static IP, which requires a fixed-IP host
   (Vercel is serverless with rotating IPs and cannot satisfy it).

2. **Pull-to-refresh does not refresh warnings.** It calls `invalidateLiveAqi()`
   (`AppState.tsx:166`) but there is no equivalent for warnings —
   `lib/useLiveWarnings.ts` has a module-level `cached` variable with no
   invalidation path. Warnings refresh only on a full page reload, or when the
   server's 5-minute cache expires and a new session fetches.

3. **"4 min ago" is hardcoded.** `dataAgeMinutes: 4` in `AppState.tsx:90`. It is
   not derived from any fetch timestamp. The simulated-offline toggle sets it to
   134 to demonstrate the stale state.

4. **The offline toggle is a simulation.** It changes UI state only; it does not
   disable the network, and the app has no service worker, so genuine offline
   behaviour is untested and largely absent.

5. **No PWA.** Despite the brief calling for an installable PWA, there is no
   manifest and no service worker.

6. **Warning coverage depends on the weather.** The app only shows live warnings
   for the six hardcoded cities, and only when NDMA has an active matching
   alert. On a calm day every banner reads SEEDED. Observed live: 1 of 99 alerts
   matched, then 0 an hour later when it expired.

7. **data.gov.in is intermittently unreliable.** Repeatedly observed answering
   in 0.5 s, then timing out for minutes, then recovering. Mitigated with a 5 s
   deadline plus one 4 s retry, but a demo can still land on a seeded reading.

8. **Advice for coastal cities lost a rule.** The swim advisory was removed
   because `waveHeight` is a seeded constant with no marine API behind it
   (`advisories.ts`, comment at "The swim advisory is deliberately absent").
   Coastal cities therefore have one fewer safety line than before.

9. **The humidity radar layer does not exist.** Cut deliberately — no stable
   free global humidity raster source was found (`design/tokens.ts` §9).

10. **Wind particle animation** (the Windy-style streaks) was never attempted;
    the wind layer is a static raster.

### Things labelled in the UI rather than fixed

- Urban waterlogging advice names specific road junctions. This is synthetic
  seed prose — IMD nowcasts are district-scale and no urban dataset is wired.
  It is labelled *"illustrative example, no urban nowcast source"*.
- The 1–3 km visibility rule is explicitly described on screen as the app's own
  driving caution, not an IMD fog warning, because IMD's fog bands top out at
  1 km.
- Persona detail sheets keep their "Where this comes from" paragraphs in English
  in both languages, and say so on screen.

### Code-level notes

- Two `eslint-disable-next-line react-hooks/exhaustive-deps` comments, both in
  map components (`LocationMap.tsx:207`, `RadarMap.tsx:254`), both deliberate —
  the maps are rebuilt only when the place list changes, not on every state
  change.
- **No `TODO`, `FIXME`, `HACK` or `@ts-ignore` comments exist anywhere in the
  source.** Limitations are documented in prose comments instead.

---

## 7. What could not be determined from the code

- **Whether the deployed Vercel project has both environment variables set.**
  `VITE_OWM_KEY` and `DATA_GOV_KEY` are in the local, gitignored
  `client/.env.local`. Vercel configuration is not in the repository, so
  production behaviour of the wind layer and the AQI route cannot be confirmed
  from source alone.
- **Whether the seeded values were checked against real observations** for the
  date they claim to represent. They are described in `seed.ts` as "realistic
  for the date and station, but NOT live readings" — their accuracy is not
  verifiable from the repository.
- **Real-device performance.** `components/PerfOverlay.tsx` exists to measure
  frames on the device that is struggling, but no captured measurements are
  committed. The claims about low-end Android smoothness in `CLAUDE.md` are
  unverified here.
- **Whether the district keyword lists in `api/warnings.ts` cover every district
  that could sensibly map to each saved city.** They were hand-written and are
  known to be incomplete by design, not exhaustive.
- **How Vercel's build treats `client/api/`** beyond the fact that it produced an
  ESM module-resolution failure once and has worked since the routes were made
  self-contained. The build configuration is dashboard-side and not inspectable
  from the repo.

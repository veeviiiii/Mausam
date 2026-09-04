# CLAUDE.md — IMD Mausam Personalized Homepage (SIH26076)

## Project Overview
Personalized homepage for IMD's official weather app, Mausam, built for Smart
India Hackathon 2026, problem statement **SIH26076** (Ministry of Earth
Sciences). Today Mausam shows every user the same generic homepage. This
project reflows the homepage around one of eight defined user personas, using
IMD's real public data, and must be dramatically lighter/faster than the
current app — the app's own store reviews complain about slow loads and a
broken favorites feature. That's the bar to beat, not just a nice-to-have.

**Deadline: 30 September 2026.** Deliverable is a working, demoable
prototype — not a production system — but "working" includes a seeded
fallback dataset so a demo never breaks if IMD's live API has a bad moment.

## The 8 Personas
Each drives which cards appear on the homepage and what data they show:
- **Health-conscious** — AQI, pollen count, UV index, humidity
- **Outdoor fitness** — sunrise/sunset, best running hours, wind speed, heat alerts
- **Beachgoers & surfers** — sea conditions, tide timings, wave height, water temperature
- **Travelers** — saved destinations, flight-relevant severe alerts, packing suggestions
- **Parents & families** — school-commute conditions, rain/severe weather alerts
- **Farmers & gardeners** — soil moisture, rainfall prediction, frost alerts, planting guidance
- **Commuters** — weather + traffic, visibility, fog/storm alerts
- **Event planners** — extended forecast, rain probability, a "comfort index"

Users pick 1–3 personas at first launch (skippable, sensible default from
season/location), editable anytime after.

## Functional Requirements
- Homepage = stack of independent, reorderable cards, one per active
  persona's relevant data
- Multi-location support (current location + saved favorites)
- Severe weather alerts always surface at the top, regardless of active persona
- Offline: show last-known data with a clear "updated X ago" timestamp —
  never a blank or broken state

## UI/UX Bar — Hard Requirement, Not Optional
- Premium feel: smooth transitions between states, never instant/jarring swaps
- Physics-based motion for cards animating in/out and reordering (not linear fades)
- Custom pull-to-refresh animation
- Animated weather icons (rain falling, clouds drifting, sun pulsing) — no static glyphs
- Homepage card → detail view uses a shared-element/expand transition
- Skeleton loading states everywhere data is fetched — never spinner-only, never blank
- Every interactive element (buttons, toggles, drag-to-reorder handles, filter
  chips) must be fully wired to real state. Nothing decorative or half-built.
  **If a feature can't be finished in time, cut it entirely rather than
  shipping something that doesn't do anything.**
- Mobile-first; must stay smooth on mid/low-end Android hardware and patchy
  network — this is exactly where the real app fails today

## Visual Design System

**Typography**
- Primary font: **Google Sans Flex** — Google's variable font family,
  released under the OFL license via Google Fonts (free for commercial
  use, no special license needed). Load it as a variable font so weight
  can flex between headline and body use without shipping multiple static
  files.
- **Do not** use classic "Google Sans" (Product Sans) — it's proprietary,
  restricted to Google's own products, and the unofficial CSS tricks
  floating around to load it are outside its license and can break at any
  time. Google Sans Flex is the legitimate, near-identical stand-in.
- Skymet's exact in-app typeface isn't publicly documented anywhere, and
  pulling a font file out of their APK/IPA to match it would be a
  copyright problem, not a design shortcut — don't do that. Google Sans
  Flex already covers the clean, geometric feel being aimed for; treat any
  further tuning as its own design decision rather than a Skymet-matching
  exercise.
- Fallback stack: `"Google Sans Flex", -apple-system, Roboto, system-ui,
  sans-serif` — so text renders instantly in a system font while the
  variable font loads, instead of a blank/invisible-text flash (consistent
  with the "no jarring state changes" rule above).

**Background: weather + time-of-day**
- Background gradient is a function of two inputs: **condition** (clear /
  partly cloudy / overcast / rain / thunderstorm / fog / snow) ×
  **time-of-day** (dawn / day / dusk / night). Define this as a lookup
  table of gradient tokens in one place — a single source of truth the
  personalization layer and the UI both read from — not inline gradients
  scattered through components.
- Background transitions (location switch, time crossing a dawn/dusk
  boundary) must animate, not cut instantly — same motion standard as the
  rest of the UI.
- Time-of-day should derive from the location's actual local sunrise/
  sunset (already available from IMD's sunrise/sunset endpoint), not the
  device clock — a user checking a saved destination should see that
  destination's day/night state, not their own.

**Glassmorphism**
- Cards sit on frosted-glass surfaces over the weather background:
  translucent fill, `backdrop-filter: blur(...)`, a subtle 1px border,
  soft shadow — blur/opacity/radius values defined once as shared design
  tokens, not per-component.
- **Contrast is non-negotiable**: this is a severe-weather-alert app, so
  text and icons must stay legible against every condition × time-of-day
  background, including the brightest and darkest combinations. Check
  contrast against the real background gradients, not a neutral test
  background.
- `backdrop-filter: blur()` is expensive on low/mid-end Android GPUs and
  directly competes with the "smooth on low-end hardware" rule above —
  profile it on real low-end devices, and if frame rate suffers, fall back
  to a solid semi-transparent surface (opacity + gradient, no blur) rather
  than dropping the visual language altogether.

## Architecture
Client is a PWA that makes **one aggregated request per screen load**, not
scattered calls. A backend service sits between client and IMD's data:
1. Fetches and normalizes data from IMD's public APIs and CPCB's AQI API
2. Caches each data type with a TTL matched to how often IMD actually
   updates it (current conditions hourly, forecasts every few hours,
   warnings on-issue)
3. Applies a **transparent, rule-based personalization step** — persona(s) +
   location + time of day/season decide which cards appear and in what order

The backend must run on a host with a **static IP** — IMD's API access
requires IP whitelisting for the calling server. The client can never call
IMD directly.

## Tech Stack
- **Client**: React + Vite + TypeScript + Tailwind, built as an installable PWA
- **Fonts**: Google Sans Flex (variable, loaded via Google Fonts, OFL-licensed) — see Visual Design System below
- **Animation**: Framer Motion (all motion design described above lives here)
- **Data fetching/caching/offline**: TanStack Query
- **Backend**: Node/Express, deployed on a fixed-IP host
- **Backend cache**: lightweight local cache — SQLite is enough at this scale

## Data Sources (confirmed working)
- IMD public APIs at `api.imd.gov.in` — current weather, 7-day city
  forecast, district nowcast, district/cyclone warnings, sunrise/sunset
  times, subdivision rainfall forecast
- CPCB real-time AQI via `data.gov.in` (separate registration, **no** IP
  whitelisting needed — get this running first, it's the fast path)
- Severe warnings via IMD's CAP (Common Alerting Protocol) XML feed —
  cleaner to parse than scraping warning pages

## Suggested Folder Structure
```
/client                    # React + Vite + TS PWA
  /src
    /components
    /features              # per-persona cards, alerts, location switcher
    /animations             # Framer Motion variants (cards, icons, transitions)
    /hooks
    /lib                    # TanStack Query setup, API client
    /state                  # persona selection, saved locations
  /public

/server                     # Node/Express backend
  /src
    /routes
    /services
      imd-client.ts         # IMD API wrapper
      cpcb-client.ts        # CPCB AQI wrapper
      cap-parser.ts         # CAP XML warning feed parser
    /cache                  # TTL cache layer (SQLite)
    /personalization        # rule-based scoring engine
  /data
    seed-fallback.json       # seeded dataset for demo-safe offline fallback
```

## Commands
```bash
# client  (cd client)
npm run dev            # vite dev server on :5173
npm run build          # tsc --noEmit && vite build
npm run preview        # serve the production build on :4173
npm run typecheck      # tsc --noEmit
npm run verify:tokens  # diff tokens.ts against design/mausam-home.html + audit contrast
npm run check          # typecheck + verify:tokens

# server  (not scaffolded yet)
npm run dev            # tsx/nodemon watch mode
npm run build
npm start
```

## Hard Rules
- **Never** call IMD or CPCB APIs directly from the client — always through
  the backend (IP whitelisting requirement).
- **Never** hardcode API keys or secrets — env vars only, never committed.
- Personalization logic must stay a **rule-based scoring system**, not an
  opaque model — a judge can ask "why is this card here" and get a plain-
  language answer.
- Cache TTLs must match IMD's real update cadence per data type (see
  Architecture) — don't just pick one TTL for everything.
- Every screen must have a defined offline/stale-data behavior before it's
  considered done — last-known data + "updated X ago", never a blank state.
- The seeded fallback dataset (`/server/data/seed-fallback.json`) is not
  optional polish — treat it as a P0 requirement, since a live-demo failure
  against IMD's real API is the single biggest risk to this project.
- Every glass-card-over-background combination must pass a contrast check
  before it ships — don't rely on eyeballing one or two examples.

## Non-Goals (don't build these)
- No production-grade auth, multi-tenancy, or scaling concerns — this is a
  hackathon prototype
- No personas beyond the 8 defined above — resist scope creep here
- No ML-based/opaque personalization — explainability is a hard constraint,
  not a stretch goal

## Pre-Demo Checklist
- [ ] Fallback seed data renders correctly with IMD API disconnected
- [ ] Severe alerts appear above persona cards regardless of active persona
- [ ] Card reorder/enter/exit animations tested on a throttled connection +
      low/mid-end Android profile
- [ ] Every visible interactive element (button/toggle/chip/drag-handle) is
      wired to real state — no dead UI
- [ ] Personalization decision for a given card can be explained in one
      sentence (persona + location + time-of-day rule)
- [ ] Text/icon contrast checked against the brightest and darkest
      condition × time-of-day background combinations
- [ ] Glassmorphism blur performance verified on a low-end Android device —
      fallback (no-blur, solid translucent) ready if it drops frames

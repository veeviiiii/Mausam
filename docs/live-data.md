# Live data — what is real, what is seeded, and where the keys live

Status as of 05 Sep 2026. Every claim here was verified by calling the endpoint,
not by reading its documentation.

## The four feeds that are live

| Feed | Source | Key | Reaches the client via | Verified |
|---|---|---|---|---|
| **Severe warnings** | NDMA Sachet CAP | none | `/api/warnings` | 99 CAP alerts scanned in 3.7 s; live red Heavy Rain from `IMD-New-Delhi` |
| **Air quality (India)** | CPCB via data.gov.in | `DATA_GOV_KEY` (server only) | `/api/aqi` | Mumbai `119` Moderate (NO2, 24 stations); Delhi `218` Poor (PM2.5, 42 stations) |
| **Air quality (map)** | Open-Meteo | none | direct fetch | 70-point batch `200`, CORS `*` |
| **Radar rain / wind** | RainViewer / OpenWeather | `VITE_OWM_KEY` (wind only) | direct tiles | both `200` |

Everything else — forecasts, tides, agromet, aviation — is still the seeded
dataset in `client/src/data/seed.ts`. That is a deliberate floor, not a gap
waiting to be filled in a panic: see "Seed is the floor" below.

## Severe warnings: real, without waiting for IMD

The headline feature runs on real bulletins. IMD's own APIs need the calling
server's IP whitelisted, which is a procurement timeline — but **NDMA
republishes the same IMD, SDMA and CWC bulletins** as public CAP 1.2 XML with no
key and no whitelisting.

```bash
curl -s "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml" | head -40
```

Each alert carries `event`, `severity`, `urgency`, `certainty`,
`effective`/`expires`, `areaDesc`, `instruction` and `sender` — everything
`AlertBanner`, the advisory rules and the detail sheet already consume. CAP
`severity` (Extreme/Severe/Moderate/Minor) maps onto IMD's own red/orange/
yellow/green colour code.

### Three things the first run got wrong

Each found by running it against the live feed, not by reasoning:

1. **Substring matching put a Tamil Nadu thunderstorm on the Indore card.**
   "Dhar" (MP) matched inside "Dharmapuri" (TN). Matching is now word-boundary
   and Unicode-aware.
2. **An expired Chennai bulletin was displayed.** Sachet keeps recently lapsed
   entries in the feed. Anything past its `expires`, or with `status != Actual`
   or `msgType = Cancel`, is now dropped. An expired warning on screen is worse
   than no warning — it is wrong in the direction that teaches people to ignore
   the banner.
3. **A red Heavy Rain warning produced no umbrella advice.** The advisories only
   read the seeded rain probability, which for Delhi was low, so the list
   recommended sunscreen. The warning now gets a vote, and warning-driven advice
   is ranked directly below life-safety — ordering matters because `MAX_ITEMS`
   is a real cap and comfort items were surviving it while the actual hazard
   was not.

### Nothing is passed off as ours

- Every alert keeps its `sender` verbatim: the Delhi banner reads
  **IMD New Delhi**, not "Mausam".
- Each warning carries a **LIVE** or **SEEDED** badge on the banner itself, so
  "which of these are real?" is answered without opening anything.
- The Warnings tab states the count: *"Live · 1 of 99 CAP alerts match your
  places"*.
- The detail sheet links to the original bulletin on Sachet, so the claim on
  screen is checkable.
- **Live bulletins are never machine-translated.** The dictionary holds Hindi
  for the *seeded* warning of the same city, and swapping that in for a
  different real alert would put words in IMD's mouth. `capText` skips
  translation whenever `alert.live` is set: untranslated and true beats
  translated and wrong.

### Matching and budget

District keywords per saved place live in `api/warnings.ts`, matched against
CAP's `areaDesc` (a real district list), with the headline as a fallback for
anything whose detail did not arrive. Enrichment runs a 12-way worker pool
under a 7 s wall-clock budget, well inside a serverless execution limit; the
result is cached 5 minutes, because CAP arrives on issue rather than on a
schedule. Failures cache for 1 minute.

## CPCB: the fast path, and why it needs a server

CLAUDE.md forbids the client calling CPCB directly, and the key must not reach
the bundle. Both are enforced mechanically:

- The key is `DATA_GOV_KEY` with **no `VITE_` prefix**, so Vite cannot inline
  it. Verified: `grep` for the key across `dist/` finds nothing.
- The only caller is `client/api/aqi.ts`, deployed as a Vercel function
  (`client/api/` is picked up automatically with Root Directory = `client`) and
  served in `vite dev` by `vite-plugin-api.ts` — the **same file**, loaded
  through Vite's SSR loader. One code path, so a route that works locally is the
  route that ships.

### The route is one file, deliberately

The AQI computation started in a sibling `api/_cpcb.ts`. That worked under
`vite dev` (bundler resolution) and died on Vercel's first request:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/client/api/_cpcb'
  imported from /var/task/client/api/aqi.js
```

`client/package.json` declares `"type": "module"`, so the emitted `aqi.js` is
ESM — and ESM will not resolve an extensionless relative import. Adding `.js`
fixes resolution but still depends on the builder tracing and uploading the
sibling, which is a second thing to be wrong about. A function with exactly one
consumer does not need a module boundary, so it no longer has one.

`npm run check` now fails on **any** relative import inside `api/`, and that
guard was tested by reintroducing the bug.

### The API does not publish an AQI

`data.gov.in` resource `3b01bcb8-…` publishes **one row per pollutant per
station** — concentrations, not an index:

```
{ city: "Mumbai", station: "Sion, Mumbai - MPCB", pollutant_id: "NO2",
  avg_value: "10", last_update: "04-09-2026 22:00:00" }
```

India's AQI is defined by CPCB as the **maximum of the per-pollutant
sub-indices**, each computed by linear interpolation inside published
breakpoints. `api/aqi.ts` does that computation, so the number on screen can
be explained down to the pollutant that produced it — which is why the health
detail sheet shows the station, the governing pollutant, the station count and
CPCB's own last-update stamp.

**CO is deliberately excluded.** CPCB's CO breakpoints are defined in mg/m³, but
this resource publishes CO with no declared unit and with values in the tens at
rural background stations — which under mg/m³ breakpoints would read "severe" at
a forest rest house. Guessing a divisor risks publishing a wrong band, so CO is
left out and the response names the pollutant the index actually came from.
PM2.5 and PM10 govern the index at essentially every urban station anyway.

### How it reaches the UI

The live figure is **merged into the place** in `state/AppState.tsx`, not
displayed beside it. That one decision means the scoring rules, the advisories
and the cards all read the real number with no further wiring. Confirmed live:

> `CPCB · LIVE` — `119 AQI · Moderate` — *"Health-conscious is persona 1 of 2,
> worth 100. In Mumbai right now, AQI is 119, above the 100 watch line — that
> adds +18, for 118."*

That sentence is the personalization engine explaining itself on live
regulatory data.

### Cache TTLs, matched to the source

Per CLAUDE.md, no single TTL for everything:

| Layer | TTL | Why |
|---|---|---|
| `api/aqi.ts` in-memory, success | 60 min | CPCB publishes hourly |
| `api/aqi.ts` in-memory, failure | 2 min | see below |
| `/api/aqi` response header | `max-age=900, stale-while-revalidate=3600` | an edge miss never blocks a render |
| `lib/openMeteoAqi.ts` | 30 min | AQI is an hourly product; re-asking inside it is wasted bytes |
| `lib/useLiveAqi.ts` | session | switching places twice is one fetch |

### Failures are cached separately, and the upstream has a deadline

Both found by an outage during testing rather than by reasoning: data.gov.in
started returning `504`, and sometimes simply not answering.

- **A failure cached for 60 minutes** would mean one transient blip pins every
  city to the seeded value for the rest of a demo. Failures now expire after
  **2 minutes** — long enough to stop a retry loop, short enough to recover on
  its own.
- **No upstream deadline** meant the route inherited the platform's: a 40-second
  hang, burning the function's execution budget while a perfectly good seeded
  number was already on screen. The upstream fetch now aborts at **6 s** and
  says so (`"data.gov.in did not answer within 6000ms"`).

Verified against the live outage: the route answers in 6.0 s instead of 40 s,
and the UI shows `CPCB · SEEDED` with `61 AQI · Satisfactory` — the correct
degraded state, no blank card, and an `info`-level console line naming the
upstream status rather than an error.

## Seed is the floor, never the fallback-of-last-resort

`useLiveAqi` only ever **upgrades** the seeded value. It never blanks a card
while waiting, never swaps a good number for a spinner, and a failure is a `200`
with `ok: false` rather than a `500` — a degraded reading must not become a
broken screen. The health card's own label says which it is holding
(`CPCB · live` vs `CPCB · seeded`), so nobody has to guess during a demo.

## Keys

Real values live in `client/.env.local`, which is gitignored
(`.gitignore:4`, confirmed with `git check-ignore`). `client/.env.example` is
committed as the template.

```
VITE_OWM_KEY=…      # public by design — it ships inside the tile URL
DATA_GOV_KEY=…      # server only — no VITE_ prefix, never in the bundle
```

On Vercel, add **both** under Project → Settings → Environment Variables.
`DATA_GOV_KEY` without the prefix is what makes `/api/aqi` work in production.

## Still needed from IMD

Only the **forecast numbers** now — the 7-day city forecast, district nowcast,
subdivision rainfall and sunrise/sunset endpoints. Those require **IP
whitelisting for the calling server**, which means:

- a host with a **static IP** (a small VPS — Railway, Render, Hetzner,
  DigitalOcean). Vercel is serverless with rotating IPs and cannot satisfy this.
- IMD approval for that IP.

That is no longer the critical path. Warnings — the feature this project exists
for — are live through NDMA, and air quality is live through CPCB. What stays
seeded is temperatures, tides, agromet and aviation: the numbers that make a
demo look complete rather than the ones that make it matter.

The architecture already assumes the split — the client never talks to a
weather provider directly — so switching those on is a deployment task and one
more route, not a rewrite.

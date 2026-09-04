# Live data — what is real, what is seeded, and where the keys live

Status as of 05 Sep 2026. Every claim here was verified by calling the endpoint,
not by reading its documentation.

## The three feeds that are live

| Feed | Source | Key | Reaches the client via | Verified |
|---|---|---|---|---|
| **Air quality (India)** | CPCB via data.gov.in | `DATA_GOV_KEY` (server only) | `/api/aqi` | Mumbai `119` Moderate (NO2, 24 stations); Delhi `218` Poor (PM2.5, 42 stations) |
| **Air quality (map)** | Open-Meteo | none | direct fetch | 70-point batch `200`, CORS `*` |
| **Radar rain / wind** | RainViewer / OpenWeather | `VITE_OWM_KEY` (wind only) | direct tiles | both `200` |

Everything else — forecasts, warnings, tides, agromet, aviation — is still the
seeded dataset in `client/src/data/seed.ts`. That is a deliberate floor, not a
gap waiting to be filled in a panic: see "Seed is the floor" below.

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

### The API does not publish an AQI

`data.gov.in` resource `3b01bcb8-…` publishes **one row per pollutant per
station** — concentrations, not an index:

```
{ city: "Mumbai", station: "Sion, Mumbai - MPCB", pollutant_id: "NO2",
  avg_value: "10", last_update: "04-09-2026 22:00:00" }
```

India's AQI is defined by CPCB as the **maximum of the per-pollutant
sub-indices**, each computed by linear interpolation inside published
breakpoints. `api/_cpcb.ts` does that computation, so the number on screen can
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
| `api/_cpcb.ts` in-memory | 60 min | CPCB publishes hourly |
| `/api/aqi` response header | `max-age=900, stale-while-revalidate=3600` | an edge miss never blocks a render |
| `lib/openMeteoAqi.ts` | 30 min | AQI is an hourly product; re-asking inside it is wasted bytes |
| `lib/useLiveAqi.ts` | session | switching places twice is one fetch |

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

## Still needed from IMD — the long pole

Nothing here unblocks IMD's own APIs. Those require **IP whitelisting for the
calling server**, which means:

- a host with a **static IP** (a small VPS — Railway, Render, Hetzner,
  DigitalOcean). Vercel is serverless with rotating IPs and cannot satisfy this.
- IMD approval for that IP.

Until then, forecasts and CAP warnings stay seeded. The architecture already
assumes the split — the client never talks to a weather provider directly — so
this is a deployment task, not a rewrite.

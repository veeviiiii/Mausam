# Full-screen radar — layer sources and decisions

Provider terms verified by probing each endpoint before building against it,
not taken from documentation alone. Re-checked 05 Sep 2026.

## What shipped

| Layer | Provider | Key needed | Verified | Form |
|---|---|---|---|---|
| **Precipitation** | RainViewer | None | API `200`, 13 radar frames, tile `200` (10 KB PNG) | Raster |
| **Wind** | OpenWeather `wind_new` | `VITE_OWM_KEY` | Tile `200` (98 KB PNG) with the key; `401` without | Raster |
| **Air quality** | Open-Meteo | None | `200` for a 70-point batch; CORS `*` | **Labels, not raster** |
| **Humidity** | — | — | — | **Cut. See below.** |

## Why air quality is not a raster

It was, briefly — WAQI's `usepa-aqi` tiles. Two problems, in order of weight:

1. **A raster is somebody else's design.** WAQI draws every monitoring station
   as a chunky badge. At country zoom that is a wall of overlapping pills with
   no way to restyle it, thin it out, or make it match the basemap's own place
   labels. Turning the opacity down made it a coloured smear; leaving it up made
   it unreadable.
2. **The demo token is half-working.** It serves tiles, but its JSON API
   returns `status: "error"`, so anything beyond the raster needed a real token
   anyway.

Open-Meteo's air-quality API is keyless, CORS-open, and takes comma-separated
coordinate lists — so a whole tier of cities is **one request**, not one per
pin. The app then draws its own labels, which means it can look like the map
and it can thin out with zoom.

### Zoom tiers

Clutter is prevented by never drawing the clutter. Each city in
`client/src/data/aqi-cities.ts` declares the smallest map it deserves to appear
on, and the zoom gate releases one tier at a time:

| Zoom | Tier drawn | Count | Caption on screen |
|---|---|---|---|
| < 5.0 | State/UT capitals and metros | 36 | "Capitals and metros · zoom in for more cities" |
| 5.0 – 6.4 | \+ large cities and regional hubs | 82 | "Capitals and large cities · keep zooming for the rest" |
| ≥ 6.4 | \+ everything else in the list | 156 | "All cities in view" |

The caption is not decoration: a judge asking "why can I only see nine cities"
gets the answer off the screen rather than out of the source. Thresholds live in
`AQI_ZOOM` in `design/tokens.ts`.

### US AQI, and saying so

Open-Meteo publishes **US AQI**. CPCB's Indian AQI uses different breakpoints
and is a different number for the same air. The radar labels its scale (`US
AQI`), uses US EPA band colours from `lib/openMeteoAqi.ts`, and credits
Open-Meteo — while the saved-place cards read the real **CPCB** figure through
`/api/aqi` with CPCB's own band names. Quietly colouring a US figure with
Indian band names would be a mistake somebody could catch.

## Why humidity was cut rather than half-wired

There is still no confirmed stable free global raster-tile source for humidity:

- OpenWeather's free **Weather Maps 1.0** set covers clouds, precipitation,
  pressure, wind and temperature — humidity is not among them.
- Open-Meteo's `weather-map-layer` project does support humidity as a variable,
  but is explicitly early-stage with breaking changes expected. Its **point**
  API is stable (and is what the AQI layer uses) — that is a different product
  from map tiles.

CLAUDE.md's rule is to cut a feature entirely rather than ship something that
does not work, so humidity is absent from this screen rather than present as a
dead toggle. It is not missing from the product: humidity is on the health
persona card, in the hero stats, and is one of the four switchable series in the
hourly metric chart.

## Behaviour when a key is absent

The Wind chip renders **disabled**, with the reason on hover/long-press. It is
deliberately not hidden — a judge asking "where's wind?" gets an answer, and it
is not dead UI pretending to work. Setup is in `client/.env.example`.

## Attribution

RainViewer's terms make credit a **condition of use**, not a courtesy, so the
credit line is not optional chrome — it renders whenever a layer is active and
switches to match whichever provider is on screen. Verified in the browser:
Rain → "Weather data by RainViewer"; Wind → "Wind data by OpenWeather";
Air quality → "Air quality by Open-Meteo".

## UX rules applied

- **One overlay at a time** via a segmented toggle. Stacked global rasters over
  a dark basemap read as mud, and Windy/Apple/Google all segment for the same
  reason.
- **Crossfade on switch**, never a pop — MapLibre's native `raster-opacity`
  transition (350 ms) for the rasters, a CSS opacity transition on each label
  for the AQI layer, so a tier appearing on zoom-in arrives the same way.
  MapLibre supports paint transitions but its published types omit the
  `-transition` keys, hence the one cast in `RadarMap.tsx`.
- **Transform-only entrance.** The radar uses `sheetVariants` like every other
  full-screen surface. It previously shared the card morph (`layoutId`), which
  animated width and height and therefore stretched the type.

## Not built (deliberately)

Animated wind-particle fields (the Windy-style moving streaks) are a stretch
goal and were not attempted. The raster overlay ships working for every
available layer first; a half-built particle system would violate the same
"cut cleanly" rule that removed humidity.

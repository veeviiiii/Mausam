# Full-screen radar — layer sources and decisions

Provider terms verified by probing each endpoint before building against it,
not taken from documentation alone. Checked 04 Sep 2026.

## What shipped

| Layer | Provider | Key needed | Verified | Notes |
|---|---|---|---|---|
| **Precipitation** | RainViewer | None | API `200`, 13 radar frames, tile `200` (10 KB PNG) | Global radar, ~5 min refresh |
| **Air quality** | WAQI | Works on public demo token | Tile `200` (19 KB PNG) | Override with `VITE_WAQI_TOKEN` |
| **Wind** | OpenWeather `wind_new` | `VITE_OWM_KEY` | Confirmed `401` without a key | Layer disables itself and says why |
| **Humidity** | — | — | — | **Cut. See below.** |

## Why humidity was cut rather than half-wired

There is no confirmed stable free global raster-tile source for humidity:

- OpenWeather's free **Weather Maps 1.0** set covers clouds, precipitation,
  pressure, wind and temperature — humidity is not among them.
- Open-Meteo's `weather-map-layer` project does support humidity as a variable,
  but is explicitly early-stage with breaking changes expected. Its **point**
  API is stable (verified `200`) — that is a different product from map tiles.

CLAUDE.md's rule is to cut a feature entirely rather than ship something that
does not work, so humidity is absent from this screen rather than present as a
dead or unreliable toggle. It is not missing from the product: humidity is
already on the health persona card, in the hero stats, and is one of the four
switchable series in the hourly metric chart.

## Behaviour when a key is absent

The Wind chip renders **disabled**, with the reason on hover/long-press
("Needs a free OpenWeather key in `VITE_OWM_KEY`"). It is deliberately not
hidden — a judge asking "where's wind?" gets an answer, and it is not dead UI
pretending to work. To enable it:

```bash
# client/.env.local  (never committed — see .gitignore)
VITE_OWM_KEY=your_openweather_key
VITE_WAQI_TOKEN=your_waqi_token   # optional; falls back to the public demo token
```

## Attribution

RainViewer's terms make credit a **condition of use**, not a courtesy, so the
credit line is not optional chrome — it renders whenever a layer is active, and
switches to match whichever provider is currently on screen. Verified: Rain →
"Weather data by RainViewer" → rainviewer.com; Air quality → "Air quality by
WAQI" → waqi.info.

## UX rules applied

- **One overlay at a time** via a segmented toggle. Stacked global rasters over
  a dark basemap read as mud, and Windy/Apple/Google all segment for the same
  reason.
- **Crossfade on switch**, never a pop — done with MapLibre's native
  `raster-opacity` transition (350 ms). MapLibre supports paint transitions but
  its published types omit the `-transition` keys, hence the one cast in
  `RadarMap.tsx`.
- **Reuses the card expand transition** (`layoutId="radar-map"`) rather than
  introducing a second expand language for one screen.

## Not built (deliberately)

Animated wind-particle fields (the Windy-style moving streaks) are a stretch
goal and were not attempted. The raster overlay ships working for every
available layer first; a half-built particle system would violate the same
"cut cleanly" rule that removed humidity.

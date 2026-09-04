# IMD service coverage vs. the 8-persona spec

Cross-reference of the data categories IMD publishes on its desktop portal
(imd.gov.in / mausam.imd.gov.in) against the eight personas in `CLAUDE.md`,
done before building further so the gaps are decisions rather than omissions.

**The portal is a data reference only.** Its visual design — the blue/red/yellow
government-site blocks — has zero influence on this project's UI. What we take
from it is the list of things IMD actually publishes.

Status as of 04 Sep 2026.

---

## 1. Direct matches — covered

| IMD service | Persona | Where it lands | Status |
|---|---|---|---|
| **Agromet Advisory Services (AAS)** | Farmers & gardeners | `Place.agromet` → *Field conditions* card body and detail | ✅ Covered |
| **Urban Meteorological Services** | Commuters | `Place.urban` → *Commute watch* card, and an urgency boost | ✅ Covered |

**Agromet.** The AAS bulletin is the single most persona-shaped thing IMD
publishes — it is already written as advice ("hold off on urea top-dressing"),
not as a reading. It is now a first-class field, and the farmers' card leads
with the advisory text rather than burying it under numbers. One real
consequence for caching: AAS publishes **Tuesdays and Fridays**, not on a clock,
so its cache entry is invalidated on next issue rather than by TTL. That is
already reflected in the card's stated provenance.

**Urban met.** This was the weakest part of the commuter model before: visibility
and wind are district-scale, but waterlogging is street-scale, and the commuter
persona is the one that cares about the difference. `UrbanMet.waterloggingRisk`
now feeds a real scoring rule (`high` → +24), so a Mumbai commuter sees the card
climb on a day when visibility alone would not have moved it.

---

## 2. Partial matches — folded in, not promoted

| IMD service | Nearest persona | Decision |
|---|---|---|
| **Aviation Services** | Travellers | Surfaced inside the *Saved destinations* detail view (runway visibility, crosswind, terminal status). **Not** its own persona. |
| **Tourism Forecast** | Event planners / Travellers | Supplies the narrative line and the "driest day" pick in *Comfort index*. **Not** its own persona. |

Both were candidates for new personas and both are refused on the same grounds:
`CLAUDE.md` fixes the persona list at eight and names scope creep here as a
non-goal. Neither service justifies a ninth — aviation data matters to a
traveller only in the ten minutes around a flight, and the tourism forecast is
essentially the extended-range outlook with a sentence attached.

**Overlap check.** Aviation visibility and the commuter visibility reading come
from different stations (airport METAR vs. district nowcast) and will disagree.
They are deliberately kept in different cards so the disagreement never appears
as one number contradicting itself on the same screen.

---

## 3. Severe weather — one parser, three feeds

IMD publishes these separately, and the risk was building a parser that only
understood generic district warnings.

| IMD feed | Modelled as | Rendered |
|---|---|---|
| **Latest CAP Alerts** | `AlertKind = "district"` | Pinned banner, Warnings tab |
| **Interactive Track of Cyclone** | `AlertKind = "cyclone"` + `CycloneTrack` | Pinned banner + track polyline on the Places map |
| **Flash Flood Bulletin** | `AlertKind = "flash-flood"` | Pinned banner, Warnings tab |

`Alert.kind` is a discriminator, not a label: `cap-parser.ts` branches on it, and
the cyclone variant carries `fixes` (a `[lon, lat]` list) plus a forecast
landfall window. The seed dataset exercises all three plus the no-warning empty
state, so none of these paths is theoretical:

- Mumbai — orange, district
- New Delhi — yellow, district
- Kochi — yellow, flash flood
- Visakhapatnam — orange, cyclone (deep depression BOB 04, five track fixes)
- Chennai — none, so the designed empty state renders

---

## 4. Out of scope — explicitly

| IMD service | Decision | Reasoning |
|---|---|---|
| **Climate Hazard & Vulnerability Atlas** | ❌ Out for the prototype | Decadal climatology, not forecast. Nothing in it changes what a user does today, which is what a persona card is for. Its natural home is a later "insights" surface — long-horizon, browsable, not on the homepage. |
| **Geospatial Services** | ❌ Out for the prototype | A layer catalogue (radar mosaics, satellite imagery) rather than a data product. Wiring it means a raster tile pipeline, which competes directly with the performance bar this project exists to beat. |
| **Moonrise / moonset times** | ❌ Out as a surfaced value | Present in IMD's current-conditions panel, but no persona acts on the times themselves. Surfacing them would be data because it exists, not because someone needs it. |
| **Moon *phase*** | ✅ In, narrowly | Kept only on the *Sea & tide* card, because spring and neap tides track the lunar cycle — it is the reason the tide range is what it is. `Moon.tideRegime` states that in words rather than making the user infer it. |

The distinction in the last two rows is the general rule applied throughout: a
value earns its place by changing a decision, not by being available.

---

## 5. Reliability note

While cross-referencing, IMD's own **Current Weather** and **Daily Weather
Briefing** panels on the portal were rendering completely blank.

That is worth recording, because it moves the seeded-fallback requirement from
"prudent" to "observed". `CLAUDE.md` already makes `seed-fallback.json` a P0
item; this is direct evidence that the failure mode it protects against is the
normal case, not the edge case. The client's seed dataset (`client/src/data/seed.ts`)
mirrors that file so the homepage renders complete and correct with the backend
unreachable — and the map carries the same idea, falling back to a projected
static plate when tiles do not arrive.

---

## 6. Resulting data-model changes

Added to `client/src/data/types.ts`:

- `Agromet` — advisory text, issue date, soil moisture and category
- `UrbanMet` — waterlogging risk, heat index, city-scale advisory
- `Aviation` — airport ICAO/name, runway visibility, crosswind, terminal status
- `Tourism` — outlook sentence, best day
- `Moon` — phase, illumination, rise/set, `tideRegime`
- `AlertKind` + `CycloneTrack` on `Alert`

No persona was added, renamed or removed.

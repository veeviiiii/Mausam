Continue from the `design/mausam-home.html` prototype. Do the following:

## 1. Extract design tokens into `client/src/design/tokens.ts`
Pull the condition × time-of-day gradient table, glass tier tokens, the
computed contrast-audit logic, and the motion spring configs out of
`design/mausam-home.html` into a single TypeScript source of truth at
`client/src/design/tokens.ts`. The React build should import from there —
no duplicated values between the prototype and the real app.

## 2. Add a "Mausam" brand heading
Give the homepage a clear brand heading in the header area — above or
alongside the location switcher. It should read as the app's identity, not
compete with the severe-alert banner, which stays the top-priority element
per CLAUDE.md. Use Google Sans Flex, consistent with the rest of the
typography system.

## 3. Cross-reference IMD's real site for feature coverage
The reference screenshot is IMD's desktop portal (imd.gov.in /
mausam.imd.gov.in) — not the Mausam app's own UI, so it's a feature/data
reference only. Its visual design (blue/red/yellow government-site blocks)
should have zero influence on our UI.

Check these real IMD data categories against the 8-persona spec for
coverage gaps before building further:
- **Agromet Advisory Services** — direct match for farmers & gardeners; confirm our data model covers it
- **Urban Meteorological Services** — direct match for commuters; confirm coverage
- **Aviation Services** and **Tourism Forecast** — partial matches for travelers/event planners; check overlap
- **Interactive Track of Cyclone**, **Latest CAP Alerts**, **Flash Flood Bulletin** — all severe-weather-adjacent; confirm the CAP parser (already planned) covers all three, not just generic warnings
- **Climate Hazard & Vulnerability Atlas** and **Geospatial Services** — not mapped to any current persona; decide explicitly whether these are out of scope or belong in a later "insights" surface, rather than leaving the gap silent
- The current-conditions panel includes moonrise/moonset alongside sunrise/sunset — decide if moon data belongs on any persona card or is deliberately out of scope

Also worth noting: in the reference screenshot, IMD's own "Current Weather"
and "Daily Weather Briefing" panels are rendering completely blank — live
evidence of the reliability problem this project exists to fix. Good
validation that the seeded-fallback requirement (already in CLAUDE.md)
isn't a hypothetical risk.

## 4. Map integration
Use MapLibre GL JS with OpenFreeMap's dark style
(`https://tiles.openfreemap.org/styles/dark`) — free, no API key, no
request limits, MIT-licensed, and self-hostable later if reliability
during judging matters. Don't reach for CARTO's basemap tiles: despite
older tutorials treating them as free, CARTO's own license now restricts
hosted tile access to enterprise/non-profit-grant customers only. A
pixel-exact match to Skymet's own map isn't necessary or realistically
achievable — their tile provider isn't public. If OpenFreeMap's style
doesn't read well against the glass/gradient system once it's wired in, a
static dark-mode map outline (no live tiles) is a fine fallback, not a
compromise worth losing time over.

## 5. Smooth the city-heading and card transitions
Both currently cut instantly, which breaks the "no jarring state changes"
rule already in CLAUDE.md.
- **City heading**: animate city-name changes with a rolling/exit-entry
  transition (vertical slide + crossfade via Framer Motion's
  `AnimatePresence`, or similar) instead of a hard swap.
- **Cards**: audit the current FLIP-based reorder — it's likely only
  animating position, not entry/exit, which is why it reads as sudden.
  Wire proper enter/exit transitions using the same spring values as the
  reorder itself.
- Both should pull timing/easing from the shared tokens in
  `client/src/design/tokens.ts` (item 1) rather than introducing new
  one-off animation values.

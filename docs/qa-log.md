# QA pass — 04 Sep 2026

Full pass triggered by a white-screen report on Thunderstorm / Kochi. Driven
through the running app with browser automation, asserting on the live DOM and
capturing console output for every state.

**Environment caveat, stated up front:** the automation pane runs hidden, and a
hidden tab has `requestAnimationFrame` paused and `setTimeout` clamped to ~1 s.
Every assertion below is therefore on **state and layout**, which are unaffected.
Animation *smoothness* could not be measured here and still needs a look on real
hardware — see "Not verified" at the end.

---

## 1. The white screen — root cause

**Not a crash.** No uncaught exception, no console error. Every element rendered;
the *background* was missing, and on Thunderstorm the text tokens are white — so
white text sat on a white page.

`SkyBackground` cross-faded by mounting the incoming sky at `opacity: 0` inside
`AnimatePresence` and animating it up. If that animation never completed, the
page had **no background layer at all**. The same fragility had already bitten
this codebase twice (stacked alert banners, stuck screens).

**Fix** — the current sky is now a plain, always-opaque base layer that no
animation touches. The cross-fade happens in a second layer holding the
*outgoing* sky, which fades out and is unmounted **by a timer**, not by an
animation callback. Worst case a stale sky lingers ~0.9 s; there is no code path
that leaves the background empty.

**Defence in depth**, per the brief:
- `ErrorBoundary` around the sky layer (falls back to a painted gradient) and
  around the screen content (falls back to a legible message, nav still works).
  Errors are logged, never swallowed; a state change clears the boundary.
- `skyFor()` replaces raw `SKY_TOKENS[c][t]` indexing — an unknown combination
  now warns and falls back to `overcast/day` instead of throwing on `undefined`.

---

## 2. Results

### Sky matrix — 7 conditions × 4 times of day

Asserted per combination: correct condition/time resolved, gradient painted,
base layer at `opacity: 1`, canvas fills its host, exactly one screen mounted,
cards rendered, zero new console errors.

**28 / 28 PASS**, 0 errors. Re-run after the canvas fix: **28 / 28 PASS**.

### Cities — 6 / 6 PASS

| City | Condition | Sky | Canvas fills | Cards | Alerts | Errors |
|---|---|---|---|---|---|---|
| Mumbai | rain | ✅ | ✅ | 2 | 1 | 0 |
| New Delhi | partly | ✅ | ✅ | 2 | 1 | 0 |
| Chennai | partly | ✅ | ✅ | 2 | 0 *(correct — no warning)* | 0 |
| Kochi | thunderstorm | ✅ | ✅ | 2 | 1 | 0 |
| Visakhapatnam | overcast | ✅ | ✅ | 2 | 1 | 0 |
| **Indore** *(new)* | rain | ✅ | ✅ | 2 | 1 | 0 |

### Personas — 8 / 8 PASS

Each selected alone; asserted that exactly its own card renders.

| Persona | Card | Result |
|---|---|---|
| Health-conscious | Air & allergens | PASS |
| Outdoor fitness | Best run window | PASS |
| Beach & surf | Sea & tide | PASS |
| Travellers | Saved destinations | PASS |
| Parents & families | School run | PASS |
| Farmers & gardeners | Field conditions | PASS |
| Commuters | Commute watch | PASS |
| Event planners | Comfort index | PASS |

### Interactions

| Test | Result |
|---|---|
| Beach card suppressed on an inland city (Indore), with explanation | PASS |
| Persona cap: 3 selected, remaining 5 disabled | PASS |
| "Why this card" disclosure toggles `aria-expanded` + `0fr`/`1fr` | PASS |
| Card → detail sheet opens (6 rows, correct title) | PASS |
| Detail sheet closes via button | PASS *(after fix)* |
| Detail sheet closes via Escape | PASS *(after fix)* |
| Alert banner → detail sheet opens / closes | PASS *(after fix)* |
| No orphan sheets after 3 open/close cycles | PASS |
| Card reorder (Arrange mode, move down) | PASS |
| Offline toggle on → stale strip shown | PASS |
| Offline toggle off → strip cleared | PASS |
| Pull-to-refresh (synthetic pointer drag) → "Updated just now" | PASS |
| Tab navigation, all four, one screen mounted each | PASS |

---

## 3. Bugs found and fixed in this pass

1. **Background could vanish → white-on-white.** Root cause above.
2. **Ambient canvas was 300 × 150 at any screen size.** `<canvas>` is a replaced
   element, so `inset-0` never stretched it — every weather animation was
   drawing into the top-left corner. Fixed with `h-full w-full`; verified the
   canvas and its backing store now match the host (430 × 620).
3. **Detail and alert sheets could not be dismissed.** `AnimatePresence` holds an
   exiting child until its exit animation reports completion; when that did not
   happen, a full-screen overlay stayed up permanently — the app looked frozen.
   The sheet is now mounted/unmounted directly. The opening morph still works;
   the closing morph is given up deliberately, because a sheet that always closes
   is worth more than one that shrinks prettily most of the time.
4. **Thunderstorm had no animation of its own** — see `condition-audit.md`.
5. **Overcast showed stars at night**; **clear/partly had no day animation**.

## 4. Performance

Measured structurally rather than by frame timing, which the hidden pane cannot
produce honestly.

- **`backdrop-filter` layers: 10 → 4** on a representative screen. Each blurred
  element is a separate composited layer that reads back its backdrop — the most
  expensive thing on screen and, per CLAUDE.md, the first thing to cut on
  low-end Android. Blur was removed from `.glass-chip`: at chip size it is
  imperceptible, and there were six of them on one screen. Cards, sheets and the
  nav bar keep theirs.
- **Ambient loop throttled to ~30 fps** (was uncapped rAF).
- **DPR capped at 1.5** for the ambient canvas — it sits behind a 20px blur, so
  2× is detail nobody can see.
- **Rain and snow batch into one path per frame** instead of a
  `beginPath`/`stroke` per particle.
- **Particle counts scale with viewport area** rather than being fixed, so a
  phone no longer pays a desktop's price.

Production build is clean and unchanged in shape: homepage **335 kB (109 kB
gzipped)**, with MapLibre's 806 kB still split into a lazy chunk that only loads
on the Places tab.

## 5. Not verified here — needs a look on real hardware

- **Animation smoothness and frame timings.** rAF is paused in this environment,
  so nothing about perceived jank could be measured. Profile on a mid-range
  Android with the production build before drawing conclusions; the
  "Reduce transparency" toggle in *You* is the fallback if blur still costs
  frames.
- **The live map.** Tiles are reachable (style, raster and vector tiles all
  return 200), but MapLibre renders through rAF and cannot draw in a hidden tab,
  so it falls back to the static plate here.
- **Visual appearance** of the new ambient treatments (lightning, motes, cloud
  banks) — the logic and canvas sizing are verified, the look is not.

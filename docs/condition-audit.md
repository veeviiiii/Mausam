# Condition × gradient × animation audit

Every weather condition in the data model, checked for a background gradient at
all four times of day and its own distinct animated treatment.

Conditions confirmed against `Condition` in `client/src/design/tokens.ts` —
seven, matching the CLAUDE.md list exactly. Gradient coverage is enforced in CI
by `npm run check`, which fails the build if any of the 28 combinations is
missing or drops below WCAG AA.

Audited 04 Sep 2026, after the fixes below.

## Coverage

| Condition | Gradients (dawn / day / dusk / night) | Ambient animation | Icon animation | Notes |
|---|---|---|---|---|
| **clear** | ✅ 4/4 | ✅ `motes` by day, `stars` at night | ✅ pulsing sun | Day had **no ambient at all** before this pass |
| **partly** | ✅ 4/4 | ✅ `clouds` by day, `stars` at night | ✅ drifting cloud over sun | Day had **no ambient at all** before this pass |
| **overcast** | ✅ 4/4 | ✅ `clouds` at every time of day | ✅ two clouds drifting apart | Previously showed **stars at night** — through solid cloud |
| **rain** | ✅ 4/4 | ✅ `rain` streaks | ✅ falling drops, staggered | — |
| **thunderstorm** | ✅ 4/4 | ✅ `storm` — heavier rain + lightning flash | ✅ flickering bolt | **Was not wired at all**: silently fell through to rain's animation |
| **fog** | ✅ 4/4 | ✅ `fog` banding | ✅ drifting fog bars | — |
| **snow** | ✅ 4/4 | ✅ `snow` flakes | ✅ drifting flakes | — |

`kindFor()` in `AmbientLayer.tsx` is now an exhaustive `switch` over `Condition`,
so adding an eighth condition is a TypeScript error until it is given a
treatment — rather than silently inheriting rain's.

## Gaps found and closed

1. **Thunderstorm had no treatment of its own.** `kindFor` returned `"rain"` for
   both `rain` and `thunderstorm`. It now returns `"storm"`: 1.5× rain speed
   plus a lightning flash on a randomised 1.6–6.1 s cycle with a two-stage decay,
   so a strike reads as a strike rather than a fade.

2. **Overcast showed stars at night.** The old rule was "if it's night, show
   stars" — checked *after* rain/snow/fog but before anything else, so overcast
   nights got a clear starfield. Overcast now maps to drifting cloud banks at
   every time of day.

3. **Clear and partly cloudy had nothing during the day.** Both fell through to
   `"none"`. Clear day now gets slow sunlit motes; partly cloudy gets soft
   drifting cloud banks.

4. **The animation canvas was 300 × 150 regardless of screen size.** This one
   affected *every* condition. The canvas was positioned with `absolute inset-0`
   — but `<canvas>` is a **replaced element**, and `inset-0` does not stretch it;
   with `width`/`height` auto it stays at its intrinsic 300 × 150. Measured in a
   430 × 620 host, the canvas was drawing into the top-left corner only. Fixed by
   sizing it with `h-full w-full`.

   This is the same root cause as the MapLibre container bug fixed earlier —
   MapLibre's own stylesheet forced `position: relative` on a node styled with
   `inset-0`, collapsing it to zero height. Both were "positioned but unsized".

## Related non-condition finding

The **background itself could vanish**, which is what produced the reported
white screen. It was cross-faded by mounting the new sky at `opacity: 0` and
animating it up; if that animation never completed the page was left with no
background at all, and on a sky whose text tokens are white that means
white-on-white. The current sky is now an always-opaque base layer that no
animation touches, with the *outgoing* sky fading out above it and being removed
by a timer. See `SkyBackground.tsx`.

/**
 * tokens.ts — the single source of truth for Mausam's visual system.
 *
 * Extracted from the design study at /design/mausam-home.html. That file is now
 * frozen as a reference artefact; every value it embeds is mirrored here, and
 * `scripts/verify-tokens.ts` fails the build if the two ever drift apart.
 *
 * Four things live here, and nothing else should redefine them:
 *   1. SKY          — the condition x time-of-day gradient table (CLAUDE.md)
 *   2. GLASS        — the frosted-surface tiers, plus the low-end-GPU fallback
 *   3. audit logic  — measured contrast, which *chooses* the glass polarity
 *   4. SPRINGS      — every motion config in the app
 */

/* ------------------------------------------------------------------ *
 * 0. Primitives
 * ------------------------------------------------------------------ */

export type Condition =
  | "clear"
  | "partly"
  | "overcast"
  | "rain"
  | "thunderstorm"
  | "fog"
  | "snow";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export type GlassMode = "onDark" | "onLight";

/** A gradient stop: [position 0-100, hex]. */
export type Stop = [number, string];
export type Stops = Stop[];

export type RGB = [number, number, number];

export const CONDITIONS: Condition[] = [
  "clear",
  "partly",
  "overcast",
  "rain",
  "thunderstorm",
  "fog",
  "snow",
];

export const TIMES_OF_DAY: TimeOfDay[] = ["dawn", "day", "dusk", "night"];

export const CONDITION_LABEL: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  overcast: "Overcast",
  rain: "Rain",
  thunderstorm: "Thunderstorm",
  fog: "Fog",
  snow: "Snow",
};

/* ------------------------------------------------------------------ *
 * 1. The sky table — condition x time-of-day, defined exactly once.
 * ------------------------------------------------------------------ */

export const SKY: Record<Condition, Record<TimeOfDay, Stop[]>> = {
  clear: {
    dawn: [[0, "#26356A"], [52, "#7E6A9E"], [100, "#F2AE7C"]],
    day: [[0, "#2680CF"], [55, "#6FBFEE"], [100, "#BCE3F7"]],
    dusk: [[0, "#1B3568"], [50, "#B4557A"], [100, "#F6A45C"]],
    night: [[0, "#050A16"], [55, "#0E1B3A"], [100, "#1B2C54"]],
  },
  partly: {
    dawn: [[0, "#333E6E"], [52, "#8C7BA0"], [100, "#E6AD8C"]],
    day: [[0, "#3781C2"], [55, "#79B4DE"], [100, "#C4DAEA"]],
    dusk: [[0, "#26385E"], [50, "#9E5D7A"], [100, "#E0955F"]],
    night: [[0, "#060B18"], [55, "#131E3C"], [100, "#243254"]],
  },
  overcast: {
    dawn: [[0, "#454C5F"], [55, "#7B818F"], [100, "#ADAEB6"]],
    day: [[0, "#78859A"], [55, "#9BA6B4"], [100, "#C6CED8"]],
    dusk: [[0, "#3A4055"], [50, "#6B6577"], [100, "#98777F"]],
    night: [[0, "#0A0E16"], [55, "#171C26"], [100, "#252B38"]],
  },
  rain: {
    dawn: [[0, "#28364A"], [55, "#4A5A70"], [100, "#727F92"]],
    day: [[0, "#445A72"], [55, "#6B819A"], [100, "#96ABBF"]],
    dusk: [[0, "#1F2A3E"], [50, "#43506A"], [100, "#6D6D86"]],
    night: [[0, "#04080F"], [55, "#0A121C"], [100, "#182231"]],
  },
  thunderstorm: {
    dawn: [[0, "#1E1830"], [55, "#3D3350"], [100, "#5E4E6A"]],
    day: [[0, "#273044"], [55, "#414A63"], [100, "#60647A"]],
    dusk: [[0, "#141226"], [50, "#33263F"], [100, "#583850"]],
    night: [[0, "#03050C"], [55, "#0C0F1C"], [100, "#181C2E"]],
  },
  fog: {
    dawn: [[0, "#6A707C"], [55, "#979CA6"], [100, "#C3C6CC"]],
    day: [[0, "#96A0AA"], [55, "#B9BEC5"], [100, "#DADDE1"]],
    dusk: [[0, "#565866"], [50, "#7E7B84"], [100, "#A79A9E"]],
    night: [[0, "#0E1119"], [55, "#1C2029"], [100, "#2C303A"]],
  },
  snow: {
    dawn: [[0, "#4E5B86"], [55, "#8792B5"], [100, "#C7CFE2"]],
    day: [[0, "#89A3C4"], [55, "#B6C8DE"], [100, "#E6EDF5"]],
    dusk: [[0, "#3A4570"], [50, "#7A7395"], [100, "#B892A4"]],
    night: [[0, "#070C18"], [55, "#141C32"], [100, "#26314E"]],
  },
};

/* ------------------------------------------------------------------ *
 * 2. Glass tiers.
 *
 * Two candidate treatments, not one. Which of them a given sky gets is
 * decided by measurement in section 3 — never by eye.
 * ------------------------------------------------------------------ */

export interface GlassTier {
  scrim: RGB;
  scrimA: number;
  fill: RGB;
  fillA: number;
  text: RGB;
  textA: number;
  textMuted: RGB;
  textMutedA: number;
  hair: string;
  hairStrong: string;
  chip: string;
  tabScrim: string;
}

export const GLASS: Record<GlassMode, GlassTier> = {
  onDark: {
    scrim: [9, 15, 26],
    scrimA: 0.4,
    fill: [255, 255, 255],
    fillA: 0.1,
    text: [255, 255, 255],
    textA: 1,
    textMuted: [255, 255, 255],
    textMutedA: 0.8,
    hair: "rgba(255,255,255,.20)",
    hairStrong: "rgba(255,255,255,.34)",
    chip: "rgba(255,255,255,.14)",
    tabScrim: "rgba(8,13,22,.72)",
  },
  onLight: {
    scrim: [255, 255, 255],
    scrimA: 0,
    fill: [255, 255, 255],
    fillA: 0.66,
    text: [10, 20, 32],
    textA: 1,
    textMuted: [10, 20, 32],
    textMutedA: 0.68,
    hair: "rgba(10,20,32,.14)",
    hairStrong: "rgba(10,20,32,.26)",
    chip: "rgba(10,20,32,.08)",
    tabScrim: "rgba(246,249,252,.74)",
  },
};

/**
 * Low-end Android fallback. `backdrop-filter: blur()` is the single most
 * expensive thing on this screen; when it costs frames we drop it and let the
 * fill opacity carry the separation instead. CLAUDE.md treats this as a
 * required fallback, not an optional degradation.
 */
export const GLASS_FLAT: Record<GlassMode, Pick<GlassTier, "scrimA" | "fillA">> = {
  onDark: { scrimA: 0.52, fillA: 0.16 },
  onLight: { scrimA: 0, fillA: 0.8 },
};

/**
 * Backdrop-filter is the single most expensive thing on this screen, and it
 * gets recomputed every time whatever sits behind it changes — which, over
 * the animated sky, is every frame. These radii were tuned for a static
 * screenshot; on real hardware they compounded with the ambient canvas into
 * visible lag across the whole app, not just the weather animation. Cut hard
 * here rather than cutting the glass language entirely.
 */
// tabbar has no entry of its own: it reuses --glass-blur (the same value as
// cards) since TabBar.tsx sits over the same scrolling content.
export const BLUR = { card: 10, sheet: 14, chip: 12, flat: 0 } as const;

export const RADIUS = { card: 22, sheet: 20, alert: 18, plate: 20, chip: 14, pill: 999 } as const;

/** Where down the screen the cards actually sit — the band we audit. */
export const CARD_BAND: [number, number] = [0.55, 0.9];

/* ------------------------------------------------------------------ *
 * 3. Colour maths + the contrast audit.
 * ------------------------------------------------------------------ */

export function hexToRgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgbToHex(c: RGB): string {
  return "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function luminance(c: RGB): number {
  return (
    0.2126 * channelToLinear(c[0]) +
    0.7152 * channelToLinear(c[1]) +
    0.0722 * channelToLinear(c[2])
  );
}

/** WCAG contrast ratio between two opaque colours. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite `src` at `alpha` over opaque `dst`. */
export function composite(src: RGB, alpha: number, dst: RGB): RGB {
  return [
    src[0] * alpha + dst[0] * (1 - alpha),
    src[1] * alpha + dst[1] * (1 - alpha),
    src[2] * alpha + dst[2] * (1 - alpha),
  ];
}

/** Sample a stop list at t (0..1) down the gradient. */
export function sampleGradient(stops: Stop[], t: number): RGB {
  const p = t * 100;
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (p <= p1 || i === stops.length - 2) {
      const k = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
  }
  return hexToRgb(stops[stops.length - 1][1]);
}

export function gradientCss(stops: Stop[]): string {
  return `linear-gradient(180deg,${stops.map(([p, c]) => `${c} ${p}%`).join(",")})`;
}

export interface ContrastReading {
  /** Worst primary-text ratio across the card band. */
  primary: number;
  /** Worst secondary/muted-text ratio across the card band. */
  secondary: number;
}

/**
 * Composite a glass treatment over the real gradient and measure both text
 * roles at both ends of the card band, keeping the worst reading.
 */
export function measureGlass(stops: Stop[], mode: GlassMode, flat = false): ContrastReading {
  const g = GLASS[mode];
  const scrimA = flat ? GLASS_FLAT[mode].scrimA : g.scrimA;
  const fillA = flat ? GLASS_FLAT[mode].fillA : g.fillA;

  let primary = Infinity;
  let secondary = Infinity;

  for (const t of CARD_BAND) {
    const ground = sampleGradient(stops, t);
    const surface = composite(g.fill, fillA, composite(g.scrim, scrimA, ground));
    primary = Math.min(primary, contrastRatio(composite(g.text, g.textA, surface), surface));
    secondary = Math.min(
      secondary,
      contrastRatio(composite(g.textMuted, g.textMutedA, surface), surface),
    );
  }
  return { primary, secondary };
}

/** WCAG AA for body text. */
export const AA_THRESHOLD = 4.5;

export interface ResolvedSky {
  condition: Condition;
  timeOfDay: TimeOfDay;
  /** Chosen by measurement, not by eye. */
  mode: GlassMode;
  gradient: string;
  stops: Stop[];
  /** Representative ground colour under the card band, for reporting. */
  ground: string;
  audit: ContrastReading;
  auditFlat: ContrastReading;
  passesAA: boolean;
  /** Text sitting directly on this sky, measured separately from the glass. */
  hero: ResolvedHero;
}

/**
 * Resolve one sky: measure both glass treatments over it and keep whichever
 * holds up better for the weaker of the two text roles.
 */
export function resolveSky(condition: Condition, timeOfDay: TimeOfDay): ResolvedSky {
  const stops = SKY[condition][timeOfDay];
  const dark = measureGlass(stops, "onDark");
  const light = measureGlass(stops, "onLight");

  const darkScore = Math.min(dark.primary, dark.secondary);
  const lightScore = Math.min(light.primary, light.secondary);
  const mode: GlassMode = lightScore > darkScore ? "onLight" : "onDark";
  const audit = mode === "onLight" ? light : dark;

  return {
    condition,
    timeOfDay,
    mode,
    gradient: gradientCss(stops),
    stops,
    ground: rgbToHex(sampleGradient(stops, 0.72)),
    audit,
    auditFlat: measureGlass(stops, mode, true),
    passesAA: audit.primary >= AA_THRESHOLD && audit.secondary >= AA_THRESHOLD,
    hero: resolveHero(stops),
  };
}

/* ------------------------------------------------------------------ *
 * 3b. Bare text on the sky.
 *
 * The audit above only ever measured text sitting ON GLASS. The hero — city
 * name, temperature, condition, station line — sits directly on the gradient
 * with no surface under it, near the TOP of the sky, where the gradient is a
 * different luminance entirely from the card band.
 *
 * So the hero gets its own measurement, and may end up with the opposite
 * polarity to the cards on the same screen. Where neither polarity clears AA on
 * its own, we add the smallest scrim that gets it there, rather than nudging a
 * colour until it looks about right.
 * ------------------------------------------------------------------ */

export const HERO_BAND: [number, number] = [0.06, 0.46];

/** The scrim holds full strength to 40% down, then fades out by 62%. */
const SCRIM_FLAT_UNTIL = 0.4;
const SCRIM_ZERO_AT = 0.62;

export function scrimAlphaAt(t: number, peak: number): number {
  if (t <= SCRIM_FLAT_UNTIL) return peak;
  if (t >= SCRIM_ZERO_AT) return 0;
  return (peak * (SCRIM_ZERO_AT - t)) / (SCRIM_ZERO_AT - SCRIM_FLAT_UNTIL);
}

export interface ResolvedHero {
  mode: GlassMode;
  text: string;
  textMuted: string;
  /** Peak alpha of the scrim laid over the top of the sky. 0 when unneeded. */
  scrimAlpha: number;
  scrimColor: RGB;
  ratio: number;
  passesAA: boolean;
}

const HERO_SAMPLES = 5;

function worstHeroRatio(stops: Stops, mode: GlassMode, peak: number): number {
  const g = GLASS[mode];
  let worst = Infinity;
  for (let i = 0; i < HERO_SAMPLES; i++) {
    const t = HERO_BAND[0] + ((HERO_BAND[1] - HERO_BAND[0]) * i) / (HERO_SAMPLES - 1);
    const ground = composite(g.scrim, scrimAlphaAt(t, peak), sampleGradient(stops, t));
    worst = Math.min(
      worst,
      contrastRatio(composite(g.text, g.textA, ground), ground),
      contrastRatio(composite(g.textMuted, g.textMutedA, ground), ground),
    );
  }
  return worst;
}

/** Smallest scrim that clears AA, or null if even a heavy scrim will not. */
function minimumScrim(stops: Stops, mode: GlassMode): { peak: number; ratio: number } | null {
  for (let peak = 0; peak <= 0.62; peak += 0.02) {
    const ratio = worstHeroRatio(stops, mode, peak);
    if (ratio >= AA_THRESHOLD) return { peak: Number(peak.toFixed(2)), ratio };
  }
  return null;
}

export function resolveHero(stops: Stops): ResolvedHero {
  const candidates = (["onDark", "onLight"] as GlassMode[]).map((mode) => {
    const solved = minimumScrim(stops, mode);
    return { mode, solved, bare: worstHeroRatio(stops, mode, 0) };
  });

  // Prefer the polarity that needs the least help; if neither can be helped,
  // take whichever reads better bare so the failure is at least the smaller one.
  const solvable = candidates.filter((c) => c.solved);
  const winner = solvable.length
    ? solvable.reduce((a, b) => (a.solved!.peak <= b.solved!.peak ? a : b))
    : candidates.reduce((a, b) => (a.bare >= b.bare ? a : b));

  const g = GLASS[winner.mode];
  const peak = winner.solved?.peak ?? 0;
  const ratio = winner.solved?.ratio ?? winner.bare;

  return {
    mode: winner.mode,
    text: `rgba(${g.text.join(",")},${g.textA})`,
    textMuted: `rgba(${g.textMuted.join(",")},${g.textMutedA})`,
    scrimAlpha: peak,
    scrimColor: g.scrim,
    ratio,
    passesAA: ratio >= AA_THRESHOLD,
  };
}

/** CSS for the hero scrim overlay, or null when the sky needs none. */
export function heroScrimCss(hero: ResolvedHero): string | null {
  if (hero.scrimAlpha <= 0) return null;
  const c = hero.scrimColor.join(",");
  return (
    `linear-gradient(180deg, rgba(${c},${hero.scrimAlpha}) 0%, ` +
    `rgba(${c},${hero.scrimAlpha}) ${SCRIM_FLAT_UNTIL * 100}%, ` +
    `rgba(${c},0) ${SCRIM_ZERO_AT * 100}%)`
  );
}

/** All 28 skies, resolved once at module load. */
export const SKY_TOKENS: Record<Condition, Record<TimeOfDay, ResolvedSky>> = Object.fromEntries(
  CONDITIONS.map((c) => [
    c,
    Object.fromEntries(TIMES_OF_DAY.map((t) => [t, resolveSky(c, t)])) as Record<
      TimeOfDay,
      ResolvedSky
    >,
  ]),
) as Record<Condition, Record<TimeOfDay, ResolvedSky>>;

/**
 * Safe lookup. Every condition x time-of-day is defined, but a lookup that
 * returns undefined would throw inside render and blank the page — which is
 * exactly the failure mode CLAUDE.md forbids. Fall back loudly instead.
 */
export function skyFor(condition: Condition, timeOfDay: TimeOfDay): ResolvedSky {
  const sky = SKY_TOKENS[condition]?.[timeOfDay];
  if (sky) return sky;
  console.warn(
    `[Mausam] no sky token for "${condition}/${timeOfDay}" — falling back to overcast/day`,
  );
  return SKY_TOKENS.overcast.day;
}

/** Flat list for the audit surface / CI. */
export function auditSkyTable(): ResolvedSky[] {
  return CONDITIONS.flatMap((c) => TIMES_OF_DAY.map((t) => SKY_TOKENS[c][t]));
}

/* ------------------------------------------------------------------ *
 * 4. CSS custom properties.
 * ------------------------------------------------------------------ */

export type SkyVars = Record<string, string>;

/** Every glass value a component needs, as CSS custom properties. */
export function skyCssVars(
  condition: Condition,
  timeOfDay: TimeOfDay,
  flat = false,
): SkyVars {
  const sky = skyFor(condition, timeOfDay);
  const g = GLASS[sky.mode];
  const scrimA = flat ? GLASS_FLAT[sky.mode].scrimA : g.scrimA;
  const fillA = flat ? GLASS_FLAT[sky.mode].fillA : g.fillA;

  return {
    "--glass-scrim": `rgba(${g.scrim.join(",")},${scrimA})`,
    "--glass-fill": `rgba(${g.fill.join(",")},${fillA})`,
    "--glass-blur": `${flat ? BLUR.flat : BLUR.card}px`,
    "--sheet-blur": `${flat ? BLUR.flat : BLUR.sheet}px`,
    "--txt": `rgba(${g.text.join(",")},${g.textA})`,
    "--txt-2": `rgba(${g.textMuted.join(",")},${g.textMutedA})`,
    "--hair": g.hair,
    "--hair-strong": g.hairStrong,
    "--chip-on": g.chip,
    "--tab-scrim": g.tabScrim,
    "--hero-txt": sky.hero.text,
    "--hero-txt-2": sky.hero.textMuted,
  };
}

/* ------------------------------------------------------------------ *
 * 5. Motion.
 *
 * Every animated value in the app pulls from here. Framer Motion consumes
 * these objects directly — they are the configs, not approximations of them.
 * ------------------------------------------------------------------ */

export interface SpringConfig {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
}

export const SPRINGS = {
  /** Card enter and exit. */
  card: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  /** Reordering — snappier, because the user is driving it. */
  reorder: { type: "spring", stiffness: 420, damping: 38, mass: 1 },
  /** Card -> detail shared-element expand. */
  sheet: { type: "spring", stiffness: 300, damping: 34, mass: 1 },
  /** Pull-to-refresh release. */
  refresh: { type: "spring", stiffness: 200, damping: 22, mass: 1.1 },
  /** City name roll on location change. */
  heading: { type: "spring", stiffness: 340, damping: 32, mass: 0.8 },
} as const satisfies Record<string, SpringConfig>;

export type SpringName = keyof typeof SPRINGS;

/**
 * Non-spring timings. Only for things a spring genuinely cannot express —
 * a cross-fade has no overshoot to give it.
 */
export const TIMING = {
  /** Background cross-fade on sky change. Long on purpose: never a cut. */
  skyFade: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
  /** Opacity-only fades inside a card. */
  fade: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  /** Disclosure rows (the "Why this card" expander). */
  disclose: { duration: 0.44, ease: [0.4, 0, 0.2, 1] },
  /** Per-item stagger for a card stack entering. */
  stagger: 0.055,
} as const;

/* ------------------------------------------------------------------ *
 * 6. Typography.
 * ------------------------------------------------------------------ */

export const FONT_STACKS = {
  ui: '"Google Sans Flex", Figtree, -apple-system, Roboto, system-ui, sans-serif',
  mono: '"Google Sans Code", ui-monospace, "Cascadia Mono", Menlo, monospace',
} as const;

export interface TypeStep {
  size: number;
  weight: number;
  tracking: string;
  mono?: boolean;
  uppercase?: boolean;
}

export const TYPE: Record<string, TypeStep> = {
  brand: { size: 20, weight: 600, tracking: "-.028em" },
  display: { size: 74, weight: 250, tracking: "-.05em" },
  screenTitle: { size: 27, weight: 500, tracking: "-.03em" },
  readout: { size: 33, weight: 300, tracking: "-.038em" },
  cardTitle: { size: 16, weight: 600, tracking: "-.015em" },
  body: { size: 13.5, weight: 400, tracking: "0" },
  instrument: { size: 9.5, weight: 600, tracking: ".12em", mono: true, uppercase: true },
};

/* ------------------------------------------------------------------ *
 * 7. Semantic colour — IMD's own warning ramp.
 *
 * Deliberately disjoint from the brand accent so a colour-coded warning can
 * never be confused with ordinary chrome.
 * ------------------------------------------------------------------ */

export type WarningLevel = "green" | "yellow" | "orange" | "red";

export const WARNING_COLOR: Record<WarningLevel, string> = {
  green: "#188A4C",
  yellow: "#C9990C",
  orange: "#DE6C10",
  red: "#C92E22",
};

/** Filled warning surfaces (the pinned banner) need a darker pair. */
export const WARNING_SURFACE: Record<WarningLevel, [string, string]> = {
  green: ["#177A45", "#0F5730"],
  yellow: ["#A87E05", "#7F5D04"],
  orange: ["#C55F0C", "#9C4207"],
  red: ["#B3271C", "#851912"],
};

/* ------------------------------------------------------------------ *
 * 8. Map.
 * ------------------------------------------------------------------ */

export const MAP = {
  /**
   * OpenFreeMap — free, keyless, unmetered, MIT-licensed, self-hostable.
   * Explicitly not CARTO: their current licence restricts hosted basemap
   * tiles to enterprise / non-profit-grant customers.
   */
  styleUrl: "https://tiles.openfreemap.org/styles/dark",
  /** If the style does not arrive in this long, fall back to the static plate. */
  loadTimeoutMs: 6000,
  /** After the style loads, how long to wait for the first rendered frame. */
  tileGraceMs: 8000,
  /** Roughly mainland India, for both the live map and the static fallback. */
  bounds: { west: 67.5, east: 92.5, south: 6.5, north: 35.5 },
  fallbackBackground: "#0B1017",
  graticule: "rgba(150,175,200,.14)",
} as const;

/**
 * verify-tokens — proves the design study and the app share one set of values.
 *
 * design/mausam-home.html is a standalone artefact: it has to inline its own
 * copy of the sky table, the glass alphas and the spring configs, because it is
 * published as a single self-contained page. That makes drift possible, so this
 * script reads the values back out of the HTML and diffs them against
 * src/design/tokens.ts. Run by `npm run check`.
 *
 * If this fails, tokens.ts is the source of truth — update the HTML, not the TS.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  GLASS,
  GLASS_FLAT,
  SKY,
  SKY_TOKENS,
  SPRINGS,
  CONDITIONS,
  TIMES_OF_DAY,
  AA_THRESHOLD,
  measureHourChip,
} from "../src/design/tokens";
import { DICT, LANGUAGES } from "../src/i18n/dictionary";

const here = dirname(fileURLToPath(import.meta.url));
const PROTOTYPE = resolve(here, "../../design/mausam-home.html");

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

const html = readFileSync(PROTOTYPE, "utf8");

/** Pull a balanced `{ ... }` literal that follows a marker, and evaluate it. */
function literalAfter(marker: string): unknown {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`marker not found in prototype: ${marker}`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        const src = html.slice(open, i + 1);
        return new Function(`return (${src});`)();
      }
    }
  }
  throw new Error(`unbalanced literal after ${marker}`);
}

/* ---- 1. the sky table ---- */
type Stops = [number, string][];
const protoSky = literalAfter("const SKY = ") as Record<string, Record<string, Stops>>;

for (const c of CONDITIONS) {
  for (const t of TIMES_OF_DAY) {
    const mine = JSON.stringify(SKY[c][t]);
    const theirs = JSON.stringify(protoSky?.[c]?.[t]);
    if (mine !== theirs) fail(`SKY.${c}.${t}\n    tokens.ts : ${mine}\n    prototype : ${theirs}`);
  }
}

/* ---- 2. glass alphas ---- */
const protoGlass = literalAfter("const GLASS = ") as Record<
  string,
  { scrimA: number; fillA: number; txt2A: number }
>;
const protoFlat = literalAfter("const GLASS_FLAT = ") as Record<
  string,
  { scrimA: number; fillA: number }
>;

for (const mode of ["onDark", "onLight"] as const) {
  const a = GLASS[mode];
  const b = protoGlass[mode];
  if (a.scrimA !== b.scrimA) fail(`GLASS.${mode}.scrimA: ${a.scrimA} vs ${b.scrimA}`);
  if (a.fillA !== b.fillA) fail(`GLASS.${mode}.fillA: ${a.fillA} vs ${b.fillA}`);
  if (a.textMutedA !== b.txt2A) fail(`GLASS.${mode} muted alpha: ${a.textMutedA} vs ${b.txt2A}`);

  const fa = GLASS_FLAT[mode];
  const fb = protoFlat[mode];
  if (fa.scrimA !== fb.scrimA) fail(`GLASS_FLAT.${mode}.scrimA: ${fa.scrimA} vs ${fb.scrimA}`);
  if (fa.fillA !== fb.fillA) fail(`GLASS_FLAT.${mode}.fillA: ${fa.fillA} vs ${fb.fillA}`);
}

/* ---- 3. springs ---- */
const springBlock = html.slice(html.indexOf("const springs=["));
const springRe =
  /\{n:"spring\.(\w+)",\s*d:"[^"]*",\s*cfg:\{stiffness:(\d+),damping:(\d+),mass:([\d.]+)\}\}/g;

const protoSprings = new Map<string, { stiffness: number; damping: number; mass: number }>();
for (const m of springBlock.matchAll(springRe)) {
  protoSprings.set(m[1], {
    stiffness: Number(m[2]),
    damping: Number(m[3]),
    mass: Number(m[4]),
  });
}
if (protoSprings.size === 0) fail("no spring configs found in the prototype");

for (const [name, cfg] of protoSprings) {
  const mine = SPRINGS[name as keyof typeof SPRINGS];
  if (!mine) {
    fail(`prototype declares spring.${name}, tokens.ts does not`);
    continue;
  }
  if (mine.stiffness !== cfg.stiffness || mine.damping !== cfg.damping || mine.mass !== cfg.mass) {
    fail(
      `SPRINGS.${name}\n    tokens.ts : ${JSON.stringify({ stiffness: mine.stiffness, damping: mine.damping, mass: mine.mass })}` +
        `\n    prototype : ${JSON.stringify(cfg)}`,
    );
  }
}

/* ---- 4. contrast: every sky, both text contexts ---- */
let scrimmed = 0;
for (const c of CONDITIONS) {
  for (const t of TIMES_OF_DAY) {
    const sky = SKY_TOKENS[c][t];
    if (!sky.passesAA) {
      fail(
        `${c}/${t} glass text below AA — primary ${sky.audit.primary.toFixed(2)}:1, ` +
          `secondary ${sky.audit.secondary.toFixed(2)}:1 (need ${AA_THRESHOLD})`,
      );
    }
    if (!sky.hero.passesAA) {
      fail(`${c}/${t} bare hero text below AA — ${sky.hero.ratio.toFixed(2)}:1 (need ${AA_THRESHOLD})`);
    }
    if (sky.hero.scrimAlpha > 0) scrimmed++;
  }
}

/* ---- 5. contrast: the tinted hourly chips ----

   The hour strip paints a solar-factor tint over the glass, so it needs its own
   measurement: the card audit above never sees that layer. Sampled across the
   whole ramp, not just at its ends, because the ramp is piecewise and the worst
   reading is not guaranteed to sit at 0 or 1.

   Primary text only, and that is the finding rather than an omission: a muted
   role at 0.82 alpha measured 3.96:1 over this ramp, so the chips carry one
   text role and differentiate by size and weight instead. */
const TINT_SAMPLES = 24;
let worstChip = Infinity;
let worstChipAt = "";

for (const c of CONDITIONS) {
  for (const t of TIMES_OF_DAY) {
    const mode = SKY_TOKENS[c][t].mode;
    for (let i = 0; i <= TINT_SAMPLES; i++) {
      const factor = i / TINT_SAMPLES;
      const ratio = measureHourChip(SKY[c][t], mode, factor);
      if (ratio < worstChip) {
        worstChip = ratio;
        worstChipAt = `${c}/${t} ${mode} at solar factor ${factor.toFixed(2)}`;
      }
    }
  }
}

if (worstChip < AA_THRESHOLD) {
  fail(
    `tinted hour chip below AA — ${worstChip.toFixed(2)}:1 at ${worstChipAt} ` +
      `(need ${AA_THRESHOLD}). Pull HOUR_TINT_ALPHA down or move the ramp.`,
  );
}

/* ---- 6. the two dictionaries have to stay in step ----

   A missing Hindi key falls back to English at runtime, which is the right
   behaviour and the wrong thing to discover in a demo. This makes drift a build
   failure instead. It also checks that every literal `t("...")` in the source
   resolves — dynamic keys (`cond.${c}`) are template literals and are skipped,
   so this catches typos, not coverage. */
const dictKeys = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, new Set(Object.keys(DICT[l.id]))]),
) as Record<string, Set<string>>;

const base = dictKeys.en;
for (const l of LANGUAGES) {
  if (l.id === "en") continue;
  for (const k of base) {
    if (!dictKeys[l.id].has(k)) fail(`dictionary: "${k}" missing from ${l.english}`);
  }
  for (const k of dictKeys[l.id]) {
    if (!base.has(k)) fail(`dictionary: "${k}" is in ${l.english} but not English`);
  }
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

const SRC = resolve(here, "../src");
const literalKey = /\bt\(\s*"([a-z][\w.-]*)"/gi;
const referenced = new Set<string>();

for (const file of walk(SRC)) {
  if (file.includes("i18n")) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(literalKey)) referenced.add(m[1]);
}

for (const k of referenced) {
  if (!base.has(k)) fail(`dictionary: source calls t("${k}") but no such key exists`);
}

/* ---- 7. the CAP English in the dictionary must match seed.ts ----

   The dictionary carries an English copy of each warning so the two languages
   stay key-for-key. A copy is a drift risk, so it is diffed rather than
   trusted: reword a bulletin in seed.ts and this fails until the dictionary
   (and therefore the Hindi beside it) is updated too. */
const seedSrc = readFileSync(resolve(here, "../src/data/seed.ts"), "utf8");
const seedAlerts = new Map<string, { headline: string; body: string }>();
{
  const placeRe = /id: "(\w+)",/g;
  const marks: { id: string; at: number }[] = [];
  for (const m of seedSrc.matchAll(placeRe)) marks.push({ id: m[1], at: m.index ?? 0 });
  for (let i = 0; i < marks.length; i++) {
    const slice = seedSrc.slice(marks[i].at, marks[i + 1]?.at ?? seedSrc.length);
    const headline = /headline: "([^"]+)"/.exec(slice)?.[1];
    const body = /body:\s*\n?\s*"([^"]+)"/.exec(slice)?.[1];
    if (headline && body) seedAlerts.set(marks[i].id, { headline, body });
  }
}

if (seedAlerts.size === 0) fail("could not read any alert text out of data/seed.ts");

let capChecked = 0;
for (const [id, seeded] of seedAlerts) {
  for (const field of ["headline", "body"] as const) {
    const key = `capText.${id}.${field}`;
    const inDict = DICT.en[key];
    if (inDict === undefined) {
      fail(`CAP text: seed.ts has ${id}.${field} but the dictionary has no "${key}"`);
      continue;
    }
    if (inDict !== seeded[field]) {
      fail(
        `CAP text drift on "${key}"\n    seed.ts    : ${seeded[field]}\n    dictionary : ${inDict}`,
      );
    }
    capChecked++;
  }
}

/* ---- report ---- */
if (failures.length) {
  console.error(`\n  ${failures.length} token drift(s) between tokens.ts and the design study:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("\n  tokens.ts is the source of truth. Update design/mausam-home.html to match.\n");
  process.exit(1);
}

const skyCount = CONDITIONS.length * TIMES_OF_DAY.length;
console.log(
  `  tokens verified — ${skyCount} skies, ${Object.keys(GLASS).length} glass tiers, ` +
    `${protoSprings.size} springs match design/mausam-home.html`,
);
console.log(
  `  hour tint verified — ${skyCount * (TINT_SAMPLES + 1)} tint samples, ` +
    `worst ${worstChip.toFixed(2)}:1 at ${worstChipAt}`,
);
console.log(
  `  language verified — ${base.size} keys x ${LANGUAGES.length} languages in step; ` +
    `${referenced.size} literal keys referenced in src resolve; ` +
    `${capChecked} CAP strings match seed.ts`,
);
console.log(
  `  contrast verified — ${skyCount}/${skyCount} skies clear AA ${AA_THRESHOLD}:1 on glass and bare; ` +
    `${scrimmed} need a hero scrim`,
);

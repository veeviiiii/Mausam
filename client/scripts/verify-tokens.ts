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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  GLASS,
  GLASS_FLAT,
  SKY,
  SKY_TOKENS,
  SPRINGS,
  CONDITIONS,
  TIMES_OF_DAY,
  AA_THRESHOLD,
} from "../src/design/tokens";

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
  `  contrast verified — ${skyCount}/${skyCount} skies clear AA ${AA_THRESHOLD}:1 on glass and bare; ` +
    `${scrimmed} need a hero scrim`,
);

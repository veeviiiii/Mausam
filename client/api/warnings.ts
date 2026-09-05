import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * GET /api/warnings
 *
 * Live severe-weather warnings for the saved places, from NDMA's Sachet public
 * CAP feed.
 *
 * WHY NOT IMD DIRECTLY. IMD's own APIs need the calling server's IP on an
 * approved whitelist, which is a procurement timeline, not an afternoon. But
 * NDMA republishes the same bulletins — the ones IMD, the state SDMAs and CWC
 * actually issue — as public CAP 1.2 XML with no key and no whitelisting. The
 * `sender` field on each alert says which body issued it, so nothing is being
 * passed off as ours: a warning from `IMD-New-Delhi` is labelled as such.
 *
 * Self-contained, like api/aqi.ts, and for the same reason — see the note
 * there about ESM and ERR_MODULE_NOT_FOUND. `npm run check` enforces it.
 *
 * Never 500s. A failure is a 200 with ok:false, and the client keeps the seeded
 * warnings on screen. A severe-weather app that shows a broken screen instead
 * of a stale warning has failed at the only job that matters.
 */

const FEED = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";

/** CAP alerts arrive on issue, not on a schedule, so this is short. */
const TTL_MS = 5 * 60 * 1000;
/** A failure must not pin the app to seeded data for a whole refresh cycle. */
const FAIL_TTL_MS = 60 * 1000;

const FEED_TIMEOUT_MS = 6000;
const DETAIL_TIMEOUT_MS = 4000;
/** Whole-enrichment deadline, well inside a serverless execution budget. */
const ENRICH_BUDGET_MS = 7000;
/** Polite to Sachet, and fast enough: ~100 alerts finish in a couple of seconds. */
const CONCURRENCY = 12;

/**
 * Which districts belong to which saved place.
 *
 * Matched against the CAP `areaDesc`, which is a real district list
 * ("Chhotaudepur, Narmada, Valsad districts of Gujarat"), with the headline as
 * a fallback for alerts whose detail did not arrive inside the budget.
 *
 * Matching is word-boundary, not substring: "Dhar" (Madhya Pradesh) must not
 * match "Dharmapuri" (Tamil Nadu). That is not hypothetical — a naive
 * substring pass put a Tamil Nadu thunderstorm on the Indore card during
 * development.
 */
const DISTRICTS: Record<string, string[]> = {
  mumbai: ["Mumbai", "Mumbai City", "Mumbai Suburban", "Thane", "Raigad", "Palghar"],
  delhi: [
    "Delhi",
    "New Delhi",
    "Central Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "Shahdara",
    "Gautam Buddha Nagar",
    "Ghaziabad",
    "Gurugram",
    "Faridabad",
  ],
  chennai: ["Chennai", "Tiruvallur", "Kancheepuram", "Kanchipuram", "Chengalpattu"],
  kochi: ["Ernakulam", "Idukki", "Alappuzha", "Thrissur", "Kottayam", "Kochi"],
  vizag: ["Visakhapatnam", "Vizianagaram", "Srikakulam", "Anakapalli", "Alluri Sitharama Raju"],
  indore: ["Indore", "Dewas", "Ujjain", "Dhar", "Khargone", "Khandwa"],
};

type WarningLevel = "green" | "yellow" | "orange" | "red";
type AlertKind = "district" | "cyclone" | "flash-flood";

/** CAP severity is a four-value enum; IMD's public colour code is the same shape. */
const LEVEL: Record<string, WarningLevel> = {
  Extreme: "red",
  Severe: "orange",
  Moderate: "yellow",
  Minor: "green",
};

interface LiveAlert {
  kind: AlertKind;
  level: WarningLevel;
  headline: string;
  body: string;
  validUntil: string;
  issuingOffice: string;
  /** Sachet's own URL for the alert, so the claim is checkable. */
  href: string;
  event: string;
  areaDesc: string;
  sent: string;
}

interface Success {
  ok: true;
  alerts: Record<string, LiveAlert>;
  /** How many CAP entries the feed carried, for the provenance line. */
  scanned: number;
  matched: number;
  fetchedAt: string;
  source: "NDMA Sachet CAP feed";
}

interface Failure {
  ok: false;
  reason: string;
}

let cache: { at: number; value: Success | Failure } | null = null;

/* ------------------------------------------------------------------ *
 * Parsing. Deliberately regex, not an XML library.
 *
 * CAP here is a flat, machine-generated document with no mixed content and no
 * namespace surprises, and a dependency-free serverless route is worth more at
 * this scale than a general parser. Every extractor below tolerates a missing
 * field rather than throwing — a malformed alert is skipped, never fatal.
 * ------------------------------------------------------------------ */

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function tag(xml: string, name: string): string {
  // `cap:` prefixed in the detail documents, bare in the RSS.
  const m = new RegExp(`<(?:cap:)?${name}>([\\s\\S]*?)</(?:cap:)?${name}>`).exec(xml);
  return m ? decode(m[1]) : "";
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Word-boundary, case-insensitive. See the note on DISTRICTS. */
function mentions(haystack: string, needles: string[]): boolean {
  if (!haystack) return false;
  return needles.some((n) => new RegExp(`(?:^|[^\\p{L}])${escapeRe(n)}(?![\\p{L}])`, "iu").test(haystack));
}

function kindOf(event: string, headline: string): AlertKind {
  const s = `${event} ${headline}`.toLowerCase();
  if (/cyclone|depression|storm surge/.test(s)) return "cyclone";
  if (/flood/.test(s)) return "flash-flood";
  return "district";
}

/**
 * Has this alert already lapsed?
 *
 * The single most important filter here. An expired warning on screen is worse
 * than no warning: it is wrong, and it is wrong in the direction that gets
 * someone hurt or teaches them to ignore the banner. Sachet keeps recently
 * expired entries in the feed, so this is a live case, not a defensive one —
 * the first run of this route surfaced a Chennai bulletin that had lapsed an
 * hour earlier.
 */
function isLive(xml: string): boolean {
  if (!xml) return true; // headline-only fallback; no expiry to check against
  const status = tag(xml, "status");
  const msgType = tag(xml, "msgType");
  if (status && status !== "Actual") return false;
  if (msgType === "Cancel") return false;

  const expires = tag(xml, "expires");
  if (!expires) return true;
  const at = Date.parse(expires);
  return Number.isNaN(at) ? true : at > Date.now();
}

/** CAP timestamps are ISO with a +05:30 offset, so IST needs no conversion. */
function istUntil(expires: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(expires);
  if (!m) return expires || "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(m[2]) - 1] ?? m[2];
  return `${m[4]}:${m[5]} IST, ${m[3]} ${month}`;
}

/** "IMD-New-Delhi" -> "IMD New Delhi". The body's own name, never ours. */
const officeOf = (sender: string) => (sender || "NDMA Sachet").replace(/-/g, " ").trim();

const RANK: Record<WarningLevel, number> = { red: 4, orange: 3, yellow: 2, green: 1 };

async function getText(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "Mausam/0.1 (SIH26076 prototype)" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

/** Fixed-size worker pool; results in input order, failures as null. */
async function pool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<(T | null)[]> {
  const out: (T | null)[] = new Array(jobs.length).fill(null);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= jobs.length) return;
      try {
        out[i] = await jobs[i]();
      } catch {
        /* one alert failing to load is not the feed failing */
      }
    }
  });
  await Promise.all(workers);
  return out;
}

async function load(): Promise<Success | Failure> {
  let feed: string;
  try {
    feed = await getText(FEED, FEED_TIMEOUT_MS);
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      reason:
        e.name === "TimeoutError" || e.name === "AbortError"
          ? `Sachet did not answer within ${FEED_TIMEOUT_MS}ms`
          : `Sachet unreachable: ${e.message}`,
    };
  }

  const items = feed.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  if (!items.length) return { ok: false, reason: "Sachet feed carried no items" };

  const stubs = items
    .map((item) => ({
      headline: tag(item, "title"),
      href: tag(item, "link"),
    }))
    .filter((s) => s.headline && s.href);

  // Enrich under a wall-clock budget. Whatever arrives is used; anything that
  // does not falls back to headline-only matching rather than being dropped.
  const deadline = Date.now() + ENRICH_BUDGET_MS;
  const details = await pool(
    stubs.map((s) => async () => {
      if (Date.now() > deadline) return null;
      return getText(s.href, DETAIL_TIMEOUT_MS);
    }),
    CONCURRENCY,
  );

  const best = new Map<string, LiveAlert>();

  stubs.forEach((stub, i) => {
    const xml = details[i];
    if (xml && !isLive(xml)) return;

    const areaDesc = xml ? tag(xml, "areaDesc") : "";
    const event = xml ? tag(xml, "event") : "";
    const severity = xml ? tag(xml, "severity") : "";
    const headline = (xml && tag(xml, "headline")) || stub.headline;
    // These bulletins carry their prose in <headline>; <description> is absent
    // on every sample checked. Body is the bulletin plus its own instruction.
    const instruction = xml ? tag(xml, "instruction") : "";

    // areaDesc is the authoritative district list; the headline is the
    // fallback for anything the budget did not reach.
    const haystack = areaDesc || headline;

    for (const [placeId, districts] of Object.entries(DISTRICTS)) {
      if (!mentions(haystack, districts)) continue;

      const level = LEVEL[severity] ?? "yellow";
      const alert: LiveAlert = {
        kind: kindOf(event, headline),
        level,
        // Short enough to be a sheet title. The full district list is carried
        // separately as `areaDesc` and shown as its own row.
        headline: event || headline,
        body: [headline, instruction].filter(Boolean).join(" ").trim(),
        validUntil: istUntil(xml ? tag(xml, "expires") : ""),
        issuingOffice: officeOf(xml ? tag(xml, "sender") : ""),
        href: stub.href,
        event: event || "Weather warning",
        areaDesc: areaDesc || "—",
        sent: xml ? tag(xml, "sent") : "",
      };

      // Worst wins; on a tie, the one issued most recently.
      const held = best.get(placeId);
      if (!held || RANK[alert.level] > RANK[held.level] || (RANK[alert.level] === RANK[held.level] && alert.sent > held.sent)) {
        best.set(placeId, alert);
      }
    }
  });

  return {
    ok: true,
    alerts: Object.fromEntries(best),
    scanned: stubs.length,
    matched: best.size,
    fetchedAt: new Date().toISOString(),
    source: "NDMA Sachet CAP feed",
  };
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("content-type", "application/json; charset=utf-8");

  // Failures are never cached by the browser — see the note in api/aqi.ts.
  // An HTTP-cached failure sits underneath every retry the app can make.
  const headerFor = (ok: boolean) =>
    ok ? "public, max-age=120, stale-while-revalidate=600" : "no-store";

  const ttl = cache?.value.ok ? TTL_MS : FAIL_TTL_MS;
  if (cache && Date.now() - cache.at < ttl) {
    res.setHeader("cache-control", headerFor(cache.value.ok));
    res.statusCode = 200;
    res.end(JSON.stringify(cache.value));
    return;
  }

  const value = await load();
  cache = { at: Date.now(), value };

  res.setHeader("cache-control", headerFor(value.ok));
  res.statusCode = 200;
  res.end(JSON.stringify(value));
}

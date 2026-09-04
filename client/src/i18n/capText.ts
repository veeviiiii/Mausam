import type { Alert } from "../data/types";

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * The CAP warning text, translated where a translation exists.
 *
 * IMD publishes its CAP feed in English, so the seeded strings in data/seed.ts
 * are the English of record and stay the fallback: if a key is missing, the
 * user sees the real bulletin wording rather than a key or a blank. Hindi lives
 * in the dictionary under `capText.<placeId>.*`, and verify-tokens diffs the
 * English copies against seed.ts so a reworded bulletin cannot quietly leave
 * the Hindi behind.
 */
export function capText(placeId: string, alert: Alert, t: Translate) {
  const pick = (suffix: "headline" | "body", fallback: string) => {
    const key = `capText.${placeId}.${suffix}`;
    const value = t(key);
    return value === key ? fallback : value;
  };

  return {
    headline: pick("headline", alert.headline),
    body: pick("body", alert.body),
  };
}

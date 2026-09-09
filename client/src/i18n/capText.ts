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
  // A live bulletin is shown exactly as issued. The dictionary holds Hindi for
  // the SEEDED warning of the same city, and quietly swapping that in for a
  // different, real alert would put words in IMD's mouth. Untranslated and
  // true beats translated and wrong.
  if (alert.live) {
    return {
      headline: alert.headline,
      body: alert.body,
      validUntil: alert.validUntil,
      issuingOffice: alert.issuingOffice,
    };
  }

  const pick = (suffix: "headline" | "body" | "validUntil" | "issuingOffice", fallback: string) => {
    const key = `capText.${placeId}.${suffix}`;
    const value = t(key);
    return value === key ? fallback : value;
  };

  return {
    headline: pick("headline", alert.headline),
    body: pick("body", alert.body),
    // The expiry and the office are part of the bulletin's text too: a seeded
    // banner otherwise read "08:30 IST, 05 Sep · IMD Mumbai RMC" in the middle
    // of a Hindi sentence. Live bulletins keep both exactly as issued, for the
    // same reason the headline does.
    validUntil: pick("validUntil", alert.validUntil),
    issuingOffice: pick("issuingOffice", alert.issuingOffice),
  };
}

import type { Place } from "../data/types";

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * Seeded prose and seeded enums, in the reader's language.
 *
 * The dictionary already carried Hindi for the seeded CAP bulletins; everything
 * else the seed file holds — city names, the urban advisory, the Agromet
 * paragraph, the tourism outlook, the pollen and soil and waterlogging words —
 * was rendered straight out of `data/seed.ts` in English. In Hindi that
 * produced sentences that switched language mid-way: the commute card read
 * "18:30 की वापसी पर अधिक छींटे और कम दृश्यता। Hindmata and Sion junctions
 * typically hold water above 60 mm/day."
 *
 * Same contract as capText, for the same reason: the English in seed.ts is the
 * English OF RECORD and stays the fallback, so a missing key shows the real
 * seeded wording rather than a raw key or a blank. verify-tokens diffs the two
 * copies, so rewording seed.ts fails the build until the Hindi is updated too.
 *
 * What deliberately does NOT come through here: anything an upstream feed
 * issued. Live CPCB station names and live CAP bulletins are shown exactly as
 * published, because translating a real station's name or a real warning's
 * wording would put words in CPCB's and IMD's mouths. Untranslated and true
 * beats translated and wrong — the same rule capText already applies.
 */
export function seedText(t: Translate, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}

/**
 * A seeded value drawn from a small fixed set — "Very poor", "high",
 * "Saturated", "neap".
 *
 * Slugged rather than mapped by hand so adding a band to the seed is a
 * dictionary edit and nothing else: "Very poor" -> `aqiCat.veryPoor`.
 */
export function seedEnum(t: Translate, prefix: string, value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase());
  return seedText(t, `${prefix}.${slug}`, value);
}

/** The city's name, in script. Falls back to the seeded Latin spelling. */
export function placeName(t: Translate, place: Pick<Place, "id" | "name">): string {
  return seedText(t, `place.${place.id}`, place.name);
}

/** The reporting station under the city name — locality translated, code kept. */
export function stationName(t: Translate, place: Pick<Place, "id" | "station">): string {
  return seedText(t, `station.${place.id}`, place.station);
}

import type { TimeOfDay } from "../design/tokens";
import type { Place } from "../data/types";

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Time of day comes from the location's own sunrise/sunset, never the device
 * clock — a user checking a saved destination should see that destination's
 * day/night state. CLAUDE.md is explicit about this.
 */
export function timeOfDayFor(place: Place): TimeOfDay {
  const now = toMinutes(place.clock);
  const rise = toMinutes(place.sunrise);
  const set = toMinutes(place.sunset);

  if (now < rise - 30 || now > set + 40) return "night";
  if (now < rise + 50) return "dawn";
  if (now > set - 50) return "dusk";
  return "day";
}

/** The one-line derivation, shown so the choice is never mysterious. */
export function timeOfDayReason(place: Place, tod: TimeOfDay): string {
  switch (tod) {
    case "dawn":
      return `Dawn — sun rose at ${place.sunrise} IST in ${place.name}`;
    case "dusk":
      return `Dusk — sun sets at ${place.sunset} IST in ${place.name}`;
    case "night":
      return `Night — sun set at ${place.sunset} IST in ${place.name}`;
    default:
      return `Day — between ${place.sunrise} and ${place.sunset} IST in ${place.name}`;
  }
}

export function relativeAge(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min ago` : `${h} h ago`;
}

import { RADIUS, hourTintCss, skyFor, type Condition, type TimeOfDay } from "../design/tokens";
import type { HourlyPoint, Place } from "../data/types";
import { solarFactor } from "../lib/time";
import { useT } from "../i18n/context";
import { WeatherIcon } from "./WeatherIcon";

/**
 * The rolling 24-hour strip.
 *
 * Each chip is tinted by how much sun that hour actually gets — near-black
 * navy at 03:00, bright azure at 13:00 — so you can read night off the strip
 * without reading a single clock label. The factor comes from this location's
 * own sunrise and sunset, so a saved destination shows its night, not yours.
 *
 * Two constraints the tint had to survive, both measured rather than eyeballed
 * (see design/tokens.ts §10 and scripts/verify-tokens.ts):
 *
 *  - No backdrop-filter. Twenty-four blurred surfaces in one scroller would
 *    reintroduce exactly the compositor cost the blur audit removed. The tint
 *    sits on the same scrim+fill the cards use, minus the blur.
 *  - One text role. Over the full ramp the worst primary-text contrast is
 *    5.02:1, but a muted role at even 0.82 alpha falls to 3.96:1 — under AA.
 *    So every line on the chip is full-strength `--txt`, and the hierarchy is
 *    size and weight instead of opacity.
 */
export function HourlyCarousel({
  place,
  hours,
  condition,
  timeOfDay,
}: {
  place: Place;
  hours: HourlyPoint[];
  condition: Condition;
  timeOfDay: TimeOfDay;
}) {
  const t = useT();
  const mode = skyFor(condition, timeOfDay).mode;

  if (!hours.length) return null;

  return (
    <section className="pb-5 lg:pb-7">
      <h2 className="instrument on-sky px-6 pb-2 lg:px-0">{t("home.next24")}</h2>

      <div
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 lg:px-0"
        style={{ scrollSnapType: "x proximity" }}
      >
        {hours.map((h, i) => {
          const factor = solarFactor(h.time, place.sunrise, place.sunset);
          return (
            <div
              key={`${h.time}-${i}`}
              className="flex shrink-0 flex-col items-center gap-1.5 border px-3 py-2.5"
              style={{
                borderRadius: RADIUS.chip,
                scrollSnapAlign: "start",
                minWidth: 62,
                background: hourTintCss(factor, mode),
                borderColor: "var(--hair)",
                color: "var(--txt)",
              }}
            >
              <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em]">
                {i === 0 ? t("home.now") : h.time}
              </span>
              <WeatherIcon condition={h.condition} size={26} />
              <b className="tnum text-[14px] font-semibold">{h.temp}°</b>
              <span className="tnum font-mono text-[9px] font-semibold">{h.precipitation}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

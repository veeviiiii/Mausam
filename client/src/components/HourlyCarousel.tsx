import { RADIUS } from "../design/tokens";
import type { HourlyPoint } from "../data/types";
import { WeatherIcon } from "./WeatherIcon";

/**
 * The rolling 24-hour strip.
 *
 * Deliberately built on `.glass-chip` rather than `.glass`: twenty-four
 * backdrop-filter surfaces in one horizontal scroller would reintroduce
 * exactly the compositor cost the blur audit just removed. The chip surface
 * carries the same fill and hairline without the per-element blur pass.
 */
export function HourlyCarousel({ hours }: { hours: HourlyPoint[] }) {
  if (!hours.length) return null;

  return (
    <section className="pb-5 lg:pb-7">
      <h2 className="instrument on-sky px-6 pb-2 lg:px-0">Next 24 hours</h2>

      <div
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 lg:px-0"
        style={{ scrollSnapType: "x proximity" }}
      >
        {hours.map((h, i) => (
          <div
            key={`${h.time}-${i}`}
            className="glass-chip flex shrink-0 flex-col items-center gap-1.5 px-3 py-2.5"
            style={{
              borderRadius: RADIUS.chip,
              scrollSnapAlign: "start",
              minWidth: 62,
            }}
          >
            <span className="instrument !text-[8.5px] !tracking-[0.08em]">
              {i === 0 ? "Now" : h.time}
            </span>
            <WeatherIcon condition={h.condition} size={26} />
            <b className="tnum text-[14px] font-semibold">{h.temp}°</b>
            <span
              className="tnum font-mono text-[9px] font-semibold"
              style={{ opacity: h.precipitation >= 30 ? 0.9 : 0.35 }}
            >
              {h.precipitation}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

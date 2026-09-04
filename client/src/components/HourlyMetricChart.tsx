import { useState } from "react";
import { motion } from "framer-motion";
import { RADIUS } from "../design/tokens";
import { springCard } from "../animations/variants";
import type { HourlyMetric, HourlyPoint } from "../data/types";

/**
 * One chart, four metrics, a switcher instead of four stacked charts — which
 * is the clutter this replaces.
 *
 * Bars animate with `scaleY` from a bottom origin rather than by animating
 * `height`. Height is a layout property and cannot hold 60fps; a transform is
 * composited and can. Same reason the detail sheet defers its blur.
 */

const METRICS: {
  id: HourlyMetric;
  label: string;
  unit: string;
  /** Fixed ceilings where the scale is meaningful; null = scale to the data. */
  max: number | null;
  format: (v: number) => string;
}[] = [
  { id: "precipitation", label: "Rain", unit: "%", max: 100, format: (v) => `${v}%` },
  { id: "wind", label: "Wind", unit: "km/h", max: null, format: (v) => `${v} km/h` },
  { id: "humidity", label: "Humidity", unit: "%", max: 100, format: (v) => `${v}%` },
  { id: "uv", label: "UV", unit: "index", max: 11, format: (v) => `${v}` },
];

/** Every third hour — 24 bars is noise at phone width. */
const STEP = 3;

export function HourlyMetricChart({ hours }: { hours: HourlyPoint[] }) {
  const [metric, setMetric] = useState<HourlyMetric>("precipitation");
  if (!hours.length) return null;

  const active = METRICS.find((m) => m.id === metric)!;
  const points = hours.filter((_, i) => i % STEP === 0).slice(0, 8);
  const values = points.map((h) => h[metric]);
  const peak = Math.max(...values);
  const ceiling = active.max ?? Math.max(1, Math.ceil(peak * 1.15));
  const peakIndex = values.indexOf(peak);

  return (
    <section className="px-4 pb-2 lg:px-0">
      <div className="glass p-4" style={{ borderRadius: RADIUS.card }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="instrument">Next 24 hours · {active.label}</h2>

          <div className="flex flex-wrap gap-1">
            {METRICS.map((m) => {
              const on = m.id === metric;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMetric(m.id)}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    background: on ? "var(--chip-on)" : "transparent",
                    color: on ? "var(--txt)" : "var(--txt-2)",
                    border: `1px solid ${on ? "var(--hair)" : "transparent"}`,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex h-[92px] items-end gap-1.5">
          {values.map((v, i) => (
            <div key={`${metric}-${i}`} className="flex h-full flex-1 flex-col justify-end">
              <motion.div
                className="w-full rounded-t-[3px]"
                style={{
                  height: "100%",
                  transformOrigin: "bottom",
                  background: "var(--txt)",
                  opacity: i === peakIndex ? 0.85 : 0.32,
                }}
                initial={false}
                animate={{ scaleY: Math.max(0.02, v / ceiling) }}
                transition={{ ...springCard, delay: i * 0.015 }}
              />
            </div>
          ))}
        </div>

        <div
          className="mt-1.5 flex justify-between font-mono text-[8.5px]"
          style={{ color: "var(--txt-2)" }}
        >
          {points.map((h, i) => (
            <span key={`${h.time}-${i}`}>{i === 0 ? "Now" : h.time}</span>
          ))}
        </div>

        <p className="mt-2.5 text-[12.5px] leading-[1.42]" style={{ color: "var(--txt-2)" }}>
          Peaks at <b className="font-semibold">{active.format(peak)}</b>{" "}
          {peakIndex === 0 ? "right now" : `around ${points[peakIndex]?.time ?? "—"}`}
          {metric === "uv" && peak === 0 ? " — no UV after dark." : "."}
        </p>
      </div>
    </section>
  );
}

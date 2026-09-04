import { motion } from "framer-motion";
import { springCard } from "../../animations/variants";

/** Small in-card visualisations. All take their colour from the glass tokens. */

export function Bars({ values, highlight, axis }: { values: number[]; highlight?: number; axis?: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="mt-3 flex h-11 items-end gap-1">
        {values.map((v, i) => (
          <motion.i
            key={i}
            className="block flex-1 rounded-t-[3px] rounded-b-[1px]"
            style={{ background: "var(--txt)", opacity: i === highlight ? 0.85 : 0.3 }}
            initial={{ height: "6%" }}
            animate={{ height: `${Math.max(6, (v / max) * 100)}%` }}
            transition={{ ...springCard, delay: i * 0.02 }}
          />
        ))}
      </div>
      {axis ? (
        <div className="mt-1 flex justify-between font-mono text-[8px]" style={{ color: "var(--txt-2)" }}>
          {axis.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Band({
  segments,
  activeIndex,
  labels,
}: {
  segments: { color: string }[];
  activeIndex: number;
  labels: string[];
}) {
  return (
    <div>
      <div className="mt-3 flex h-[7px] gap-[2px] overflow-hidden rounded">
        {segments.map((s, i) => (
          <motion.i
            key={i}
            className="block flex-1 rounded-[2px]"
            style={{ background: s.color }}
            animate={{ opacity: i === activeIndex ? 1 : 0.28 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>
      <div
        className="mt-1.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.06em]"
        style={{ color: "var(--txt-2)" }}
      >
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export function Gauge({ percent }: { percent: number }) {
  return (
    <div className="chip-on mt-3 h-[9px] overflow-hidden rounded-[5px]">
      <motion.div
        className="h-full rounded-[5px]"
        style={{ background: "var(--txt)", opacity: 0.75 }}
        initial={{ width: "0%" }}
        animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        transition={springCard}
      />
    </div>
  );
}

export function Readout({ value, unit }: { value: string | number; unit: string }) {
  return (
    <div className="tnum text-[33px] font-light leading-[1.05] tracking-[-0.038em]">
      {value}
      <span className="ml-1 text-[13px] font-medium tracking-normal" style={{ color: "var(--txt-2)" }}>
        {unit}
      </span>
    </div>
  );
}

export function KeyValues({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-px">
          <b className="tnum text-[13.5px] font-semibold">{value}</b>
          <span className="instrument !text-[8.5px]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2.5 text-[12.5px] leading-[1.42]" style={{ color: "var(--txt-2)" }}>
      {children}
    </p>
  );
}

export function WindowPair({
  items,
}: {
  items: { label: string; value: string; caption: string }[];
}) {
  return (
    <div className="mt-3 flex gap-2.5">
      {items.map((it) => (
        <div key={it.label} className="chip-on hair flex-1 rounded-[14px] border p-2.5">
          <span className="instrument !text-[8.5px] !tracking-[0.1em]">{it.label}</span>
          <b className="tnum mt-0.5 block text-[16px] font-semibold">{it.value}</b>
          <span className="mt-px block text-[11px]" style={{ color: "var(--txt-2)" }}>
            {it.caption}
          </span>
        </div>
      ))}
    </div>
  );
}

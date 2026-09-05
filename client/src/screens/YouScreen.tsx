import { motion } from "framer-motion";
import { PERSONAS } from "../data/seed";
import { useApp } from "../state/AppState";
import { ScreenHeading } from "../components/ScreenHeading";
import { CONDITIONS, TIMES_OF_DAY, RADIUS } from "../design/tokens";
import { springCard } from "../animations/variants";
import { timeOfDayFor, timeOfDayReason } from "../lib/time";
import { useT } from "../i18n/context";
import { LanguagePicker } from "../components/LanguagePicker";

export function YouScreen() {
  const t = useT();
  const {
    personas,
    togglePersona,
    arrange,
    setArrange,
    flatGlass,
    setFlatGlass,
    offline,
    setOffline,
    place,
    condOverride,
    todOverride,
    setCondOverride,
    setTodOverride,
    isDerivedSky,
    timeOfDay,
    nowFor,
  } = useApp();

  return (
    <>
      <ScreenHeading title={t("screen.you.title")} blurb={t("screen.you.blurb")} />

      <div className="flex flex-wrap gap-2 px-4 pb-4 lg:px-0 lg:pb-5">
        {PERSONAS.map((p) => {
          const on = personas.includes(p.id);
          const full = personas.length >= 3 && !on;
          return (
            <motion.button
              key={p.id}
              type="button"
              aria-pressed={on}
              disabled={full}
              onClick={() => togglePersona(p.id)}
              whileTap={full ? undefined : { scale: 0.95 }}
              transition={springCard}
              className="glass-chip flex items-center gap-2 px-3 py-2.5 text-[12.5px] disabled:opacity-40"
              style={{
                borderRadius: RADIUS.chip,
                fontWeight: on ? 600 : 500,
                background: on ? "var(--chip-on)" : "var(--glass-fill)",
              }}
            >
              <span
                className="block h-[7px] w-[7px] rounded-full bg-current"
                style={{ opacity: on ? 1 : 0.3 }}
                aria-hidden
              />
              {t(`persona.${p.id}`)}
              {on ? <span className="instrument !text-[9px]">{personas.indexOf(p.id) + 1}</span> : null}
            </motion.button>
          );
        })}
      </div>

      <p className="instrument on-sky px-6 pb-5 lg:px-0 lg:pb-7">
        {t("screen.you.selected", { n: String(personas.length) })}
      </p>

      <SectionLabel>{t("you.language")}</SectionLabel>
      <LanguagePicker />

      <SectionLabel>{t("you.display")}</SectionLabel>
      <div className="flex flex-col gap-1.5 px-4 pb-5 lg:grid lg:max-w-[860px] lg:grid-cols-2 lg:gap-3 lg:px-0 lg:pb-8">
        <Toggle
          on={arrange}
          onChange={setArrange}
          title={t("you.arrange")}
          note={t("you.arrangeNote")}
        />
        <Toggle
          on={flatGlass}
          onChange={setFlatGlass}
          title={t("you.flat")}
          note={t("you.flatNote")}
        />
      </div>

      <SectionLabel>{t("you.demo")}</SectionLabel>
      <p className="sky-txt-2 max-w-[70ch] px-6 pb-2.5 text-[11.5px] leading-[1.45] lg:px-0">
        {t("you.demoNote")}
      </p>

      <div className="flex flex-col gap-1.5 px-4 pb-4 lg:max-w-[420px] lg:px-0 lg:pb-6">
        <Toggle
          on={offline}
          onChange={setOffline}
          title={t("you.offline")}
          note={t("you.offlineNote")}
        />
      </div>

      <div className="px-4 pb-3 lg:px-0">
        <p className="instrument on-sky pb-2">
          {isDerivedSky
            ? timeOfDayReason(place, timeOfDayFor(place, nowFor(place)), t)
            : t("you.skyOverridden")}
        </p>
        <ChipRow
          items={CONDITIONS.map((c) => ({ id: c, label: t(`cond.${c}`) }))}
          active={condOverride}
          onPick={(id) => setCondOverride(condOverride === id ? null : (id as never))}
        />
        <div className="h-2" />
        <ChipRow
          items={TIMES_OF_DAY.map((tod) => ({ id: tod, label: t(`tod.${tod}`) }))}
          active={todOverride}
          onPick={(id) => setTodOverride(todOverride === id ? null : (id as never))}
        />
        <p className="instrument on-sky pt-3">
          {t("you.nowShowing", { tod: t(`tod.${timeOfDay}`) })}
        </p>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="instrument on-sky px-6 pb-2 lg:px-0 lg:pb-3">{children}</h3>;
}

function ChipRow({
  items,
  active,
  onPick,
}: {
  items: { id: string; label: string }[];
  active: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={active === it.id}
          onClick={() => onPick(it.id)}
          className="glass-chip rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium"
          style={{ background: active === it.id ? "var(--chip-on)" : "transparent" }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  title,
  note,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="glass flex w-full items-center gap-3 px-3.5 py-3 text-left"
      style={{ borderRadius: RADIUS.chip }}
    >
      <span className="min-w-0 flex-1">
        <b className="block text-[13.5px] font-semibold">{title}</b>
        <small className="block text-[11.5px] leading-[1.4]" style={{ color: "var(--txt-2)" }}>
          {note}
        </small>
      </span>
      <span
        className="relative ml-auto block h-[22px] w-[38px] shrink-0 rounded-xl transition-colors"
        style={{ background: on ? "var(--txt)" : "var(--chip-on)" }}
      >
        <motion.span
          className="absolute left-[3px] top-[3px] block h-4 w-4 rounded-full"
          style={{ background: on ? "var(--glass-scrim)" : "var(--txt)" }}
          animate={{ x: on ? 16 : 0 }}
          transition={springCard}
        />
      </span>
    </button>
  );
}

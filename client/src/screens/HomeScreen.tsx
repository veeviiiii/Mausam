import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../state/AppState";
import { PLACES } from "../data/seed";
import { BrandHeader } from "../components/BrandHeader";
import { RollingText } from "../components/RollingText";
import { WeatherIcon } from "../components/WeatherIcon";
import { AlertBanner, NoAlerts } from "../components/AlertBanner";
import { HourlyCarousel } from "../components/HourlyCarousel";
import { HourlyMetricChart } from "../components/HourlyMetricChart";
import { SkeletonStack } from "../components/SkeletonCard";
import { PersonaCard } from "../features/cards/PersonaCard";
import { suppressedPersonas } from "../personalization/rules";

import { springCard, fade } from "../animations/variants";
import { relativeAge } from "../lib/time";
import { useMotionWindow } from "../lib/useMotionWindow";
import type { SheetTarget } from "../components/DetailSheet";
import { useT } from "../i18n/context";

export function HomeScreen({ onOpen }: { onOpen: (t: SheetTarget) => void }) {
  const tr = useT();
  const {
    place,
    condition,
    cards,
    personas,
    manualOrder,
    arrange,
    loading,
    offline,
    dataAgeMinutes,
    selectPlace,
    moveCard,
    timeOfDay,
    liveAqi,
  } = useApp();

  const suppressed = suppressedPersonas(place, personas);

  /**
   * Cards drop their blur while the stack is moving. Opened by any change to
   * the stack's membership or order, by entering arrange mode, and by a tap
   * (the press-scale and the sheet morph that follows are the same problem).
   */
  const [inMotion, beginMotion] = useMotionWindow();
  const stackSignature = cards.map((c) => c.id).join("|") + (arrange ? "|arrange" : "");
  useEffect(() => {
    beginMotion();
  }, [stackSignature, beginMotion]);

  return (
    <>
      {/* Brand and the location chips live in the side rail from `lg` up. */}
      <div className="lg:hidden">
        <BrandHeader />

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 pt-2">
          {PLACES.map((p) => {
            const active = p.id === place.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectPlace(p.id)}
                whileTap={{ scale: 0.95 }}
                transition={springCard}
                className="glass-chip flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px]"
                style={{
                  fontWeight: active ? 600 : 500,
                  background: active ? "var(--chip-on)" : "var(--glass-fill)",
                  borderColor: active ? "var(--hair-strong)" : "var(--hair)",
                }}
              >
                {active ? (
                  <svg viewBox="0 0 14 14" width={13} height={13} fill="none" aria-hidden="true">
                    <path
                      d="M7 1.6c2.2 0 4 1.8 4 4 0 2.9-4 6.8-4 6.8s-4-3.9-4-6.8c0-2.2 1.8-4 4-4Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <circle cx="7" cy="5.6" r="1.5" fill="currentColor" />
                  </svg>
                ) : null}
                {p.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Severe weather, pinned above everything persona-driven. */}
      <div className="px-4 pb-3 lg:px-0 lg:pb-5">
        {place.alert ? (
          <AlertBanner
            key={`${place.id}-alert`}
            alert={place.alert}
            place={place.name}
            placeId={place.id}
            onOpen={() => onOpen({ kind: "alert", placeId: place.id })}
          />
        ) : (
          <NoAlerts
            key={`${place.id}-none`}
            place={place.name}
            checked={relativeAge(dataAgeMinutes, tr)}
          />
        )}
      </div>

      {offline ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fade}
          className="mx-4 mb-3 flex items-center gap-2 rounded-[14px] border px-3 py-2 text-[12px] font-medium lg:mx-0 lg:mb-5"
          style={{
            background: "rgba(222,108,16,.24)",
            borderColor: "rgba(255,186,102,.44)",
            color: "var(--txt)",
          }}
        >
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#FFB466]" aria-hidden />
          {tr("home.offline", { age: relativeAge(dataAgeMinutes, tr) })}
        </motion.div>
      ) : null}

      {/* Current conditions */}
      <div className="sky-txt px-6 pb-5 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:px-0 lg:pb-8">
        <div className="lg:flex lg:items-end lg:gap-8">
          <div>
            <RollingText
              value={place.name}
              className="text-[27px] font-medium leading-[1.15] tracking-[-0.03em] lg:text-[40px]"
            />
            <div className="mt-2 flex items-start justify-between gap-3 lg:mt-1 lg:block">
              <div>
                <div className="tnum text-[74px] font-[250] leading-[0.94] tracking-[-0.05em] lg:text-[112px]">
                  {place.temp}
                  <sup className="relative left-0.5 top-[0.85em] align-top text-[25px] font-light lg:text-[34px]">
                    °C
                  </sup>
                </div>
                <div className="mt-1 text-[15px] font-medium lg:text-[18px]">
                  {tr(`cond.${condition}`)}
                </div>
                <div className="sky-txt-2 mt-0.5 text-[12.5px] lg:text-[14px]">
                  {place.station} · {tr("home.feelsLike", { v: String(place.feelsLike) })}
                </div>
              </div>
              <div className="lg:hidden">
                <WeatherIcon condition={condition} size={62} title={tr(`cond.${condition}`)} />
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:pb-6">
            <WeatherIcon condition={condition} size={104} title={tr(`cond.${condition}`)} />
          </div>
        </div>

        <div className="mt-4 flex gap-5 lg:mt-0 lg:gap-9 lg:pb-4">
          {[
            [tr("home.humidity"), `${place.humidity}%`],
            [tr("home.wind"), tr("unit.kmh", { v: String(place.wind) })],
            [tr("home.visibility"), `${place.visibility.toFixed(1)} km`],
            [tr("home.sunset"), place.sunset],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-px">
              <b className="tnum text-[14px] font-semibold lg:text-[19px]">{value}</b>
              <span className="instrument on-sky !text-[9px] lg:!text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <HourlyCarousel
        place={place}
        hours={place.hourly}
        condition={condition}
        timeOfDay={timeOfDay}
      />

      {/* Persona cards. One column on the phone, a grid on the laptop — the
          scoring order still reads left-to-right, top-to-bottom. */}
      {loading ? (
        <SkeletonStack count={Math.max(2, cards.length)} />
      ) : (
        <div
          data-motion={inMotion ? "on" : "off"}
          className="flex flex-col gap-3 px-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:px-0 2xl:grid-cols-3"
        >
          <AnimatePresence initial={false}>
            {cards.map((card, i) => (
              <PersonaCard
                key={card.id}
                card={card}
                place={place}
                index={i}
                total={cards.length}
                personaCount={personas.length}
                manualOrder={manualOrder}
                arrange={arrange}
                onOpen={() => onOpen({ kind: "card", id: card.id })}
                onMove={(dir) => moveCard(card.id, dir)}
                onPressStart={beginMotion}
                liveAqi={liveAqi !== null}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="pt-4 lg:pt-6">
        <HourlyMetricChart hours={place.hourly} />
      </div>

      {/* A suppressed persona still gets an explanation, never silence. */}
      {suppressed.length && !loading ? (
        <p className="sky-txt-2 mt-3 px-6 text-[11.5px] leading-[1.45] lg:mt-5 lg:px-0 lg:text-[12.5px]">
          {tr(suppressed.length > 1 ? "home.suppressedMany" : "home.suppressedOne", {
            names: suppressed.map((s) => tr(`persona.${s.id}`)).join(", "),
            place: place.name,
          })}
        </p>
      ) : null}
    </>
  );
}

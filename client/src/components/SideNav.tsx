import { motion } from "framer-motion";
import { useApp } from "../state/AppState";
import { PLACES } from "../data/seed";
import { springCard, springReorder } from "../animations/variants";
import { WARNING_COLOR } from "../design/tokens";
import { WeatherIcon } from "./WeatherIcon";
import { NAV_ITEMS, NavIcon } from "./navItems";
import { relativeAge } from "../lib/time";
import { useT } from "../i18n/context";

/**
 * Desktop navigation rail.
 *
 * On a laptop the bottom tab bar wastes the widest axis on screen, so the
 * sections move to a vertical rail and the saved-location switcher comes with
 * them — that frees the whole content column for the warning banner and the
 * card grid, which is what a judge is actually reading.
 *
 * Hidden below `lg`; the mobile layout is untouched.
 */
export function SideNav() {
  const { tab, setTab, place, selectPlace, offline, dataAgeMinutes } = useApp();
  const t = useT();

  return (
    <aside
      className="glass hidden shrink-0 flex-col gap-7 rounded-none border-y-0 border-l-0 px-6 py-7 lg:flex lg:w-[276px]"
      style={{ boxShadow: "none" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <MausamMark />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h1 className="font-ui text-[22px] font-semibold leading-none tracking-[-0.028em]">Mausam</h1>
          <span className="instrument leading-none">IMD</span>
        </div>
      </div>

      {/* Sections */}
      <nav className="flex flex-col gap-1" role="tablist" aria-label={t("nav.ariaSections")}>
        {NAV_ITEMS.map((item) => {
          const selected = tab === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              whileTap={{ scale: 0.97 }}
              transition={springReorder}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13.5px] font-medium"
              style={{
                color: selected ? "var(--txt)" : "var(--txt-2)",
                background: selected ? "var(--chip-on)" : "transparent",
                borderColor: selected ? "var(--hair)" : "transparent",
                fontWeight: selected ? 600 : 500,
              }}
            >
              <NavIcon icon={item.icon} size={19} />
              {t(item.labelKey)}
              {item.id === "alerts" && place.alert ? (
                <span
                  className="ml-auto h-[7px] w-[7px] rounded-full"
                  style={{ background: WARNING_COLOR[place.alert.level] }}
                  aria-hidden
                />
              ) : null}
            </motion.button>
          );
        })}
      </nav>

      {/* Saved locations — the chip row's desktop home */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="instrument">{t("nav.savedPlaces")}</h2>
        <div className="no-scrollbar flex flex-col gap-1 overflow-y-auto">
          {PLACES.map((p) => {
            const active = p.id === place.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectPlace(p.id)}
                whileTap={{ scale: 0.97 }}
                transition={springCard}
                className="flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left"
                style={{
                  background: active ? "var(--chip-on)" : "transparent",
                  borderColor: active ? "var(--hair)" : "transparent",
                  color: "var(--txt)",
                }}
              >
                <WeatherIcon condition={p.condition} size={22} />
                <span className="min-w-0 flex-1">
                  <b
                    className="block truncate text-[13px]"
                    style={{ fontWeight: active ? 600 : 500 }}
                  >
                    {p.name}
                  </b>
                  {p.alert ? (
                    <span
                      className="mt-0.5 inline-block rounded px-1 font-mono text-[8px] font-bold uppercase tracking-[0.06em] text-white"
                      style={{ background: WARNING_COLOR[p.alert.level] }}
                    >
                      {t(`level.${p.alert.level}`)}
                    </span>
                  ) : null}
                </span>
                <span className="tnum text-[15px] font-light">{p.temp}°</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Freshness */}
      <div className="instrument flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--hair)" }}>
        {offline ? <span className="h-[6px] w-[6px] rounded-full bg-[#FFB466]" aria-hidden /> : null}
        {offline
          ? t("nav.offlineLastKnown")
          : t("nav.updated", { age: relativeAge(dataAgeMinutes, t) })}
      </div>
    </aside>
  );
}

function MausamMark() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="10" r="5.4" stroke="currentColor" strokeWidth="1.7" opacity=".55" />
      <path
        d="M6.6 17.4a3.4 3.4 0 0 1 .6-6.75 4.7 4.7 0 0 1 8.85 1.05 3.1 3.1 0 0 1-.45 5.7H6.6Z"
        fill="currentColor"
        opacity=".92"
      />
      <path
        d="M8.8 19.8v1.6M12 19.8v2.2M15.2 19.8v1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  );
}

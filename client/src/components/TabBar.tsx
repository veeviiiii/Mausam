import { motion } from "framer-motion";
import { useApp } from "../state/AppState";
import { springReorder } from "../animations/variants";
import { NAV_ITEMS, NavIcon } from "./navItems";
import { useT } from "../i18n/context";

/**
 * Mobile navigation. Hidden from `lg` up, where SideNav takes over — a bottom
 * bar on a laptop wastes the widest axis the screen has.
 */
export function TabBar() {
  const { tab, setTab, place } = useApp();
  const tr = useT();
  const hasAlert = Boolean(place.alert);

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-[15] flex border-t px-3 pb-6 pt-2.5 lg:hidden"
      style={{
        borderColor: "var(--hair)",
        backgroundImage: "linear-gradient(to top, var(--tab-scrim) 58%, transparent)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
      role="tablist"
      aria-label={tr("nav.ariaSections")}
    >
      {NAV_ITEMS.map((t) => {
        const selected = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setTab(t.id)}
            className="relative flex flex-1 flex-col items-center gap-[3px] py-1 text-[9px] font-semibold tracking-[0.03em] transition-colors"
            style={{ color: selected ? "var(--txt)" : "var(--txt-2)" }}
          >
            <motion.span
              animate={{ y: selected ? -2 : 0, scale: selected ? 1.12 : 1 }}
              transition={springReorder}
              className="block"
            >
              <NavIcon icon={t.icon} />
            </motion.span>
            {t.id === "alerts" && hasAlert ? (
              <span
                className="absolute right-[26%] top-0 h-[7px] w-[7px] rounded-full"
                style={{ background: "#F5893A" }}
                aria-hidden
              />
            ) : null}
            {tr(t.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

import { AnimatePresence } from "framer-motion";
import { PLACES } from "../data/seed";
import { AlertBanner, NoAlerts } from "../components/AlertBanner";
import { ScreenHeading } from "../components/ScreenHeading";
import type { SheetTarget } from "../components/DetailSheet";
import { useT } from "../i18n/context";
import { relativeAge } from "../lib/time";
import { useApp } from "../state/AppState";

export function AlertsScreen({ onOpen }: { onOpen: (t: SheetTarget) => void }) {
  const t = useT();
  const { dataAgeMinutes } = useApp();
  const checked = relativeAge(dataAgeMinutes, t);
  const warned = PLACES.filter((p) => p.alert);
  const clear = PLACES.filter((p) => !p.alert);

  return (
    <>
      <ScreenHeading
        title={t("screen.alerts.title")}
        blurb={t("screen.alerts.blurb")}
      />

      <div className="flex flex-col gap-2.5 px-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:px-0">
        <AnimatePresence initial={false}>
          {warned.map((p) => (
            <AlertBanner
              key={p.id}
              alert={p.alert!}
              place={p.name}
              placeId={p.id}
              onOpen={() => onOpen({ kind: "alert", placeId: p.id })}
            />
          ))}
          {clear.map((p) => (
            <NoAlerts key={p.id} place={p.name} checked={checked} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

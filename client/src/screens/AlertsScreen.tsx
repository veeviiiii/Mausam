import { AnimatePresence } from "framer-motion";
import { PLACES } from "../data/seed";
import { AlertBanner, NoAlerts } from "../components/AlertBanner";
import { ScreenHeading } from "../components/ScreenHeading";
import type { SheetTarget } from "../components/DetailSheet";

export function AlertsScreen({ onOpen }: { onOpen: (t: SheetTarget) => void }) {
  const warned = PLACES.filter((p) => p.alert);
  const clear = PLACES.filter((p) => !p.alert);

  return (
    <>
      <ScreenHeading
        title="Warnings"
        blurb="Every CAP alert across your saved places — district warnings, cyclone bulletins and flash flood guidance, from one parser. These sit above your persona cards on the homepage too: a warning is never something you scroll to find."
      />

      <div className="flex flex-col gap-2.5 px-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:px-0">
        <AnimatePresence initial={false}>
          {warned.map((p) => (
            <AlertBanner
              key={p.id}
              alert={p.alert!}
              place={p.name}
              onOpen={() => onOpen({ kind: "alert", placeId: p.id })}
            />
          ))}
          {clear.map((p) => (
            <NoAlerts key={p.id} place={p.name} checked="4 min ago" />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

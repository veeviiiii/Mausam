import { useState } from "react";
import { motion } from "framer-motion";
import { RADIUS } from "../../design/tokens";
import {
  cardVariants,
  discloseCss,
  springCard,
} from "../../animations/variants";
import {
  CARD_RULES,
  explain,
  type ScoredCard,
} from "../../personalization/rules";
import type { Place } from "../../data/types";
import { CARD_UI } from "./registry";
import { useT } from "../../i18n/context";

interface Props {
  card: ScoredCard;
  place: Place;
  index: number;
  total: number;
  personaCount: number;
  manualOrder: string[];
  arrange: boolean;
  onOpen: () => void;
  onMove: (dir: "up" | "down") => void;
  /** Opens the stack's motion window so the press-scale is not blurred. */
  onPressStart?: () => void;
  /** True once CPCB has answered — the health card's label says which it is. */
  liveAqi?: boolean;
}

export function PersonaCard({
  card,
  place,
  index,
  total,
  personaCount,
  manualOrder,
  arrange,
  onOpen,
  onMove,
  onPressStart,
  liveAqi = false,
}: Props) {
  const t = useT();
  const [whyOpen, setWhyOpen] = useState(false);
  const rule = CARD_RULES[card.id];
  const ui = CARD_UI[card.id];
  const title = t(rule.titleKey);
  const segments = explain(card, place, personaCount, manualOrder as never, t);

  return (
    <motion.article
      // `layout` stays for reorder FLIP; `layoutId` is gone with the
      // card-to-sheet morph, which stretched the type while it animated.
      layout
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springCard}
      role={arrange ? undefined : "button"}
      tabIndex={arrange ? undefined : 0}
      onClick={arrange ? undefined : onOpen}
      onKeyDown={
        arrange
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }
      }
      onPointerDown={onPressStart}
      whileTap={arrange ? undefined : { scale: 0.975 }}
      className={`glass flex h-full flex-col px-4 pb-3.5 pt-4 ${arrange ? "" : "cursor-pointer"}`}
      style={{ borderRadius: RADIUS.card }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="none"
          className="shrink-0"
          aria-hidden="true"
        >
          {ui.icon}
        </svg>

        {arrange ? (
          <svg
            viewBox="0 0 12 12"
            width={13}
            height={13}
            fill="currentColor"
            className="shrink-0 opacity-50"
            aria-hidden="true"
          >
            <circle cx="4" cy="2.5" r="1.1" />
            <circle cx="8" cy="2.5" r="1.1" />
            <circle cx="4" cy="6" r="1.1" />
            <circle cx="8" cy="6" r="1.1" />
            <circle cx="4" cy="9.5" r="1.1" />
            <circle cx="8" cy="9.5" r="1.1" />
          </svg>
        ) : null}

        {/* The air card is the only one with a live feed today, so it is the
            only one whose label can be wrong. It says which number it holds. */}
        <span className="instrument min-w-0 flex-1 truncate">
          {t(card.id === "health" && !liveAqi ? "source.health.fallback" : rule.sourceKey)}
        </span>

        {arrange ? (
          <span className="ml-auto flex shrink-0 gap-1.5">
            <MoveButton dir="up" disabled={index === 0} label={title} onClick={() => onMove("up")} />
            <MoveButton
              dir="down"
              disabled={index === total - 1}
              label={title}
              onClick={() => onMove("down")}
            />
          </span>
        ) : (
          <span className="chip-on shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold">
            {t(`persona.${card.id}`)}
          </span>
        )}
      </div>

      <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.015em]">{title}</h3>

      <ui.Body place={place} />

      {arrange ? null : (
        <div className="mt-auto">
          <div
            className="mt-3 border-t pt-2.5"
            style={{ borderColor: "var(--hair)" }}
          >
            <button
              type="button"
              aria-expanded={whyOpen}
              onClick={(e) => {
                e.stopPropagation();
                setWhyOpen((v) => !v);
              }}
              className="instrument inline-flex items-center gap-1.5 !text-[9.5px]"
            >
              {t("why.heading")}
              <motion.svg
                viewBox="0 0 12 12"
                width={11}
                height={11}
                fill="none"
                animate={{ rotate: whyOpen ? 180 : 0 }}
                transition={springCard}
                aria-hidden="true"
              >
                <path
                  d="M2.5 4.5 6 8l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </button>

            <div
              className="grid"
              style={{
                gridTemplateRows: whyOpen ? "1fr" : "0fr",
                opacity: whyOpen ? 1 : 0,
                transition: `grid-template-rows ${discloseCss}, opacity ${discloseCss}`,
              }}
            >
              <div className="overflow-hidden">
                <p
                  className="pt-2 text-[12px] leading-[1.48]"
                  style={{ color: "var(--txt-2)" }}
                >
                  {segments.map((s, i) =>
                    s.kind === "value" ? (
                      <code
                        key={i}
                        className="chip-on rounded px-1.5 font-mono text-[11px]"
                        style={{ color: "var(--txt)" }}
                      >
                        {s.text}
                      </code>
                    ) : (
                      <span key={i}>{s.text}</span>
                    ),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}

function MoveButton({
  dir,
  disabled,
  label,
  onClick,
}: {
  dir: "up" | "down";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={t(dir === "up" ? "card.moveUp" : "card.moveDown", { label })}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="chip-on hair grid h-[26px] w-[26px] place-items-center rounded-lg border disabled:opacity-30"
      style={{ color: "var(--txt)" }}
    >
      <svg
        viewBox="0 0 12 12"
        width={12}
        height={12}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={dir === "up" ? "M2.5 7.5 6 4l3.5 3.5" : "M2.5 4.5 6 8l3.5-3.5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

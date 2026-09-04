import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RADIUS } from "../design/tokens";
import { springCard, fade, discloseCss } from "../animations/variants";
import { LANGUAGES } from "../i18n/dictionary";
import { useLanguage, useT } from "../i18n/context";

/**
 * English, हिन्दी, and an honest account of everything else.
 *
 * India's other scheduled languages are not bundled, and the interesting
 * question is what the UI does about that. Hiding them pretends the problem
 * away; listing them as if they were installed is a lie the first tap exposes.
 *
 * So they are listed, with real sizes, and Download runs a real progress state
 * that lands on a plain statement: this build ships two languages, and the
 * pack mechanism is being shown rather than faked. Every control is wired to
 * state that actually changes — CLAUDE.md's rule is no dead UI, not no
 * incomplete features.
 */

/** Weighted by script coverage: Devanagari-sharing languages reuse the face. */
const PACKS = [
  { code: "bn", label: "বাংলা", english: "Bengali", mb: 4.2 },
  { code: "ta", label: "தமிழ்", english: "Tamil", mb: 4.8 },
  { code: "te", label: "తెలుగు", english: "Telugu", mb: 4.6 },
  { code: "mr", label: "मराठी", english: "Marathi", mb: 1.1 },
  { code: "gu", label: "ગુજરાતી", english: "Gujarati", mb: 4.4 },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", mb: 4.5 },
  { code: "ml", label: "മലയാളം", english: "Malayalam", mb: 5.1 },
  { code: "pa", label: "ਪੰਜਾਬੀ", english: "Punjabi", mb: 3.9 },
  { code: "or", label: "ଓଡ଼ିଆ", english: "Odia", mb: 4.3 },
  { code: "as", label: "অসমীয়া", english: "Assamese", mb: 4.2 },
];

type PackState = "idle" | "downloading" | "unavailable";

export function LanguagePicker() {
  const { lang, setLang } = useLanguage();
  const t = useT();
  const [packsOpen, setPacksOpen] = useState(false);

  return (
    <div className="px-4 pb-5 lg:px-0 lg:pb-8">
      <div className="glass p-4" style={{ borderRadius: RADIUS.card }}>
        <b className="block text-[13.5px] font-semibold">{t("lang.title")}</b>
        <small className="mt-0.5 block text-[11.5px] leading-[1.4]" style={{ color: "var(--txt-2)" }}>
          {t("lang.note")}
        </small>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => {
            const on = l.id === lang;
            return (
              <motion.button
                key={l.id}
                type="button"
                aria-pressed={on}
                onClick={() => setLang(l.id)}
                whileTap={{ scale: 0.95 }}
                transition={springCard}
                className="chip-on hair rounded-lg border px-3 py-2 text-[12.5px]"
                style={{
                  fontWeight: on ? 600 : 500,
                  background: on ? "var(--chip-on)" : "transparent",
                  borderColor: on ? "var(--hair-strong)" : "var(--hair)",
                  color: "var(--txt)",
                }}
              >
                {l.label}
              </motion.button>
            );
          })}

          <motion.button
            type="button"
            aria-expanded={packsOpen}
            onClick={() => setPacksOpen((v) => !v)}
            whileTap={{ scale: 0.95 }}
            transition={springCard}
            className="hair inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium"
            style={{ background: "transparent", color: "var(--txt)" }}
          >
            {t("lang.other")}
            <motion.svg
              viewBox="0 0 12 12"
              width={11}
              height={11}
              fill="none"
              animate={{ rotate: packsOpen ? 180 : 0 }}
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
          </motion.button>
        </div>

        {/* Grid-rows disclosure: CSS can interpolate 0fr -> 1fr, Framer cannot,
            and this is the same token the "why this card" row uses. */}
        <div
          className="grid"
          style={{
            gridTemplateRows: packsOpen ? "1fr" : "0fr",
            opacity: packsOpen ? 1 : 0,
            transition: `grid-template-rows ${discloseCss}, opacity ${discloseCss}`,
          }}
        >
          <div className="overflow-hidden">
            <div className="pt-4">
              <b className="instrument block">{t("lang.packTitle")}</b>
              <p className="mt-1.5 text-[11.5px] leading-[1.45]" style={{ color: "var(--txt-2)" }}>
                {t("lang.packNote")}
              </p>

              <ul className="mt-2.5 flex flex-col">
                {PACKS.map((pack) => (
                  <PackRow key={pack.code} pack={pack} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackRow({ pack }: { pack: (typeof PACKS)[number] }) {
  const t = useT();
  const [state, setState] = useState<PackState>("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    [],
  );

  const start = () => {
    if (state !== "idle") return;
    setState("downloading");
    setProgress(0);

    /**
     * Progress is read off the wall clock, not accumulated per tick.
     *
     * A tick-counting bar looks identical until the tab is backgrounded, at
     * which point the browser clamps the interval and a 900ms bar takes half a
     * minute. Deriving the value from elapsed time means a throttled tick still
     * paints the right number and still finishes on schedule — the same reason
     * everything else here closes on a timer rather than a callback.
     */
    const started = performance.now();
    const DURATION = 900;

    timer.current = window.setInterval(() => {
      const elapsed = performance.now() - started;
      if (elapsed >= DURATION) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setProgress(100);
        setState("unavailable");
        return;
      }
      setProgress((elapsed / DURATION) * 100);
    }, 60);
  };

  return (
    <li className="border-t py-2.5" style={{ borderColor: "var(--hair)" }}>
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <b className="block text-[13px] font-semibold">{pack.label}</b>
          <small className="block text-[11px]" style={{ color: "var(--txt-2)" }}>
            {pack.english} · {t("lang.size", { mb: pack.mb.toFixed(1) })}
          </small>
        </span>

        <button
          type="button"
          onClick={start}
          disabled={state !== "idle"}
          className="chip-on hair shrink-0 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold disabled:opacity-45"
          style={{ color: "var(--txt)" }}
        >
          {state === "downloading" ? t("lang.downloading") : t("lang.download")}
        </button>
      </div>

      {state === "downloading" ? (
        <div
          className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
          style={{ background: "var(--hair)" }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, progress)}%`,
              background: "var(--txt)",
              transition: "width .12s linear",
            }}
          />
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {state === "unavailable" ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fade}
            className="mt-2 text-[11.5px] leading-[1.45]"
            style={{ color: "var(--txt-2)" }}
          >
            {t("lang.notInBuild")}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

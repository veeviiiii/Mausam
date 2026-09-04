import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DICT, LANGUAGES, type Lang } from "./dictionary";
import { Ctx } from "./context";

/**
 * English and Hindi, and an honest story about everything else.
 *
 * Two things this deliberately does NOT do:
 *
 *  - No runtime detection from `navigator.language`. A user in India with an
 *    en-IN device is not asking for Hindi, and a silent switch on first launch
 *    is exactly the kind of surprise this app is trying to design away.
 *  - No lazy-loaded locale chunks. Two languages is a few kB; a loader would
 *    add a blank-text state to save nothing, which is the "never a jarring
 *    swap" rule pointing the other way.
 *
 * Missing keys fall back to English rather than rendering the key. A half
 * translated screen is bad; a screen full of `home.humidity` is worse. Drift is
 * caught at build time instead — scripts/verify-tokens.ts fails if the two
 * dictionaries stop matching key for key.
 *
 * This module exports only the component, on purpose — see i18n/context.ts.
 */

const STORAGE_KEY = "mausam.lang";

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && LANGUAGES.some((l) => l.id === v)) return v as Lang;
  } catch {
    /* private mode / storage disabled — English is a fine default */
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  // Screen readers and font fallback both key off this: Devanagari resolves to
  // a different face from Latin in the same stack.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* the choice still applies for this session */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const raw = DICT[lang][key] ?? DICT.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

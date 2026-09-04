import { createContext, useContext } from "react";
import type { Lang } from "./dictionary";

/**
 * The context and its hooks, deliberately in their own module.
 *
 * React Fast Refresh can only hot-swap a module that exports components and
 * nothing else. When `useT` lived beside `<LanguageProvider>`, editing the
 * provider made Vite invalidate the module rather than refresh it — the new
 * module got a new `Ctx` object while already-mounted consumers still held the
 * old one, so every `useT()` in the tree threw "must be used inside
 * <LanguageProvider>" and the app went blank until a manual reload.
 *
 * Splitting the hooks out costs one file and makes editing the provider a
 * normal edit again.
 */

export interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

export const Ctx = createContext<LanguageCtx | null>(null);

export function useLanguage(): LanguageCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return v;
}

/** The common case: just the lookup function. */
export function useT() {
  return useLanguage().t;
}

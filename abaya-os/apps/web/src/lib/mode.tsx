'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Display mode. "simple" (default) shows the everyday essentials with plain wording;
 * "pro" reveals every module, field and technical detail. Purely presentational —
 * permissions are still enforced by the API.
 */
export type UiMode = 'simple' | 'pro';
const KEY = 'abaya-ui-mode';
const Ctx = createContext<{ mode: UiMode; pro: boolean; setMode: (m: UiMode) => void }>({ mode: 'simple', pro: false, setMode: () => undefined });

export function UiModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<UiMode>('simple');
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === 'pro' || saved === 'simple') setModeState(saved);
  }, []);
  const setMode = useCallback((m: UiMode) => {
    window.localStorage.setItem(KEY, m);
    setModeState(m);
  }, []);
  return <Ctx.Provider value={{ mode, pro: mode === 'pro', setMode }}>{children}</Ctx.Provider>;
}

export const useUiMode = () => useContext(Ctx);

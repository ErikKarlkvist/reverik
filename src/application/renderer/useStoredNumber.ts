import { useCallback, useState } from 'react';

/** Tal i localStorage, t.ex. en panelstorlek. Tål att localStorage saknas. */
export function useStoredNumber(key: string, initial: number): [number, (next: number) => void] {
  const [value, setValue] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem(key));
      return Number.isFinite(stored) && stored > 0 ? stored : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: number) => {
      setValue(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // ingen lagring, värdet gäller ändå för sessionen
      }
    },
    [key],
  );

  return [value, set];
}

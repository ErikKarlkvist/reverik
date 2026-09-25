import { useCallback, useState } from 'react';

/** Boolean i localStorage, t.ex. om en panel är öppen. Tål att localStorage saknas. */
export function useStoredFlag(key: string, initial: boolean): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : stored === 'true';
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: boolean) => {
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

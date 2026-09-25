import { useCallback, useState } from 'react';
import { readStored, writeStored } from './storage';

/** Ett val ur en fast lista, sparat i localStorage. Okända värden faller tillbaka på `initial`. */
export function useStoredChoice<T extends string>(
  key: string,
  options: readonly T[],
  initial: T,
): [T, (next: string) => void] {
  const parse = (value: string | null): T =>
    value !== null && (options as readonly string[]).includes(value) ? (value as T) : initial;
  const [value, setValue] = useState<T>(() => parse(readStored(key)));

  const set = useCallback(
    (next: string) => {
      const parsed = parse(next);
      setValue(parsed);
      writeStored(key, parsed);
    },
    // parse beror bara på options och initial, som är konstanta per anrop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, set];
}

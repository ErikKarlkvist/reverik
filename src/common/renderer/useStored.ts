import { useCallback, useState } from 'react';
import { readStored, writeStored } from './storage';

/**
 * Små hooks för värden som ska överleva en omstart: paneler, storlekar,
 * val ur en fast lista. Alla tål att localStorage saknas.
 */

export function useStoredFlag(key: string, initial: boolean): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    const stored = readStored(key);
    return stored === null ? initial : stored === 'true';
  });
  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      writeStored(key, String(next));
    },
    [key],
  );
  return [value, set];
}

export function useStoredNumber(key: string, initial: number): [number, (next: number) => void] {
  const [value, setValue] = useState<number>(() => {
    const stored = Number(readStored(key));
    return Number.isFinite(stored) && stored > 0 ? stored : initial;
  });
  const set = useCallback(
    (next: number) => {
      setValue(next);
      writeStored(key, String(next));
    },
    [key],
  );
  return [value, set];
}

/** Ett val ur en fast lista. Okända värden faller tillbaka på `initial`. */
export function useStoredChoice<T extends string>(
  key: string,
  options: readonly T[],
  initial: T,
): [T, (next: string) => void] {
  const parse = useCallback(
    (value: string | null): T =>
      value !== null && (options as readonly string[]).includes(value) ? (value as T) : initial,
    [options, initial],
  );
  const [value, setValue] = useState<T>(() => parse(readStored(key)));
  const set = useCallback(
    (next: string) => {
      const parsed = parse(next);
      setValue(parsed);
      writeStored(key, parsed);
    },
    [key, parse],
  );
  return [value, set];
}

import { useCallback, useEffect, useState } from 'react';
import { invokeChannel } from '@/common/renderer/ipc';
import { deleteAnalysisChannel, listAnalysesChannel } from '../../ipc/channels';
import { type SavedAnalysis } from '../../model/analysis';

export interface AnalysisState {
  analyses: SavedAnalysis[];
  current: SavedAnalysis | null;
  error: string | null;
  select: (id: string | null) => void;
  remove: (id: string) => Promise<void>;
}

interface Loaded {
  repoPath: string;
  list: SavedAnalysis[];
}

interface Tagged<T> {
  repoPath: string;
  value: T;
}

/**
 * Listan följer repot. Allt state taggas med repots sökväg och härleds mot det
 * aktuella repot, så byte av repo ger tom lista och inget val utan att något
 * behöver nollställas i en effekt.
 */
export function useAnalysisState(repoPath: string | null): AnalysisState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selection, setSelection] = useState<Tagged<string> | null>(null);
  const [loadError, setLoadError] = useState<Tagged<string> | null>(null);

  useEffect(() => {
    if (!repoPath) return;
    let cancelled = false;
    invokeChannel(listAnalysesChannel, { repoPath })
      .then((list) => {
        if (!cancelled) setLoaded({ repoPath, list });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLoadError({ repoPath, value: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [repoPath]);

  const analyses = loaded?.repoPath === repoPath ? loaded.list : [];
  const error = loadError?.repoPath === repoPath ? loadError.value : null;
  const currentId = selection?.repoPath === repoPath ? selection.value : null;

  const select = useCallback(
    (id: string | null) => {
      setSelection(id && repoPath ? { repoPath, value: id } : null);
    },
    [repoPath],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!repoPath) return;
      const list = await invokeChannel(deleteAnalysisChannel, { repoPath, id });
      setLoaded({ repoPath, list });
      setSelection((current) => (current?.value === id ? null : current));
    },
    [repoPath],
  );

  const current = analyses.find((a) => a.id === currentId) ?? null;
  return { analyses, current, error, select, remove };
}

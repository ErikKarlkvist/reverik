import { useCallback, useEffect, useMemo, useState } from 'react';
import { invokeChannel } from '@/common/renderer/ipc';
import { readStoredJson, writeStored } from '@/common/renderer/storage';
import { useIpcEvent } from '@/common/renderer/useIpcEvent';
import {
  deleteAnalysisChannel,
  type InboxEvent,
  inboxEvent,
  listAnalysesChannel,
  watchInboxChannel,
} from '../../ipc/channels';
import { type SavedAnalysis } from '../../model/analysis';

/** En rad i inkorgens logg: en import eller ett avvisat försök. */
export type InboxEntry = { at: string } & (
  | { type: 'imported'; file: string; title: string; id: string }
  | { type: 'rejected'; file: string; errors: string[] }
);

/** En arbetsyta: en flik med en vald analys, eller tom. */
export interface Workspace {
  id: number;
  analysisId: string | null;
}

export interface AnalysisState {
  analyses: SavedAnalysis[];
  /** Analysen i den aktiva arbetsytan */
  current: SavedAnalysis | null;
  error: string | null;
  /** Nyast först */
  inbox: InboxEntry[];
  /** Senaste avvisade filen, tills något importeras eller användaren stänger den */
  rejection: InboxEntry | null;
  workspaces: Workspace[];
  activeWorkspaceId: number;
  /** Väljer analys i den aktiva arbetsytan */
  select: (id: string | null) => void;
  remove: (id: string) => Promise<void>;
  dismissRejection: () => void;
  openWorkspace: (analysisId?: string) => void;
  closeWorkspace: (id: number) => void;
  activateWorkspace: (id: number) => void;
  analysisFor: (workspace: Workspace) => SavedAnalysis | null;
}

interface Loaded {
  repoPath: string;
  list: SavedAnalysis[];
}

interface Tagged<T> {
  repoPath: string;
  value: T;
}

interface Workspaces {
  list: Workspace[];
  active: number;
  next: number;
}

const workspacesKey = (repoPath: string): string => `highai.workspaces:${repoPath}`;

function isWorkspaces(value: unknown): value is Workspaces {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<Workspaces>;
  return (
    Array.isArray(v.list) &&
    v.list.every((w: unknown) => typeof w === 'object' && w !== null && 'id' in w) &&
    typeof v.active === 'number' &&
    typeof v.next === 'number'
  );
}

const FRESH: Workspaces = { list: [{ id: 1, analysisId: null }], active: 1, next: 2 };

/**
 * Listan följer repot. Allt state taggas med repots sökväg och härleds mot det
 * aktuella repot, så byte av repo ger tom lista och inget val utan att något
 * behöver nollställas i en effekt. Arbetsytorna sparas per repo och återtas
 * vid start, med analyser som inte längre finns bortplockade.
 */
export function useAnalysisState(repoPath: string | null): AnalysisState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [spaces, setSpaces] = useState<Tagged<Workspaces> | null>(null);
  const [loadError, setLoadError] = useState<Tagged<string> | null>(null);
  const [inboxLog, setInboxLog] = useState<Tagged<InboxEntry[]> | null>(null);
  const [rejectionState, setRejection] = useState<Tagged<InboxEntry> | null>(null);

  useEffect(() => {
    if (!repoPath) return;
    let cancelled = false;
    const fail = (e: unknown): void => {
      if (!cancelled) setLoadError({ repoPath, value: e instanceof Error ? e.message : String(e) });
    };
    invokeChannel(listAnalysesChannel, { repoPath })
      .then((list) => {
        if (cancelled) return;
        setLoaded({ repoPath, list });
        // Återta arbetsytorna som var öppna senast, utan analyser som försvunnit.
        const stored = readStoredJson(workspacesKey(repoPath), isWorkspaces);
        const ids = new Set(list.map((a) => a.id));
        const restored: Workspaces | null = stored
          ? {
              ...stored,
              list: stored.list.map((w) => ({
                id: w.id,
                analysisId: w.analysisId !== null && ids.has(w.analysisId) ? w.analysisId : null,
              })),
            }
          : null;
        setSpaces({ repoPath, value: restored && restored.list.length > 0 ? restored : FRESH });
      })
      .catch(fail);
    invokeChannel(watchInboxChannel, { repoPath }).catch(fail);
    return () => {
      cancelled = true;
    };
  }, [repoPath]);

  /** Uppdaterar arbetsytorna för aktuellt repo och sparar dem. */
  const updateSpaces = useCallback(
    (update: (current: Workspaces) => Workspaces) => {
      if (!repoPath) return;
      setSpaces((tagged) => {
        const base = tagged?.repoPath === repoPath ? tagged.value : FRESH;
        const next = update(base);
        writeStored(workspacesKey(repoPath), JSON.stringify(next));
        return { repoPath, value: next };
      });
    },
    [repoPath],
  );

  const select = useCallback(
    (id: string | null) => {
      updateSpaces((ws) => ({
        ...ws,
        list: ws.list.map((w) => (w.id === ws.active ? { ...w, analysisId: id } : w)),
      }));
    },
    [updateSpaces],
  );

  const onInbox = useCallback(
    (event: InboxEvent) => {
      if (event.repoPath !== repoPath) return;
      const at = new Date().toISOString();
      const entry: InboxEntry =
        event.type === 'imported'
          ? {
              at,
              type: 'imported',
              file: event.file,
              title: event.analysis.flow.title,
              id: event.analysis.id,
            }
          : { at, type: 'rejected', file: event.file, errors: event.errors };
      setInboxLog((log) => ({
        repoPath,
        value: [entry, ...(log?.repoPath === repoPath ? log.value : [])],
      }));
      if (event.type === 'imported') {
        setLoaded({ repoPath, list: event.list });
        select(event.analysis.id);
        setRejection(null);
      } else {
        setRejection({ repoPath, value: entry });
      }
    },
    [repoPath, select],
  );
  useIpcEvent(inboxEvent, onInbox);

  const analyses = useMemo(
    () => (loaded?.repoPath === repoPath ? loaded.list : []),
    [loaded, repoPath],
  );
  const error = loadError?.repoPath === repoPath ? loadError.value : null;
  const inbox = inboxLog?.repoPath === repoPath ? inboxLog.value : [];
  const rejection = rejectionState?.repoPath === repoPath ? rejectionState.value : null;
  const workspaces = spaces?.repoPath === repoPath ? spaces.value : FRESH;

  const analysisFor = useCallback(
    (workspace: Workspace): SavedAnalysis | null =>
      analyses.find((a) => a.id === workspace.analysisId) ?? null,
    [analyses],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!repoPath) return;
      const list = await invokeChannel(deleteAnalysisChannel, { repoPath, id });
      setLoaded({ repoPath, list });
      updateSpaces((ws) => ({
        ...ws,
        list: ws.list.map((w) => (w.analysisId === id ? { ...w, analysisId: null } : w)),
      }));
    },
    [repoPath, updateSpaces],
  );

  const dismissRejection = useCallback(() => {
    setRejection(null);
  }, []);

  const openWorkspace = useCallback(
    (analysisId?: string) => {
      updateSpaces((ws) => ({
        list: [...ws.list, { id: ws.next, analysisId: analysisId ?? null }],
        active: ws.next,
        next: ws.next + 1,
      }));
    },
    [updateSpaces],
  );

  const closeWorkspace = useCallback(
    (id: number) => {
      updateSpaces((ws) => {
        if (ws.list.length <= 1) return { ...ws, list: [{ id: ws.active, analysisId: null }] };
        const index = ws.list.findIndex((w) => w.id === id);
        const list = ws.list.filter((w) => w.id !== id);
        const active =
          ws.active === id ? (list[Math.max(0, index - 1)]?.id ?? ws.active) : ws.active;
        return { ...ws, list, active };
      });
    },
    [updateSpaces],
  );

  const activateWorkspace = useCallback(
    (id: number) => {
      updateSpaces((ws) => (ws.list.some((w) => w.id === id) ? { ...ws, active: id } : ws));
    },
    [updateSpaces],
  );

  const activeWorkspace = workspaces.list.find((w) => w.id === workspaces.active) ?? null;
  const current = activeWorkspace ? analysisFor(activeWorkspace) : null;

  return {
    analyses,
    current,
    error,
    inbox,
    rejection,
    workspaces: workspaces.list,
    activeWorkspaceId: workspaces.active,
    select,
    remove,
    dismissRejection,
    openWorkspace,
    closeWorkspace,
    activateWorkspace,
    analysisFor,
  };
}

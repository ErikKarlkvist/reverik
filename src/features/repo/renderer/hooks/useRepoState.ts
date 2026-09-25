import { useCallback, useEffect, useState } from 'react';
import { invokeChannel } from '@/common/renderer/ipc';
import { useIpcEvent } from '@/common/renderer/useIpcEvent';
import {
  type CloneProgress,
  cloneProgressEvent,
  cloneRepoChannel,
  forgetRepoChannel,
  listRecentReposChannel,
  openRepoChannel,
  pickLocalRepoChannel,
} from '../../ipc/channels';
import { type RepoInfo } from '../../model/repo';

export interface RepoState {
  repo: RepoInfo | null;
  recent: RepoInfo[];
  busy: boolean;
  error: string | null;
  cloneProgress: CloneProgress | null;
  pickLocal: () => Promise<void>;
  clone: (url: string) => Promise<void>;
  open: (path: string) => Promise<void>;
  forget: (path: string) => Promise<void>;
  clearError: () => void;
}

export function useRepoState(): RepoState {
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [recent, setRecent] = useState<RepoInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneProgress, setCloneProgress] = useState<CloneProgress | null>(null);

  useEffect(() => {
    void invokeChannel(listRecentReposChannel, undefined).then(setRecent);
  }, []);

  useIpcEvent(cloneProgressEvent, setCloneProgress);

  const run = useCallback(async (task: () => Promise<RepoInfo | null>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await task();
      if (result) {
        setRepo(result);
        setRecent(await invokeChannel(listRecentReposChannel, undefined));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setCloneProgress(null);
    }
  }, []);

  const pickLocal = useCallback(
    () => run(() => invokeChannel(pickLocalRepoChannel, undefined)),
    [run],
  );
  const clone = useCallback(
    (url: string) => run(() => invokeChannel(cloneRepoChannel, { url })),
    [run],
  );
  const open = useCallback(
    (path: string) => run(() => invokeChannel(openRepoChannel, { path })),
    [run],
  );
  const forget = useCallback(async (path: string) => {
    setRecent(await invokeChannel(forgetRepoChannel, { path }));
    setRepo((current) => (current?.path === path ? null : current));
  }, []);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { repo, recent, busy, error, cloneProgress, pickLocal, clone, open, forget, clearError };
}

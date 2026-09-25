import { useCallback, useEffect, useState } from 'react';
import { invokeChannel } from '@/common/renderer/ipc';
import { readStored, writeStored } from '@/common/renderer/storage';
import {
  forgetRepoChannel,
  listRecentReposChannel,
  openDemoRepoChannel,
  openRepoChannel,
  pickLocalRepoChannel,
} from '../../ipc/channels';
import { type RepoInfo } from '../../model/repo';

export interface RepoState {
  repo: RepoInfo | null;
  recent: RepoInfo[];
  busy: boolean;
  error: string | null;
  pickLocal: () => Promise<void>;
  openDemo: () => Promise<void>;
  open: (path: string) => Promise<void>;
  forget: (path: string) => Promise<void>;
  clearError: () => void;
}

const LAST_REPO_KEY = 'highai.lastRepo';

export function useRepoState(): RepoState {
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [recent, setRecent] = useState<RepoInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<RepoInfo | null>, quiet = false) => {
    setBusy(true);
    setError(null);
    try {
      const result = await task();
      if (result) {
        setRepo(result);
        writeStored(LAST_REPO_KEY, result.path);
        setRecent(await invokeChannel(listRecentReposChannel, undefined));
      }
    } catch (e) {
      if (quiet) writeStored(LAST_REPO_KEY, null);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  // Vid start: hämta listan och öppna repot som var valt senast, tyst om det försvunnit.
  useEffect(() => {
    void invokeChannel(listRecentReposChannel, undefined).then((list) => {
      setRecent(list);
      const last = readStored(LAST_REPO_KEY);
      if (last) void run(() => invokeChannel(openRepoChannel, { path: last }), true);
    });
  }, [run]);

  const pickLocal = useCallback(
    () => run(() => invokeChannel(pickLocalRepoChannel, undefined)),
    [run],
  );
  const openDemo = useCallback(
    () => run(() => invokeChannel(openDemoRepoChannel, undefined)),
    [run],
  );
  const open = useCallback(
    (path: string) => run(() => invokeChannel(openRepoChannel, { path })),
    [run],
  );
  const forget = useCallback(async (path: string) => {
    setRecent(await invokeChannel(forgetRepoChannel, { path }));
    setRepo((current) => (current?.path === path ? null : current));
    if (readStored(LAST_REPO_KEY) === path) writeStored(LAST_REPO_KEY, null);
  }, []);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { repo, recent, busy, error, pickLocal, openDemo, open, forget, clearError };
}

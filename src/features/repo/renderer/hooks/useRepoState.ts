import { useCallback, useEffect, useState } from 'react';
import { invokeChannel } from '@/common/renderer/ipc';
import { readStored, useScopedKey, writeStored } from '@/common/renderer/storage';
import {
  type BranchList,
  checkoutBranchChannel,
  forgetRepoChannel,
  listBranchesChannel,
  listRecentReposChannel,
  openDemoRepoChannel,
  openRepoChannel,
  pickLocalRepoChannel,
} from '../../ipc/channels';
import { defaultBaseBranch } from '../../model/branches';
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
  /** Lokala brancher i det valda repot, tom lista utan git */
  branches: string[];
  /** Branchen man jämför mot, null om det bara finns en */
  baseBranch: string | null;
  setBaseBranch: (branch: string) => void;
  /** Checkar ut en annan branch i det valda repot */
  checkout: (branch: string) => Promise<void>;
}

export function useRepoState(): RepoState {
  // Valt repo och basbranch är per appflik
  const lastRepoKey = useScopedKey('highai.lastRepo');
  const baseBranchPrefix = useScopedKey('highai.baseBranch:');
  const baseBranchKey = useCallback(
    (repoPath: string): string => `${baseBranchPrefix}${repoPath}`,
    [baseBranchPrefix],
  );
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [recent, setRecent] = useState<RepoInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Brancherna taggas med repot så ett byte inte visar det gamla repots lista.
  const [branchList, setBranchList] = useState<{ repoPath: string; list: BranchList } | null>(null);
  const [baseChoice, setBaseChoice] = useState<{ repoPath: string; branch: string } | null>(null);

  const run = useCallback(
    async (task: () => Promise<RepoInfo | null>, quiet = false) => {
      setBusy(true);
      setError(null);
      try {
        const result = await task();
        if (result) {
          setRepo(result);
          writeStored(lastRepoKey, result.path);
          setRecent(await invokeChannel(listRecentReposChannel, undefined));
        }
      } catch (e) {
        if (quiet) writeStored(lastRepoKey, null);
        else setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [lastRepoKey],
  );

  // Vid start: hämta listan och öppna repot som var valt senast, tyst om det försvunnit.
  useEffect(() => {
    void invokeChannel(listRecentReposChannel, undefined).then((list) => {
      setRecent(list);
      const last = readStored(lastRepoKey);
      if (last) void run(() => invokeChannel(openRepoChannel, { path: last }), true);
    });
  }, [run, lastRepoKey]);

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
  // Läs om brancherna när repot byts eller när branchen ändrats via checkout.
  const repoPath = repo?.path ?? null;
  const currentBranch = repo?.branch ?? null;
  useEffect(() => {
    if (!repoPath) return;
    let cancelled = false;
    invokeChannel(listBranchesChannel, { repoPath })
      .then((list) => {
        if (!cancelled) setBranchList({ repoPath, list });
      })
      .catch(() => {
        if (!cancelled) setBranchList({ repoPath, list: { current: null, branches: [] } });
      });
    return () => {
      cancelled = true;
    };
  }, [repoPath, currentBranch]);

  const branches = branchList?.repoPath === repoPath ? branchList.list.branches : [];
  const baseBranch = repoPath
    ? defaultBaseBranch(
        branches,
        currentBranch,
        baseChoice?.repoPath === repoPath ? baseChoice.branch : readStored(baseBranchKey(repoPath)),
      )
    : null;

  const setBaseBranch = useCallback(
    (branch: string) => {
      if (!repoPath) return;
      setBaseChoice({ repoPath, branch });
      writeStored(baseBranchKey(repoPath), branch);
    },
    [repoPath, baseBranchKey],
  );

  const checkout = useCallback(
    (branch: string) => {
      if (!repoPath) return Promise.resolve();
      return run(() => invokeChannel(checkoutBranchChannel, { repoPath, branch }));
    },
    [repoPath, run],
  );

  const forget = useCallback(
    async (path: string) => {
      setRecent(await invokeChannel(forgetRepoChannel, { path }));
      setRepo((current) => (current?.path === path ? null : current));
      if (readStored(lastRepoKey) === path) writeStored(lastRepoKey, null);
    },
    [lastRepoKey],
  );
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    repo,
    recent,
    busy,
    error,
    pickLocal,
    openDemo,
    open,
    forget,
    clearError,
    branches,
    baseBranch,
    setBaseBranch,
    checkout,
  };
}

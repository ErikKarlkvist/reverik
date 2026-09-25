import { defineChannel, defineEvent } from '@/common/ipc/channel';
import { type RepoInfo } from '../model/repo';

/** Öppnar systemdialog för att välja en lokal mapp. null om användaren avbryter. */
export const pickLocalRepoChannel = defineChannel<undefined, RepoInfo | null>('repo:pick-local');

/** Klonar en git-URL till appens datamapp. Progress skickas via `cloneProgressEvent`. */
export const cloneRepoChannel = defineChannel<{ url: string }, RepoInfo>('repo:clone');

/** Läser om ett repo på en känd sökväg, t.ex. från listan över senaste. */
export const openRepoChannel = defineChannel<{ path: string }, RepoInfo>('repo:open');

export const listRecentReposChannel = defineChannel<undefined, RepoInfo[]>('repo:list-recent');

export const forgetRepoChannel = defineChannel<{ path: string }, RepoInfo[]>('repo:forget');

export interface CloneProgress {
  url: string;
  /** T.ex. "receiving objects" eller "resolving deltas". */
  stage: string;
  /** 0 till 100. */
  percent: number;
}

export const cloneProgressEvent = defineEvent<CloneProgress>('repo:clone-progress');

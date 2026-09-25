import { defineChannel } from '@/common/ipc/channel';
import { type RepoInfo } from '../model/repo';

/** Öppnar systemdialog för att välja en lokal mapp. null om användaren avbryter. */
export const pickLocalRepoChannel = defineChannel<undefined, RepoInfo | null>('repo:pick-local');

/** Öppnar demo-appen som ligger i Highai-repot under demo/todo-app. */
export const openDemoRepoChannel = defineChannel<undefined, RepoInfo>('repo:open-demo');

/** Läser om ett repo på en känd sökväg, t.ex. från listan över senaste. */
export const openRepoChannel = defineChannel<{ path: string }, RepoInfo>('repo:open');

export const listRecentReposChannel = defineChannel<undefined, RepoInfo[]>('repo:list-recent');

export const forgetRepoChannel = defineChannel<{ path: string }, RepoInfo[]>('repo:forget');

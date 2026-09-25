import { BrowserWindow, dialog } from 'electron';
import { handleChannel } from '@/common/main/ipc';
import {
  forgetRepoChannel,
  listRecentReposChannel,
  openRepoChannel,
  pickLocalRepoChannel,
} from '../ipc/channels';
import { type RepoInfo } from '../model/repo';
import { inspectRepo } from './inspect';
import { forgetRepo, readRecent, rememberRepo } from './recent';

export function registerRepoHandlers(): void {
  handleChannel(pickLocalRepoChannel, async () => {
    const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const options = { properties: ['openDirectory' as const], title: 'Välj repo' };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    const path = result.filePaths[0];
    if (result.canceled || !path) return null;
    return openAndRemember(path);
  });

  handleChannel(openRepoChannel, ({ path }) => openAndRemember(path));

  handleChannel(listRecentReposChannel, () => readRecent());

  handleChannel(forgetRepoChannel, ({ path }) => forgetRepo(path));
}

async function openAndRemember(path: string): Promise<RepoInfo> {
  const repo = await inspectRepo(path);
  await rememberRepo(repo);
  return repo;
}

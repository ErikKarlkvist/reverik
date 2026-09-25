import { app } from 'electron';
import { appInfoChannel } from '@/application/ipc/channels';
import { handleChannel } from '@/common/main/ipc';
import { registerRepoHandlers } from '@/features/repo/main';

export function registerApplicationHandlers(): void {
  handleChannel(appInfoChannel, () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
  }));

  registerRepoHandlers();
}

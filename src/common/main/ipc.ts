import { ipcMain } from 'electron';
import { type Channel } from '@/common/ipc/channel';

export function handleChannel<Req, Res>(
  channel: Channel<Req, Res>,
  handler: (request: Req) => Promise<Res> | Res,
): void {
  ipcMain.handle(channel.name, (_event, payload: unknown) => handler(payload as Req));
}

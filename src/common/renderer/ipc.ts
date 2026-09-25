import { type Channel } from '@/common/ipc/channel';
import '@/common/ipc/bridge';

export async function invokeChannel<Req, Res>(
  channel: Channel<Req, Res>,
  request: Req,
): Promise<Res> {
  return (await window.api.invoke(channel.name, request)) as Res;
}

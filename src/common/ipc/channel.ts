/**
 * En typad IPC-kanal. Definieras en gång (i en features `ipc/`-mapp),
 * hanteras i main med `handleChannel` och anropas i renderer med `invokeChannel`.
 * Typparametrarna bärs bara på typnivå.
 */
export interface Channel<Req, Res> {
  readonly name: string;
  readonly __req?: Req;
  readonly __res?: Res;
}

export type ChannelRequest<C> = C extends Channel<infer Req, unknown> ? Req : never;
export type ChannelResponse<C> = C extends Channel<unknown, infer Res> ? Res : never;

export function defineChannel<Req = undefined, Res = undefined>(name: string): Channel<Req, Res> {
  return { name };
}

/** Formen på det preload exponerar som `window.api`. */
export interface IpcBridge {
  invoke: (channel: string, payload: unknown) => Promise<unknown>;
}

declare global {
  interface Window {
    api: IpcBridge;
  }
}

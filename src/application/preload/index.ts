import { contextBridge, ipcRenderer } from 'electron';
import { type IpcBridge } from '@/common/ipc/bridge';

const api: IpcBridge = {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
};

contextBridge.exposeInMainWorld('api', api);

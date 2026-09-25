import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { loadEnv } from './env';
import { registerApplicationHandlers } from './handlers';
import { createMainWindow } from './window';

loadEnv();

void app.whenReady().then(() => {
  electronApp.setAppUserModelId('se.karlkvist.highai');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerApplicationHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

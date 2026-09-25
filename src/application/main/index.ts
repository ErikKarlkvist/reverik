import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { loadEnv } from './env';
import { registerApplicationHandlers } from './handlers';
import { createMainWindow } from './window';

loadEnv();

// Sätt HIGHAI_DEBUG_PORT för att kunna styra renderern via Chrome DevTools-protokollet.
if (process.env.HIGHAI_DEBUG_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.HIGHAI_DEBUG_PORT);
}

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

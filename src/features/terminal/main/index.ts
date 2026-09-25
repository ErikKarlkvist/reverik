import { app } from 'electron';
import { emitEvent, handleChannel } from '@/common/main/ipc';
import {
  closeTerminalChannel,
  openTerminalChannel,
  resizeTerminalChannel,
  terminalDataEvent,
  terminalExitEvent,
  writeTerminalChannel,
} from '../ipc/channels';
import { TerminalSessions } from './sessions';

export function registerTerminalHandlers(): void {
  const sessions = new TerminalSessions({
    onData: (id, data) => {
      emitEvent(terminalDataEvent, { id, data });
    },
    onExit: (id, exitCode) => {
      emitEvent(terminalExitEvent, { id, exitCode });
    },
  });

  handleChannel(openTerminalChannel, ({ repoPath, cols, rows }) => ({
    id: sessions.open(repoPath, { cols, rows }),
  }));
  handleChannel(writeTerminalChannel, ({ id, data }) => {
    sessions.write(id, data);
  });
  handleChannel(resizeTerminalChannel, ({ id, cols, rows }) => {
    sessions.resize(id, { cols, rows });
  });
  handleChannel(closeTerminalChannel, ({ id }) => {
    sessions.close(id);
  });

  app.on('before-quit', () => {
    sessions.closeAll();
  });
}

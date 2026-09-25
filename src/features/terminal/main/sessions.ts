import { randomUUID } from 'node:crypto';
import { type IPty, spawn } from 'node-pty';
import { type TerminalSize } from '../ipc/channels';

interface Listeners {
  onData: (id: string, data: string) => void;
  onExit: (id: string, exitCode: number) => void;
}

/**
 * Håller de skal som är igång. Ett skal per öppen terminalpanel. Skalet
 * startas som inloggningsskal så att PATH och verktyg som `claude` finns
 * även när appen startats från Finder.
 */
export class TerminalSessions {
  private readonly sessions = new Map<string, IPty>();

  constructor(private readonly listeners: Listeners) {}

  open(cwd: string, size: TerminalSize): string {
    const id = randomUUID();
    const shell = process.env.SHELL ?? '/bin/zsh';
    const pty = spawn(shell, ['-l'], {
      name: 'xterm-256color',
      cwd,
      cols: size.cols,
      rows: size.rows,
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    });
    this.sessions.set(id, pty);
    pty.onData((data) => {
      this.listeners.onData(id, data);
    });
    pty.onExit(({ exitCode }) => {
      this.sessions.delete(id);
      this.listeners.onExit(id, exitCode);
    });
    return id;
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.write(data);
  }

  resize(id: string, size: TerminalSize): void {
    if (size.cols < 1 || size.rows < 1) return;
    this.sessions.get(id)?.resize(size.cols, size.rows);
  }

  close(id: string): void {
    const pty = this.sessions.get(id);
    if (!pty) return;
    this.sessions.delete(id);
    pty.kill();
  }

  closeAll(): void {
    for (const id of [...this.sessions.keys()]) this.close(id);
  }
}

import { type JSX, type ReactNode, useCallback, useMemo, useRef } from 'react';
import { TerminalContext, type TerminalSender } from './TerminalContext';

/** Låter resten av appen skicka text till terminalen utan att känna till panelen. */
export function TerminalProvider({ children }: { children: ReactNode }): JSX.Element {
  const sender = useRef<TerminalSender | null>(null);
  const queue = useRef<string[]>([]);

  const register = useCallback((next: TerminalSender | null) => {
    sender.current = next;
    if (next) {
      for (const line of queue.current) next(line);
      queue.current = [];
    }
  }, []);
  const send = useCallback((line: string) => {
    if (sender.current) sender.current(line);
    else queue.current.push(line);
  }, []);

  const api = useMemo(() => ({ send, register }), [send, register]);
  return <TerminalContext.Provider value={api}>{children}</TerminalContext.Provider>;
}

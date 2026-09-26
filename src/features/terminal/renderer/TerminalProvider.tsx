import { type JSX, type ReactNode, useCallback, useMemo, useRef } from 'react';
import { TerminalContext, type TerminalSender } from './TerminalContext';

/** Låter resten av appen skicka text till den aktiva terminalfliken utan att känna till panelen. */
export function TerminalProvider({ children }: { children: ReactNode }): JSX.Element {
  const senders = useRef(new Map<number, TerminalSender>());
  const active = useRef<number | null>(null);
  const queue = useRef<string[]>([]);

  const flush = useCallback(() => {
    const sender = active.current === null ? undefined : senders.current.get(active.current);
    if (!sender) return;
    for (const line of queue.current) sender(line);
    queue.current = [];
  }, []);
  const register = useCallback(
    (tabId: number, sender: TerminalSender | null) => {
      if (sender) senders.current.set(tabId, sender);
      else senders.current.delete(tabId);
      flush();
    },
    [flush],
  );
  const setActiveTab = useCallback(
    (tabId: number) => {
      active.current = tabId;
      flush();
    },
    [flush],
  );
  const send = useCallback(
    (line: string) => {
      queue.current.push(line);
      flush();
    },
    [flush],
  );

  const api = useMemo(() => ({ send, register, setActiveTab }), [send, register, setActiveTab]);
  return <TerminalContext.Provider value={api}>{children}</TerminalContext.Provider>;
}

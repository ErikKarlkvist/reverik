import { createContext, useContext } from 'react';

export type TerminalSender = (line: string) => void;

export interface TerminalApi {
  /** Skriver en rad till programmet i den aktiva terminalfliken. Köas tills en finns. */
  send: TerminalSender;
  /** Varje flik registrerar sig när dess skal är igång, null när den stängs */
  register: (tabId: number, sender: TerminalSender | null) => void;
  setActiveTab: (tabId: number) => void;
}

export const TerminalContext = createContext<TerminalApi | null>(null);

export function useTerminalApi(): TerminalApi {
  const api = useContext(TerminalContext);
  if (!api) throw new Error('useTerminalApi must be used inside TerminalProvider');
  return api;
}

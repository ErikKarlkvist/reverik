import { type IpcBridge } from '@/common/ipc/bridge';
import { DEMO_REPO_RELATIVE_PATH, demoFlows } from '@/common/model/fixtures';

/**
 * Ersätter preload-bryggan när renderern körs i en vanlig webbläsare under
 * utveckling, t.ex. för att titta på UI:t utan Electron. Laddas bara i dev
 * och bara om `window.api` saknas. Svarar med demo-repot och fixturerna.
 */
export function installMockBridge(): void {
  const demoPath = `/mock/${DEMO_REPO_RELATIVE_PATH}`;
  const demoRepo = {
    path: demoPath,
    name: 'todo-app',
    isGit: true,
    branch: 'main',
    origin: null,
    fileCount: 26,
    languages: [
      { name: 'TypeScript', files: 18 },
      { name: 'JSON', files: 4 },
    ],
    lastOpenedAt: new Date().toISOString(),
  };
  const builtin = demoFlows.map((flow, i) => ({
    id: `builtin:${i}`,
    repoPath: demoPath,
    origin: 'builtin',
    createdAt: '2026-01-01T00:00:00.000Z',
    flow,
  }));
  let recent: (typeof demoRepo)[] = [];

  const handlers: Record<string, (payload: unknown) => unknown> = {
    'app:info': () => ({ version: 'mock', electron: 'webbläsare', platform: 'web' }),
    'repo:list-recent': () => recent,
    'repo:pick-local': () => null,
    'repo:open-demo': () => {
      recent = [demoRepo];
      return demoRepo;
    },
    'repo:open': () => demoRepo,
    'repo:forget': () => {
      recent = [];
      return recent;
    },
    'analysis:list': (payload) =>
      (payload as { repoPath: string }).repoPath === demoPath ? builtin : [],
    'analysis:delete': () => builtin,
    'repo:read-source': async (payload) => {
      const {
        file,
        line,
        context = 8,
      } = payload as { file: string; line: number; context?: number };
      // ?raw ger filen som en JS-modul med en strängliteral, annars transpilerar Vite tsx.
      const res = await fetch(`/@fs${__HIGHAI_ROOT__}/${DEMO_REPO_RELATIVE_PATH}/${file}?raw`);
      if (!res.ok) throw new Error(`Kunde inte läsa ${file}`);
      const module = await res.text();
      const literal = module.slice(module.indexOf('"'), module.lastIndexOf('"') + 1);
      const all = (JSON.parse(literal) as string).split('\n');
      const startLine = Math.max(1, line - context);
      const endLine = Math.min(all.length, line + context);
      return { file, line, startLine, lines: all.slice(startLine - 1, endLine) };
    },
  };

  const api: IpcBridge = {
    invoke: (channel, payload) => {
      const handler = handlers[channel];
      if (!handler) return Promise.reject(new Error(`Mock saknar kanalen ${channel}`));
      return Promise.resolve(handler(payload));
    },
    on: () => () => undefined,
  };
  window.api = api;
  console.warn('Highai kör med mock-brygga, ingen Electron.');
}

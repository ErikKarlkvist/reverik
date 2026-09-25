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

import { type JSX, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { invokeChannel } from '@/common/renderer/ipc';
import { RepoPanel, useRepo } from '@/features/repo';
import { ThemeSelect } from './ThemeSelect';

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__drag" />
        <h1 className="shell__title">Highai</h1>
        <RepoPanel />
      </aside>

      <main className="shell__canvas">
        <p className="shell__empty">
          {repo ? 'Ställ en fråga om ett flöde för att börja.' : 'Välj ett repo till vänster.'}
        </p>
      </main>

      <section className="shell__bottom">
        <h2 className="shell__panel-heading">Logg</h2>
        <p className="shell__empty">Här visas vad analysen läser och kodutdrag för valda steg.</p>
      </section>

      <footer className="shell__footer">
        <span>
          {info ? `v${info.version} · Electron ${info.electron} · ${info.platform}` : 'Startar…'}
        </span>
        <ThemeSelect />
      </footer>
    </div>
  );
}

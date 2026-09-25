import { type JSX, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { invokeChannel } from '@/common/renderer/ipc';

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <h1 className="shell__title">Highai</h1>
        <p className="shell__hint">Koppla ett repo och ställ en fråga om ett flöde.</p>
      </aside>
      <main className="shell__canvas">
        <p className="shell__empty">Ingen analys ännu.</p>
      </main>
      <footer className="shell__footer">
        {info ? `v${info.version} · Electron ${info.electron} · ${info.platform}` : 'Startar…'}
      </footer>
    </div>
  );
}

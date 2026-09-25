import { type JSX, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { invokeChannel } from '@/common/renderer/ipc';
import { AnalysisList, FlowPreview, useAnalyses } from '@/features/analysis';
import { RepoPanel, useRepo } from '@/features/repo';
import { ThemeSelect } from './ThemeSelect';
import { useStoredFlag } from './useStoredFlag';

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();
  const { current } = useAnalyses();
  const [logOpen, setLogOpen] = useStoredFlag('highai.logOpen', true);

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  return (
    <div className={`shell${logOpen ? '' : ' shell--log-closed'}`}>
      <aside className="shell__sidebar">
        <div className="shell__drag" />
        <h1 className="shell__title">Highai</h1>
        <RepoPanel />
        {repo && <AnalysisList />}
      </aside>

      <main className="shell__canvas">
        {current ? (
          <FlowPreview flow={current.flow} />
        ) : (
          <p className="shell__empty">
            {repo
              ? 'Välj en analys till vänster, eller ställ en fråga om ett flöde.'
              : 'Välj ett repo till vänster.'}
          </p>
        )}
      </main>

      {logOpen && (
        <section className="shell__bottom">
          <div className="shell__panel-bar">
            <h2 className="shell__panel-heading">Logg</h2>
            <button
              type="button"
              className="shell__panel-toggle"
              title="Minimera loggen"
              onClick={() => {
                setLogOpen(false);
              }}
            >
              ▾
            </button>
          </div>
          <p className="shell__empty">Här visas vad analysen läser och kodutdrag för valda steg.</p>
        </section>
      )}

      <footer className="shell__footer">
        <span>
          {info ? `v${info.version} · Electron ${info.electron} · ${info.platform}` : 'Startar…'}
        </span>
        <span className="shell__footer-tools">
          {!logOpen && (
            <button
              type="button"
              className="shell__footer-button"
              title="Visa loggen"
              onClick={() => {
                setLogOpen(true);
              }}
            >
              ▴ Logg
            </button>
          )}
          <ThemeSelect />
        </span>
      </footer>
    </div>
  );
}

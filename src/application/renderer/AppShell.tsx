import { type JSX, useCallback, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { type FlowEdge, type SourceRef } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';
import { invokeChannel } from '@/common/renderer/ipc';
import { AnalysisList, useAnalyses } from '@/features/analysis';
import { FlowPlayer } from '@/features/flow-graph';
import { RepoPanel, SourceView, useRepo } from '@/features/repo';
import { ThemeSelect } from './ThemeSelect';
import { useStoredFlag } from './useStoredFlag';

type PanelTab = 'code' | 'log';

const TAB_LABELS: Readonly<Record<PanelTab, string>> = { code: 'Kod', log: 'Logg' };

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();
  const { current } = useAnalyses();
  const [logOpen, setLogOpen] = useStoredFlag('highai.logOpen', true);
  const [source, setSource] = useState<SourceRef | null>(null);
  const [tab, setTab] = useState<PanelTab>('code');

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  const onActiveEdgeChange = useCallback((edge: FlowEdge | null) => {
    setSource(edge?.source ?? null);
  }, []);
  const onSelectSource = useCallback((selected: SourceRef) => {
    setSource(selected);
  }, []);

  const shownSource = current ? source : null;
  const activeTab: PanelTab = tab === 'code' && !shownSource ? 'log' : tab;

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
          <FlowPlayer
            key={current.id}
            flow={current.flow}
            onActiveEdgeChange={onActiveEdgeChange}
            onSelectSource={onSelectSource}
          />
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
            <div className="shell__tabs" role="tablist">
              {(Object.keys(TAB_LABELS) as PanelTab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`shell__tab${activeTab === key ? ' is-active' : ''}`}
                  disabled={key === 'code' && !shownSource}
                  onClick={() => {
                    setTab(key);
                  }}
                >
                  {TAB_LABELS[key]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="icon-button"
              title="Minimera panelen"
              aria-label="Minimera panelen"
              onClick={() => {
                setLogOpen(false);
              }}
            >
              <Icon name="chevronDown" />
            </button>
          </div>
          {activeTab === 'code' && shownSource ? (
            <SourceView source={shownSource} />
          ) : (
            <p className="shell__empty">
              Loggen visar vad analysen läser när den körs. Ingen analys körs just nu.
            </p>
          )}
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
              className="text-button"
              title="Visa panelen"
              onClick={() => {
                setLogOpen(true);
              }}
            >
              <Icon name="chevronUp" size="sm" /> {TAB_LABELS[activeTab]}
            </button>
          )}
          <ThemeSelect />
        </span>
      </footer>
    </div>
  );
}

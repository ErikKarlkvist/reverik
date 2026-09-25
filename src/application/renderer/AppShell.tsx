import { type JSX, useCallback, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { type FlowEdge, type FlowNode, type SourceRef } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';
import { invokeChannel } from '@/common/renderer/ipc';
import { AnalysisList, useAnalyses } from '@/features/analysis';
import { FlowPlayer } from '@/features/flow-graph';
import { RepoPanel, SourceView, useRepo } from '@/features/repo';
import { ThemeSelect } from './ThemeSelect';
import { useStoredFlag } from './useStoredFlag';

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();
  const { current } = useAnalyses();
  const [logOpen, setLogOpen] = useStoredFlag('highai.logOpen', true);
  const [source, setSource] = useState<SourceRef | null>(null);

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  const onActiveEdgeChange = useCallback((edge: FlowEdge | null) => {
    setSource(edge?.source ?? null);
  }, []);
  const onSelectNode = useCallback((node: FlowNode) => {
    if (node.source) setSource(node.source);
  }, []);
  const onSelectEdge = useCallback((edge: FlowEdge) => {
    setSource(edge.source);
  }, []);

  const shownSource = current ? source : null;

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
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
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
            <h2 className="shell__panel-heading">{shownSource ? 'Kod' : 'Logg'}</h2>
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
          {shownSource ? (
            <SourceView source={shownSource} />
          ) : (
            <p className="shell__empty">
              Här visas kodutdrag för aktivt steg och vad analysen läser.
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
              <Icon name="chevronUp" size="sm" /> {shownSource ? 'Kod' : 'Logg'}
            </button>
          )}
          <ThemeSelect />
        </span>
      </footer>
    </div>
  );
}

import { type JSX, useCallback, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { type FlowEdge, type SourceRef } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { Splitter } from '@/common/renderer/Splitter';
import { invokeChannel } from '@/common/renderer/ipc';
import { AnalysisList, GUIDE_FILE, InboxLog, useAnalyses } from '@/features/analysis';
import { FlowPlayer } from '@/features/flow-graph';
import { RepoPanel, SourceView, useRepo } from '@/features/repo';
import { claudeStartCommand, TerminalPanel } from '@/features/terminal';
import { ThemeSelect } from './ThemeSelect';
import { useStoredFlag } from './useStoredFlag';
import { useStoredNumber } from './useStoredNumber';

type PanelTab = 'code' | 'log';

const TAB_LABELS: Readonly<Record<PanelTab, string>> = {
  code: t('panel.code'),
  log: t('panel.log'),
};

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();
  const { current } = useAnalyses();
  const [logOpen, setLogOpen] = useStoredFlag('highai.logOpen', true);
  const [terminalOpen, setTerminalOpen] = useStoredFlag('highai.terminalOpen', true);
  const [source, setSource] = useState<SourceRef | null>(null);
  const [tab, setTab] = useState<PanelTab>('code');
  const [sidebarWidth, setSidebarWidth] = useStoredNumber('highai.sidebarWidth', 300);
  const [bottomHeight, setBottomHeight] = useStoredNumber('highai.bottomHeight', 220);
  const [terminalWidth, setTerminalWidth] = useStoredNumber('highai.terminalWidth', 460);

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  const onActiveEdgeChange = useCallback((edge: FlowEdge | null) => {
    setSource(edge?.source ?? null);
  }, []);
  const onSelectSource = useCallback((selected: SourceRef) => {
    setSource(selected);
  }, []);
  const hideTerminal = useCallback(() => {
    setTerminalOpen(false);
  }, [setTerminalOpen]);

  const shownSource = current ? source : null;
  const activeTab: PanelTab = tab === 'code' && !shownSource ? 'log' : tab;
  const shellClass = [
    'shell',
    logOpen ? '' : 'shell--log-closed',
    terminalOpen ? '' : 'shell--terminal-closed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={shellClass}
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        '--bottom-height': `${bottomHeight}px`,
        '--terminal-width': `${terminalWidth}px`,
      }}
    >
      <aside className="shell__sidebar">
        <div className="shell__drag" />
        <h1 className="shell__title">Highai</h1>
        <RepoPanel />
        {repo && <AnalysisList />}
        <Splitter
          orientation="vertical"
          size={sidebarWidth}
          min={220}
          max={600}
          onResize={setSidebarWidth}
          label={t('panel.resizeSidebar')}
        />
      </aside>

      <main className="shell__canvas">
        {current ? (
          <FlowPlayer
            key={current.id}
            flow={current.flow}
            onActiveEdgeChange={onActiveEdgeChange}
            onSelectSource={onSelectSource}
            beforeControls={
              logOpen ? (
                <Splitter
                  orientation="horizontal"
                  size={bottomHeight}
                  min={120}
                  max={700}
                  inverted
                  onResize={setBottomHeight}
                  label={t('panel.resizeBottom')}
                />
              ) : null
            }
          />
        ) : (
          <p className="shell__empty">{repo ? t('app.chooseAnalysis') : t('app.chooseRepo')}</p>
        )}
      </main>

      {logOpen && (
        <section className="shell__bottom">
          <Splitter
            orientation="horizontal"
            size={bottomHeight}
            min={120}
            max={700}
            inverted
            onResize={setBottomHeight}
            label={t('panel.resizeBottom')}
          />
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
              title={t('panel.minimise')}
              aria-label={t('panel.minimise')}
              onClick={() => {
                setLogOpen(false);
              }}
            >
              <Icon name="chevronDown" />
            </button>
          </div>
          {activeTab === 'code' && shownSource ? <SourceView source={shownSource} /> : <InboxLog />}
        </section>
      )}

      {terminalOpen && (
        <div className="shell__terminal">
          <TerminalPanel
            repoPath={repo?.path ?? null}
            startCommand={claudeStartCommand(GUIDE_FILE)}
            onHide={hideTerminal}
          >
            <Splitter
              orientation="vertical"
              size={terminalWidth}
              min={320}
              max={900}
              inverted
              edge="start"
              onResize={setTerminalWidth}
              label={t('panel.resizeTerminal')}
            />
          </TerminalPanel>
        </div>
      )}

      <footer className="shell__footer">
        <span>
          {info
            ? `v${info.version} · Electron ${info.electron} · ${info.platform}`
            : t('app.starting')}
        </span>
        <span className="shell__footer-tools">
          {!logOpen && (
            <button
              type="button"
              className="text-button"
              title={t('panel.show')}
              onClick={() => {
                setLogOpen(true);
              }}
            >
              <Icon name="chevronUp" size="sm" /> {TAB_LABELS[activeTab]}
            </button>
          )}
          {!terminalOpen && (
            <button
              type="button"
              className="text-button"
              title={t('panel.showTerminal')}
              onClick={() => {
                setTerminalOpen(true);
              }}
            >
              <Icon name="terminal" size="sm" /> {t('panel.showTerminal')}
            </button>
          )}
          <ThemeSelect />
        </span>
      </footer>
    </div>
  );
}

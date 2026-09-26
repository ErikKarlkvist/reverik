import { type JSX, useCallback, useEffect, useState } from 'react';
import { type AppInfo, appInfoChannel } from '@/application/ipc/channels';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { Splitter } from '@/common/renderer/Splitter';
import { invokeChannel } from '@/common/renderer/ipc';
import { AnalysisList, GUIDE_FILE, useAnalyses } from '@/features/analysis';
import { useTabTitle } from './AppTabsContext';
import { BranchBar, RepoMenu, RepoPanel, useRepo } from '@/features/repo';
import { TerminalPanel, useTerminalApi } from '@/features/terminal';
import { ThemeSelect } from './ThemeSelect';
import { useStoredFlag } from './useStoredFlag';
import { useStoredNumber } from './useStoredNumber';
import { Workspace } from './Workspace';

export function AppShell(): JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { repo } = useRepo();
  const { current } = useAnalyses();
  useTabTitle(repo ? (current ? `${repo.name} · ${current.flow.title}` : repo.name) : null);
  const [logOpen, setLogOpen] = useStoredFlag('highai.logOpen', true);
  const [terminalOpen, setTerminalOpen] = useStoredFlag('highai.terminalOpen', true);
  const [sidebarWidth, setSidebarWidth] = useStoredNumber('highai.sidebarWidth', 300);
  const [bottomHeight, setBottomHeight] = useStoredNumber('highai.bottomHeight', 220);
  const [terminalWidth, setTerminalWidth] = useStoredNumber('highai.terminalWidth', 460);

  useEffect(() => {
    void invokeChannel(appInfoChannel, undefined).then(setInfo);
  }, []);

  const hideTerminal = useCallback(() => {
    setTerminalOpen(false);
  }, [setTerminalOpen]);
  // Frågor från grafen går till agenten i terminalen. Är panelen stängd öppnas den och frågan köas.
  const terminal = useTerminalApi();
  const onAsk = useCallback(
    (prompt: string) => {
      setTerminalOpen(true);
      terminal.send(prompt);
    },
    [terminal, setTerminalOpen],
  );
  const onRunReview = useCallback(
    (base: string, head: string) => {
      onAsk(t('branch.reviewPrompt', { base, head }));
    },
    [onAsk],
  );

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
        '--terminal-width': `${terminalWidth}px`,
      }}
    >
      <aside className="shell__sidebar">
        <div className="shell__drag" />
        <h1 className="shell__title">Highai</h1>
        <RepoPanel />
        <BranchBar onRunReview={onRunReview} />
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

      <div className="shell__work">
        <Workspace
          analysis={current}
          hasRepo={repo !== null}
          logOpen={logOpen}
          bottomHeight={bottomHeight}
          onBottomResize={setBottomHeight}
          onLogOpenChange={setLogOpen}
          onAsk={onAsk}
        />
      </div>

      {terminalOpen && (
        <div className="shell__terminal">
          <TerminalPanel repoPath={repo?.path ?? null} guideFile={GUIDE_FILE} onHide={hideTerminal}>
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
        <span className="shell__footer-tools">
          <RepoMenu />
          <span>
            {info
              ? `v${info.version} · Electron ${info.electron} · ${info.platform}`
              : t('app.starting')}
          </span>
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
              <Icon name="chevronUp" size="sm" /> {t('panel.show')}
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

import '@xterm/xterm/css/xterm.css';
import { type JSX, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useStoredChoice } from '@/common/renderer/useStoredChoice';
import { type Agent, AGENTS, agentStartCommand } from '../../model/agent';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalApi } from '../TerminalContext';
import './terminal.css';

interface Props {
  /** Skalet startar i den här mappen. */
  repoPath: string | null;
  /** Guiden agenten ska läsa, relativt repots rot. */
  guideFile: string;
  onHide: () => void;
  /** T.ex. ett draghandtag som ägs av appen. */
  children?: ReactNode;
}

const AGENT_LABELS: Readonly<Record<Agent, string>> = {
  claude: t('terminal.agent.claude'),
  codex: t('terminal.agent.codex'),
  shell: t('terminal.agent.shell'),
};

interface Tab {
  id: number;
  agent: Agent;
}

interface ShellApi {
  restart: () => void;
  run: (command: string) => void;
}

/**
 * Terminal för valfri AI-agent, startad i repots rot. Flera flikar kan köra
 * samtidigt, alla hålls monterade så agenterna fortsätter i bakgrunden.
 * Vald agent för nya flikar sparas mellan starter.
 */
export function TerminalPanel({ repoPath, guideFile, onHide, children }: Props): JSX.Element {
  const [defaultAgent, setDefaultAgent] = useStoredChoice<Agent>('highai.agent', AGENTS, 'claude');
  const [tabs, setTabs] = useState<Tab[]>(() => [{ id: 1, agent: defaultAgent }]);
  const [activeId, setActiveId] = useState(1);
  const [nextId, setNextId] = useState(2);
  const shells = useRef(new Map<number, ShellApi>());
  const { setActiveTab } = useTerminalApi();

  useEffect(() => {
    setActiveTab(activeId);
  }, [activeId, setActiveTab]);

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const activeAgent = active?.agent ?? defaultAgent;
  const activeStart = agentStartCommand(activeAgent, guideFile);

  const addTab = useCallback(() => {
    setTabs((current) => [...current, { id: nextId, agent: defaultAgent }]);
    setActiveId(nextId);
    setNextId((n) => n + 1);
  }, [nextId, defaultAgent]);

  const closeTab = useCallback((id: number) => {
    setTabs((current) => {
      if (current.length <= 1) return current;
      const index = current.findIndex((tab) => tab.id === id);
      const remaining = current.filter((tab) => tab.id !== id);
      setActiveId((activeNow) =>
        activeNow === id ? (remaining[Math.max(0, index - 1)]?.id ?? activeNow) : activeNow,
      );
      return remaining;
    });
  }, []);

  const changeAgent = useCallback(
    (next: string) => {
      setDefaultAgent(next);
      const agent = (AGENTS as readonly string[]).includes(next) ? (next as Agent) : defaultAgent;
      setTabs((current) => current.map((tab) => (tab.id === activeId ? { ...tab, agent } : tab)));
    },
    [activeId, defaultAgent, setDefaultAgent],
  );

  const onShellApi = useCallback((id: number, api: ShellApi | null) => {
    if (api) shells.current.set(id, api);
    else shells.current.delete(id);
  }, []);
  const restartActive = useCallback(() => {
    shells.current.get(activeId)?.restart();
  }, [activeId]);
  const startActive = useCallback(() => {
    if (activeStart) shells.current.get(activeId)?.run(activeStart);
  }, [activeId, activeStart]);

  return (
    <section className="terminal-panel">
      {children}
      <Bar
        agent={activeAgent}
        onAgentChange={changeAgent}
        onHide={onHide}
        onRestart={repoPath ? restartActive : undefined}
        onStartAgent={repoPath && activeStart ? startActive : undefined}
      />
      {repoPath ? (
        <>
          <div className="terminal-panel__tabs" role="tablist">
            {tabs.map((tab, i) => (
              <div
                key={tab.id}
                className={`terminal-panel__tab${tab.id === activeId ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab.id === activeId}
                  className="terminal-panel__tab-open"
                  onClick={() => {
                    setActiveId(tab.id);
                  }}
                >
                  {AGENT_LABELS[tab.agent]} {i + 1}
                </button>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="terminal-panel__tab-close"
                    title={t('terminal.closeTab')}
                    aria-label={t('terminal.closeTab')}
                    onClick={() => {
                      closeTab(tab.id);
                    }}
                  >
                    <Icon name="close" size="sm" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="icon-button icon-button--quiet terminal-panel__tab-add"
              title={t('terminal.newTab')}
              aria-label={t('terminal.newTab')}
              onClick={addTab}
            >
              <Icon name="plus" size="sm" />
            </button>
          </div>
          <div className="terminal-panel__screens">
            {tabs.map((tab) => (
              <Shell
                key={`${repoPath}#${tab.id}`}
                tabId={tab.id}
                repoPath={repoPath}
                agent={tab.agent}
                startCommand={agentStartCommand(tab.agent, guideFile)}
                active={tab.id === activeId}
                onApi={onShellApi}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="terminal-panel__empty">{t('terminal.noRepo')}</p>
      )}
    </section>
  );
}

interface BarProps {
  agent: Agent;
  onAgentChange: (next: string) => void;
  onHide: () => void;
  onRestart?: (() => void) | undefined;
  onStartAgent?: (() => void) | undefined;
}

function Bar({ agent, onAgentChange, onHide, onRestart, onStartAgent }: BarProps): JSX.Element {
  return (
    <header className="terminal-panel__bar">
      <h2 className="terminal-panel__heading">{t('terminal.heading')}</h2>
      <span className="terminal-panel__tools">
        <select
          className="terminal-panel__agent"
          value={agent}
          title={t('terminal.agentHint')}
          aria-label={t('terminal.agentLabel')}
          onChange={(event) => {
            onAgentChange(event.target.value);
          }}
        >
          {AGENTS.map((key) => (
            <option key={key} value={key}>
              {AGENT_LABELS[key]}
            </option>
          ))}
        </select>
        {onStartAgent && (
          <button
            type="button"
            className="icon-button icon-button--quiet"
            title={t('terminal.startAgent')}
            aria-label={t('terminal.startAgent')}
            onClick={onStartAgent}
          >
            <Icon name="play" size="sm" />
          </button>
        )}
        {onRestart && (
          <button
            type="button"
            className="icon-button icon-button--quiet"
            title={t('terminal.restart')}
            aria-label={t('terminal.restart')}
            onClick={onRestart}
          >
            <Icon name="restart" size="sm" />
          </button>
        )}
        <button
          type="button"
          className="icon-button icon-button--quiet"
          title={t('panel.minimiseTerminal')}
          aria-label={t('panel.minimiseTerminal')}
          onClick={onHide}
        >
          <Icon name="chevronRight" size="sm" />
        </button>
      </span>
    </header>
  );
}

interface ShellProps {
  tabId: number;
  repoPath: string;
  agent: Agent;
  startCommand: string | null;
  active: boolean;
  onApi: (tabId: number, api: ShellApi | null) => void;
}

/** En flik. Inaktiva flikar göms med visibility så xterm behåller sina mått. */
function Shell({ tabId, repoPath, agent, startCommand, active, onApi }: ShellProps): JSX.Element {
  const screen = useRef<HTMLDivElement | null>(null);
  const { exitCode, restart, run } = useTerminal(repoPath, screen, startCommand, tabId);

  useEffect(() => {
    onApi(tabId, { restart, run });
    return () => {
      onApi(tabId, null);
    };
  }, [tabId, restart, run, onApi]);

  return (
    <div className={`terminal-panel__screen-tab${active ? ' is-active' : ''}`}>
      {agent === 'shell' && (
        <p className="terminal-panel__hint">
          {t('terminal.shellHint', { guide: '.highai/README.md' })}
        </p>
      )}
      <div className="terminal-panel__screen" ref={screen} />
      {exitCode !== null && (
        <div className="terminal-panel__exited">
          <span>{t('terminal.exited', { code: exitCode })}</span>
          <button type="button" onClick={restart}>
            {t('terminal.restart')}
          </button>
        </div>
      )}
    </div>
  );
}

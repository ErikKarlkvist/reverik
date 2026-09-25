import '@xterm/xterm/css/xterm.css';
import { type JSX, type ReactNode, useCallback, useRef } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useTerminal } from '../hooks/useTerminal';
import './terminal.css';

interface Props {
  /** Skalet startar i den här mappen. */
  repoPath: string | null;
  /** Körs i skalet så fort det öppnats, t.ex. kommandot som startar agenten. */
  startCommand: string | null;
  onHide: () => void;
  /** T.ex. ett draghandtag som ägs av appen. */
  children?: ReactNode;
}

/** Terminal för valfri AI-agent, startad i repots rot. */
export function TerminalPanel({ repoPath, startCommand, onHide, children }: Props): JSX.Element {
  return (
    <section className="terminal-panel">
      {children}
      {repoPath ? (
        <Shell key={repoPath} repoPath={repoPath} startCommand={startCommand} onHide={onHide} />
      ) : (
        <>
          <Bar onHide={onHide} />
          <p className="terminal-panel__empty">{t('terminal.noRepo')}</p>
        </>
      )}
    </section>
  );
}

interface BarProps {
  onHide: () => void;
  onRestart?: () => void;
  onStartAgent?: (() => void) | undefined;
}

function Bar({ onHide, onRestart, onStartAgent }: BarProps): JSX.Element {
  return (
    <header className="terminal-panel__bar">
      <h2 className="terminal-panel__heading">{t('terminal.heading')}</h2>
      <span className="terminal-panel__tools">
        {onStartAgent && (
          <button
            type="button"
            className="text-button"
            title={t('terminal.startAgentHint')}
            onClick={onStartAgent}
          >
            <Icon name="play" size="sm" /> {t('terminal.startAgent')}
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
  repoPath: string;
  startCommand: string | null;
  onHide: () => void;
}

function Shell({ repoPath, startCommand, onHide }: ShellProps): JSX.Element {
  const screen = useRef<HTMLDivElement | null>(null);
  const { exitCode, restart, run } = useTerminal(repoPath, screen, startCommand);
  const startAgent = useCallback(() => {
    if (startCommand) run(startCommand);
  }, [run, startCommand]);

  return (
    <>
      <Bar
        onHide={onHide}
        onRestart={restart}
        onStartAgent={startCommand && exitCode === null ? startAgent : undefined}
      />
      <div className="terminal-panel__screen" ref={screen} />
      {exitCode !== null && (
        <div className="terminal-panel__exited">
          <span>{t('terminal.exited', { code: exitCode })}</span>
          <button type="button" onClick={restart}>
            {t('terminal.restart')}
          </button>
        </div>
      )}
    </>
  );
}

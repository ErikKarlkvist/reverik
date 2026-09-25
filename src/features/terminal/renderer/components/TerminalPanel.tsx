import '@xterm/xterm/css/xterm.css';
import { type JSX, type ReactNode, useRef } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useTerminal } from '../hooks/useTerminal';
import './terminal.css';

interface Props {
  /** Skalet startar i den här mappen. */
  repoPath: string | null;
  onHide: () => void;
  /** T.ex. ett draghandtag som ägs av appen. */
  children?: ReactNode;
}

/** Terminal för valfri AI-agent, startad i repots rot. */
export function TerminalPanel({ repoPath, onHide, children }: Props): JSX.Element {
  return (
    <section className="terminal">
      {children}
      {repoPath ? (
        <Shell key={repoPath} repoPath={repoPath} onHide={onHide} />
      ) : (
        <>
          <Bar onHide={onHide} />
          <p className="terminal__empty">{t('terminal.noRepo')}</p>
        </>
      )}
    </section>
  );
}

function Bar({ onHide, onRestart }: { onHide: () => void; onRestart?: () => void }): JSX.Element {
  return (
    <header className="terminal__bar">
      <h2 className="terminal__heading">{t('terminal.heading')}</h2>
      <span className="terminal__tools">
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

function Shell({ repoPath, onHide }: { repoPath: string; onHide: () => void }): JSX.Element {
  const screen = useRef<HTMLDivElement | null>(null);
  const { exitCode, restart } = useTerminal(repoPath, screen);

  return (
    <>
      <Bar onHide={onHide} onRestart={restart} />
      <div className="terminal__screen" ref={screen} />
      {exitCode !== null && (
        <div className="terminal__exited">
          <span>{t('terminal.exited', { code: exitCode })}</span>
          <button type="button" onClick={restart}>
            {t('terminal.restart')}
          </button>
        </div>
      )}
    </>
  );
}

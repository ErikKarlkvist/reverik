import '@xterm/xterm/css/xterm.css';
import { type JSX, type ReactNode, type SubmitEvent, useCallback, useRef, useState } from 'react';
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

/**
 * Terminal för valfri AI-agent. Frågefältet skickar texten till programmet
 * som kör i terminalen, med en uppmaning att först läsa guiden i .highai/.
 */
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
  const { exitCode, restart, send } = useTerminal(repoPath, screen);
  const [question, setQuestion] = useState('');

  const ask = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = question.trim();
      if (!trimmed) return;
      send(t('terminal.askPrefix') + trimmed);
      setQuestion('');
    },
    [question, send],
  );

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
      <form className="terminal__ask" onSubmit={ask}>
        <input
          type="text"
          value={question}
          placeholder={t('terminal.askPlaceholder')}
          title={t('terminal.askHint')}
          onChange={(event) => {
            setQuestion(event.target.value);
          }}
        />
        <button type="submit" disabled={!question.trim() || exitCode !== null}>
          {t('terminal.send')}
        </button>
      </form>
    </>
  );
}

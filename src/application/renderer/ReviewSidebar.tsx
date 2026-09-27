import { type JSX, useCallback, useEffect, useState } from 'react';
import { t } from '@/common/model/i18n';
import { formatFindings, type ReviewFinding, sortFindings } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { useAnalyses } from '@/features/analysis';
import { useTerminalApi } from '@/features/terminal';

/**
 * Reviewläget i högerpanelen: alla fynd i den valda analysen med kryssrutor.
 * Markerade fynd kan kopieras som text eller skickas till agenten i terminalen.
 */
export function ReviewSidebar(): JSX.Element {
  const { current } = useAnalyses();
  const terminal = useTerminalApi();
  // Markeringen taggas med analysen, så byte av analys ger tom markering.
  const [selection, setSelection] = useState<{ id: string; ids: ReadonlySet<string> } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const review = current?.review;
  const selected: ReadonlySet<string> =
    selection !== null && selection.id === current?.id ? selection.ids : new Set<string>();
  const findings = review ? sortFindings(review.findings) : [];
  const chosen = findings.filter((f) => selected.has(f.id));

  const setSelected = useCallback(
    (ids: ReadonlySet<string>) => {
      if (current) setSelection({ id: current.id, ids });
    },
    [current],
  );
  const toggle = (finding: ReviewFinding): void => {
    const next = new Set(selected);
    if (next.has(finding.id)) next.delete(finding.id);
    else next.add(finding.id);
    setSelected(next);
  };

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => {
      setCopied(false);
    }, 1500);
    return () => {
      clearTimeout(id);
    };
  }, [copied]);

  if (!current || !review) return <p className="review-side__empty">{t('side.empty')}</p>;

  const text = (): string => formatFindings(chosen, current.flow, review.base);
  const copy = (): void => {
    void navigator.clipboard.writeText(text()).then(() => {
      setCopied(true);
    });
  };
  const send = (): void => {
    terminal.send(
      t('side.prompt', {
        title: current.flow.title,
        base: review.baseLabel,
        head: review.headLabel,
        file: current.file ? t('side.promptFile', { file: current.file }) : '',
        findings: text(),
      }),
    );
  };

  return (
    <div className="review-side">
      <div className="review-side__head">
        <span className="review-side__title" title={current.flow.question}>
          {current.flow.title}
        </span>
        <span className="review-side__compare">
          {t('review.compare', { base: review.baseLabel, head: review.headLabel })}
        </span>
      </div>
      <div className="review-side__tools">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setSelected(new Set(findings.map((f) => f.id)));
          }}
        >
          {t('side.selectAll')}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={chosen.length === 0}
          onClick={() => {
            setSelected(new Set());
          }}
        >
          {t('side.clear')}
        </button>
      </div>
      <ul className="review-side__list">
        {findings.map((finding) => {
          const checked = selected.has(finding.id);
          const expanded = open === finding.id;
          return (
            <li
              key={finding.id}
              className={`review-side__item is-${finding.severity}${checked ? ' is-checked' : ''}`}
            >
              <label className="review-side__row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    toggle(finding);
                  }}
                />
                <span className={`review__severity is-${finding.severity}`}>
                  <Icon name={finding.severity} size="sm" />
                </span>
                <span className="review-side__text">{finding.title}</span>
                <button
                  type="button"
                  className="icon-button icon-button--quiet"
                  aria-expanded={expanded}
                  aria-label={finding.title}
                  onClick={(event) => {
                    event.preventDefault();
                    setOpen(expanded ? null : finding.id);
                  }}
                >
                  <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size="sm" />
                </button>
              </label>
              {expanded && (
                <div className="review-side__body">
                  <p className="review__text">{finding.description}</p>
                  {finding.suggestion && (
                    <p className="review__text">
                      <strong>{t('review.suggestion')}</strong> {finding.suggestion}
                    </p>
                  )}
                  {finding.source && (
                    <p className="review-side__source">
                      {finding.source.file}:{finding.source.line}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="review-side__actions">
        <button type="button" disabled={chosen.length === 0} onClick={copy}>
          <Icon name="copy" size="sm" /> {copied ? t('side.copied') : t('side.copy')}
          {chosen.length > 0 && !copied && ` (${chosen.length})`}
        </button>
        <button
          type="button"
          className="review-side__send"
          disabled={chosen.length === 0}
          title={t('side.sendHint')}
          onClick={send}
        >
          <Icon name="chat" size="sm" /> {t('side.send')}
          {chosen.length > 0 && ` (${chosen.length})`}
        </button>
      </div>
    </div>
  );
}

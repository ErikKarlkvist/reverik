import { type JSX, useCallback, useEffect, useState } from 'react';
import { t } from '@/common/model/i18n';
import { formatFindings, type ReviewFinding, sortFindings } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { type SavedAnalysis, useAnalyses } from '@/features/analysis';
import { useTerminalApi } from '@/features/terminal';

interface ReviewGroup {
  key: string;
  base: string;
  head: string;
  analyses: SavedAnalysis[];
}

/**
 * Full review i högerpanelen: fynden från alla review-analyser i repot,
 * grupperade per jämförelse och per flöde. Markerade fynd kan kopieras som
 * text eller skickas till agenten i terminalen, över alla flöden på en gång.
 */
export function ReviewSidebar(): JSX.Element {
  const { analyses, current, select } = useAnalyses();
  const terminal = useTerminalApi();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const groups = groupReviews(analyses, current);
  const key = (analysis: SavedAnalysis, finding: ReviewFinding): string =>
    `${analysis.id}:${finding.id}`;
  const allKeys = groups.flatMap((g) =>
    g.analyses.flatMap((a) => (a.review?.findings ?? []).map((f) => key(a, f))),
  );
  const chosenCount = allKeys.filter((k) => selected.has(k)).length;

  const toggle = useCallback((k: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => {
      setCopied(false);
    }, 1500);
    return () => {
      clearTimeout(id);
    };
  }, [copied]);

  if (groups.length === 0) return <p className="review-side__empty">{t('side.empty')}</p>;

  /** Markerade fynd som text, med en rubrik per flöde och reviewfilen den hör till. */
  const text = (): string =>
    groups
      .flatMap((group) =>
        group.analyses.flatMap((analysis) => {
          const review = analysis.review;
          if (!review) return [];
          const chosen = review.findings.filter((f) => selected.has(key(analysis, f)));
          if (chosen.length === 0) return [];
          const heading = `## ${analysis.flow.title}${analysis.file ? ` (${analysis.file})` : ''}`;
          return [`${heading}\n${formatFindings(chosen, analysis.flow, review.base)}`];
        }),
      )
      .join('\n\n');

  const copy = (): void => {
    void navigator.clipboard.writeText(text()).then(() => {
      setCopied(true);
    });
  };
  const send = (): void => {
    const first = groups[0];
    if (!first) return;
    terminal.send(t('side.prompt', { base: first.base, head: first.head, findings: text() }));
  };

  return (
    <div className="review-side">
      <div className="review-side__tools">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setSelected(new Set(allKeys));
          }}
        >
          {t('side.selectAll')}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={chosenCount === 0}
          onClick={() => {
            setSelected(new Set());
          }}
        >
          {t('side.clear')}
        </button>
      </div>
      <div className="review-side__scroll">
        {groups.map((group) => (
          <section key={group.key} className="review-side__group">
            <h3 className="review-side__compare">
              {t('review.compare', { base: group.base, head: group.head })}
            </h3>
            {group.analyses.map((analysis) => {
              const review = analysis.review;
              if (!review) return null;
              const isCurrent = analysis.id === current?.id;
              return (
                <div key={analysis.id} className="review-side__flow">
                  <button
                    type="button"
                    className={`review-side__flow-title${isCurrent ? ' is-current' : ''}`}
                    title={analysis.flow.question}
                    onClick={() => {
                      select(analysis.id);
                    }}
                  >
                    {analysis.flow.title}
                    <span className="review-side__count">{review.findings.length}</span>
                  </button>
                  <ul className="review-side__list">
                    {sortFindings(review.findings).map((finding) => {
                      const k = key(analysis, finding);
                      const checked = selected.has(k);
                      const expanded = open === k;
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
                                toggle(k);
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
                                setOpen(expanded ? null : k);
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
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <div className="review-side__actions">
        <button type="button" disabled={chosenCount === 0} onClick={copy}>
          <Icon name="copy" size="sm" /> {copied ? t('side.copied') : t('side.copy')}
          {chosenCount > 0 && !copied && ` (${chosenCount})`}
        </button>
        <button
          type="button"
          className="review-side__send"
          disabled={chosenCount === 0}
          title={t('side.sendHint')}
          onClick={send}
        >
          <Icon name="chat" size="sm" /> {t('side.send')}
          {chosenCount > 0 && ` (${chosenCount})`}
        </button>
      </div>
    </div>
  );
}

/** Review-analyser grupperade per jämförelse. Gruppen med den valda analysen först. */
function groupReviews(
  analyses: readonly SavedAnalysis[],
  current: SavedAnalysis | null,
): ReviewGroup[] {
  const groups = new Map<string, ReviewGroup>();
  for (const analysis of analyses) {
    const review = analysis.review;
    if (!review) continue;
    const key = `${review.baseLabel}\u0000${review.headLabel}`;
    const group = groups.get(key) ?? {
      key,
      base: review.baseLabel,
      head: review.headLabel,
      analyses: [],
    };
    group.analyses.push(analysis);
    groups.set(key, group);
  }
  const list = [...groups.values()];
  const currentKey = current?.review
    ? `${current.review.baseLabel}\u0000${current.review.headLabel}`
    : null;
  return list.sort((a, b) => Number(b.key === currentKey) - Number(a.key === currentKey));
}

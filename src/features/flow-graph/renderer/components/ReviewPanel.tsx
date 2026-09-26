import { type JSX } from 'react';
import { type Flow } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import { diffFlows, type Review, type ReviewFinding, sortFindings } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { SourceView } from '@/features/repo';
import './graph.css';

interface Props {
  /** Flödet efter ändringen */
  flow: Flow;
  review: Review;
  focusedFindingId: string | null;
  onFocus: (findingId: string | null) => void;
}

/** Fliken Review i nedre panelen: vad som ändrats och fynden, allvarligast först. */
export function ReviewPanel({ flow, review, focusedFindingId, onFocus }: Props): JSX.Element {
  const diff = diffFlows(review.base, flow);
  const count = (change: string): number =>
    [...diff.nodes.values(), ...diff.edges.values()].filter((c) => c === change).length;
  const findings = sortFindings(review.findings);
  const where = (finding: ReviewFinding): string | null => {
    if (finding.nodeId) {
      const node = [...flow.nodes, ...review.base.nodes].find((n) => n.id === finding.nodeId);
      return node?.label ?? finding.nodeId;
    }
    if (finding.edgeId) {
      const edge = [...flow.edges, ...review.base.edges].find((e) => e.id === finding.edgeId);
      return edge?.label ?? finding.edgeId;
    }
    return null;
  };

  return (
    <div className="review">
      <p className="review__head">
        <span className="review__compare">
          {t('review.compare', { base: review.baseLabel, head: review.headLabel })}
        </span>
        <span className="review__changes">
          {t('review.changes', {
            added: count('added'),
            removed: count('removed'),
            changed: count('changed'),
          })}
        </span>
      </p>
      {findings.length === 0 && <p className="shell__empty">{t('review.empty')}</p>}
      <ol className="review__list">
        {findings.map((finding) => {
          const open = finding.id === focusedFindingId;
          const location = where(finding);
          return (
            <li
              key={finding.id}
              className={`review__item is-${finding.severity}${open ? ' is-open' : ''}`}
            >
              <button
                type="button"
                className="review__row"
                aria-expanded={open}
                onClick={() => {
                  onFocus(open ? null : finding.id);
                }}
              >
                <span className={`review__severity is-${finding.severity}`}>
                  <Icon name={finding.severity} size="sm" />
                </span>
                <span className="review__title">{finding.title}</span>
                {location && <span className="review__where">{location}</span>}
              </button>
              {open && (
                <div className="review__body">
                  <p className="review__text">{finding.description}</p>
                  {finding.suggestion && (
                    <p className="review__text">
                      <strong>{t('review.suggestion')}</strong> {finding.suggestion}
                    </p>
                  )}
                  {finding.source && <SourceView source={finding.source} />}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import { type CSSProperties, type JSX, useState } from 'react';
import { t } from '@/common/model/i18n';
import { type ReviewFinding, sortFindings, worstSeverity } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { useFindingState } from './GraphStateContext';

interface Props {
  findings: readonly ReviewFinding[];
  className?: string;
  style?: CSSProperties;
}

/**
 * Flaggan med antal fynd på en nod eller en linje. Hover visar fynden,
 * klick på flaggan fäster listan, klick på ett fynd öppnar det i review-fliken.
 */
export function FindingFlag({ findings, className = '', style }: Props): JSX.Element | null {
  const { focusedFindingId, focusFinding } = useFindingState();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const severity = worstSeverity(findings);
  if (!severity) return null;
  const focused = findings.some((f) => f.id === focusedFindingId);
  const open = hovered || pinned;

  return (
    <span
      className={`graph-flag-wrap nodrag nopan ${className}`}
      style={style}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <button
        type="button"
        className={`graph-flag is-${severity}${focused ? ' is-focused' : ''}${pinned ? ' is-pinned' : ''}`}
        title={t('review.flag', { count: findings.length })}
        onClick={(event) => {
          event.stopPropagation();
          setPinned((p) => !p);
        }}
      >
        <Icon name={severity} size="sm" />
        {findings.length > 1 && <span className="graph-flag__count">{findings.length}</span>}
      </button>
      {open && (
        <ul className="graph-flag-list">
          {sortFindings(findings).map((finding) => (
            <li key={finding.id}>
              <button
                type="button"
                className={`graph-flag-list__item is-${finding.severity}${finding.id === focusedFindingId ? ' is-focused' : ''}`}
                title={t('review.openBelow')}
                onClick={(event) => {
                  event.stopPropagation();
                  setPinned(false);
                  focusFinding(finding.id);
                }}
              >
                <Icon name={finding.severity} size="sm" />
                <span className="graph-flag-list__title">{finding.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

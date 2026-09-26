import { type CSSProperties, type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { type ReviewFinding, worstSeverity } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { useFindingState } from './GraphStateContext';

interface Props {
  findings: readonly ReviewFinding[];
  className?: string;
  style?: CSSProperties;
}

/** Flaggan med antal fynd på en nod eller en linje. Klick öppnar det allvarligaste i review-fliken. */
export function FindingFlag({ findings, className = '', style }: Props): JSX.Element | null {
  const { focusedFindingId, focusFinding } = useFindingState();
  const severity = worstSeverity(findings);
  if (!severity) return null;
  const focused = findings.some((f) => f.id === focusedFindingId);
  const first = findings.find((f) => f.severity === severity);
  return (
    <button
      type="button"
      className={`graph-flag is-${severity}${focused ? ' is-focused' : ''} nodrag nopan ${className}`}
      style={style}
      title={`${t('review.flag', { count: findings.length })}\n${findings.map((f) => f.title).join('\n')}`}
      onClick={(event) => {
        event.stopPropagation();
        if (first) focusFinding(first.id);
      }}
    >
      <Icon name={severity} size="sm" />
      {findings.length > 1 && <span className="graph-flag__count">{findings.length}</span>}
    </button>
  );
}

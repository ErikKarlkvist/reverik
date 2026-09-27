import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { type ReviewFinding } from '@/common/model/review';
import { SourceView } from '@/features/repo';

interface Props {
  finding: ReviewFinding;
  /** Visa kodutdraget, annars bara fil och rad */
  showSource: boolean;
  /** Commiten koden läses ur när den inte är utcheckad */
  commit?: string | undefined;
}

/** Ett utfällt fynd: beskrivning, förslag och källa. Används i Review-fliken och i AI-panelen. */
export function FindingDetails({ finding, showSource, commit }: Props): JSX.Element {
  return (
    <div className="finding-details">
      <p className="finding-details__text">{finding.description}</p>
      {finding.suggestion && (
        <p className="finding-details__text">
          <strong>{t('review.suggestion')}</strong> {finding.suggestion}
        </p>
      )}
      {finding.source &&
        (showSource ? (
          <SourceView source={finding.source} commit={commit} />
        ) : (
          <p className="finding-details__source">
            {finding.source.file}:{finding.source.line}
          </p>
        ))}
    </div>
  );
}

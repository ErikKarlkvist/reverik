import { type JSX } from 'react';
import { LOCALE, t } from '@/common/model/i18n';
import { worstSeverity } from '@/common/model/review';
import { Icon } from '@/common/renderer/Icon';
import { useAnalyses } from '../AnalysisContext';
import './analysis.css';

export function AnalysisList(): JSX.Element {
  const { analyses, current, error, rejection, select, remove, dismissRejection } = useAnalyses();

  return (
    <section className="analyses">
      <h2 className="analyses__heading">{t('analyses.heading')}</h2>
      {error && <p className="analyses__error">{error}</p>}
      {rejection?.type === 'rejected' && (
        <div className="analyses__error analyses__rejection">
          <div className="analyses__rejection-head">
            <span>{t('inbox.rejected', { file: rejection.file })}</span>
            <button
              type="button"
              className="icon-button icon-button--quiet"
              title={t('inbox.dismiss')}
              aria-label={t('inbox.dismiss')}
              onClick={dismissRejection}
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
          <ul className="analyses__rejection-errors">
            {rejection.errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="analyses__rejection-hint">{t('inbox.errorsWritten')}</p>
        </div>
      )}
      {analyses.length === 0 && !error && <p className="analyses__muted">{t('analyses.empty')}</p>}
      <ul className="analyses__list">
        {analyses.map((analysis) => {
          const active = analysis.id === current?.id;
          return (
            <li key={analysis.id} className={`analyses__item${active ? ' is-active' : ''}`}>
              <button
                type="button"
                className="analyses__open"
                title={analysis.flow.question}
                onClick={() => {
                  select(active ? null : analysis.id);
                }}
              >
                <span className="analyses__title">
                  {analysis.review && (
                    <span
                      className={`analyses__tag is-${worstSeverity(analysis.review.findings) ?? 'none'}`}
                    >
                      <Icon name="warning" size="sm" /> {t('analyses.review')}
                    </span>
                  )}
                  {analysis.flow.title}
                </span>
                <span className="analyses__meta">
                  {analysis.origin === 'builtin'
                    ? t('analyses.builtin')
                    : formatDate(analysis.createdAt)}{' '}
                  · {t('analyses.steps', { count: analysis.flow.steps.length })}
                </span>
              </button>
              {analysis.origin !== 'builtin' && (
                <button
                  type="button"
                  className="icon-button icon-button--quiet"
                  title={t('analyses.delete')}
                  aria-label={t('analyses.delete')}
                  onClick={() => void remove(analysis.id)}
                >
                  <Icon name="close" size="sm" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, { dateStyle: 'short', timeStyle: 'short' });
}

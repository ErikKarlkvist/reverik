import { type JSX } from 'react';
import { LOCALE, t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useAnalyses } from '../AnalysisContext';
import './analysis.css';

export function AnalysisList(): JSX.Element {
  const { analyses, current, error, select, remove } = useAnalyses();

  return (
    <section className="analyses">
      <h2 className="analyses__heading">{t('analyses.heading')}</h2>
      {error && <p className="analyses__error">{error}</p>}
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
                <span className="analyses__title">{analysis.flow.title}</span>
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

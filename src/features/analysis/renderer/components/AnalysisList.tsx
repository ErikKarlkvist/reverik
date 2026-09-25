import { type JSX } from 'react';
import { useAnalyses } from '../AnalysisContext';
import './analysis.css';

export function AnalysisList(): JSX.Element {
  const { analyses, current, error, select, remove } = useAnalyses();

  return (
    <section className="analyses">
      <h2 className="analyses__heading">Analyser</h2>
      {error && <p className="analyses__error">{error}</p>}
      {analyses.length === 0 && !error && (
        <p className="analyses__muted">Inga analyser ännu. Ställ en fråga för att skapa en.</p>
      )}
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
                  {analysis.origin === 'builtin' ? 'Inbyggd' : formatDate(analysis.createdAt)} ·{' '}
                  {analysis.flow.steps.length} steg
                </span>
              </button>
              {analysis.origin !== 'builtin' && (
                <button
                  type="button"
                  className="analyses__delete"
                  title="Ta bort analysen"
                  onClick={() => void remove(analysis.id)}
                >
                  ×
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
  return new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

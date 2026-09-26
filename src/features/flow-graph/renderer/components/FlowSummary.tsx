import { type JSX } from 'react';
import { type Flow } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import './graph.css';

/** Frågan, sammanfattningen och stegen i ett flöde, för fliken i nedre panelen. */
export function FlowSummary({ flow }: { flow: Flow }): JSX.Element {
  const edgeLabel = new Map(flow.edges.map((e) => [e.id, e.label]));
  return (
    <div className="flow-summary">
      <p className="flow-summary__question">{flow.question}</p>
      <p className="flow-summary__text">{flow.summary}</p>
      <h3 className="flow-summary__heading">{t('summary.steps')}</h3>
      <ol className="flow-summary__steps">
        {flow.steps.map((step, i) => (
          <li key={`${step.edgeId}:${i}`}>
            <span className="flow-summary__label">{edgeLabel.get(step.edgeId) ?? step.edgeId}</span>
            {step.description}
          </li>
        ))}
      </ol>
    </div>
  );
}

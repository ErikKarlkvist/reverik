import { type JSX } from 'react';
import { type Flow, NODE_KIND_LABELS } from '@/common/model/flow';
import './analysis.css';

/** Enkel textvy av ett flöde. Ersätts av grafen i Del 3. */
export function FlowPreview({ flow }: { flow: Flow }): JSX.Element {
  const nodes = new Map(flow.nodes.map((n) => [n.id, n]));
  const edges = new Map(flow.edges.map((e) => [e.id, e]));

  return (
    <article className="preview">
      <header className="preview__header">
        <h2 className="preview__title">{flow.title}</h2>
        <p className="preview__question">{flow.question}</p>
        <p className="preview__summary">{flow.summary}</p>
      </header>
      <ol className="preview__steps">
        {flow.steps.map((step, i) => {
          const edge = edges.get(step.edgeId);
          const from = edge ? nodes.get(edge.from) : undefined;
          const to = edge ? nodes.get(edge.to) : undefined;
          return (
            <li key={`${step.edgeId}-${i}`} className="preview__step">
              <div className="preview__route">
                {from && <NodeChip label={from.label} kind={NODE_KIND_LABELS[from.kind]} />}
                <span className="preview__arrow">→</span>
                {to && <NodeChip label={to.label} kind={NODE_KIND_LABELS[to.kind]} />}
              </div>
              <div className="preview__edge">{edge?.label}</div>
              <div className="preview__desc">{step.description}</div>
              {edge?.payload && <div className="preview__payload">↦ {edge.payload}</div>}
              {edge?.response && <div className="preview__payload">↤ {edge.response}</div>}
              {edge && (
                <div className="preview__source">
                  {edge.source.file}:{edge.source.line}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function NodeChip({ label, kind }: { label: string; kind: string }): JSX.Element {
  return (
    <span className="preview__chip" title={kind}>
      <span className="preview__chip-kind">{kind}</span>
      {label}
    </span>
  );
}

import '@xyflow/react/dist/style.css';
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { type Flow, type FlowEdge, type SourceRef } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';
import { buildModel, type GraphNode, type GraphView } from '../../model/graph';
import { useFlowPlayback } from '../hooks/useFlowPlayback';
import { FlowGraph } from './FlowGraph';
import { PlaybackControls } from './PlaybackControls';
import './graph.css';

interface Props {
  flow: Flow;
  /** Anropas när aktivt steg byts, med kanten som steget spelar upp. */
  onActiveEdgeChange?: (edge: FlowEdge | null) => void;
  onSelectSource?: (source: SourceRef) => void;
}

/**
 * Graf med uppspelning. Börjar i systemvyn, klick på ett system zoomar in i
 * det. Montera om med `key` när flödet byts så uppspelningen börjar om.
 */
export function FlowPlayer({ flow, onActiveEdgeChange, onSelectSource }: Props): JSX.Element {
  const playback = useFlowPlayback(flow.steps.length);
  const [view, setView] = useState<GraphView>({ kind: 'system' });
  const model = useMemo(() => buildModel(flow, view), [flow, view]);

  useEffect(() => {
    const step = flow.steps[playback.stepIndex];
    const edge = step ? flow.edges.find((e) => e.id === step.edgeId) : undefined;
    onActiveEdgeChange?.(edge ?? null);
  }, [flow, playback.stepIndex, onActiveEdgeChange]);

  const onNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.level === 'system') setView({ kind: 'focus', systemId: node.systemId });
      else if (node.source) onSelectSource?.(node.source);
    },
    [onSelectSource],
  );
  const onEdgeClick = useCallback(
    (edge: FlowEdge) => {
      onSelectSource?.(edge.source);
    },
    [onSelectSource],
  );

  const focused = view.kind === 'focus' ? flow.systems.find((s) => s.id === view.systemId) : null;
  const viewKey = view.kind === 'focus' ? `focus:${view.systemId}` : view.kind;

  return (
    <div className="player">
      <header className="player__header">
        <div className="player__heading">
          <h2 className="player__title">{flow.title}</h2>
          <p className="player__summary">{flow.summary}</p>
        </div>
        <nav className="player__crumbs" aria-label="Nivå">
          <button
            type="button"
            className={`crumb${view.kind === 'system' ? ' is-current' : ''}`}
            onClick={() => {
              setView({ kind: 'system' });
            }}
          >
            Alla system
          </button>
          {focused && (
            <>
              <Icon name="chevronRight" size="sm" />
              <span className="crumb is-current">
                <Icon name={focused.kind} size="sm" /> {focused.label}
              </span>
            </>
          )}
          <span className="player__crumbs-spacer" />
          <button
            type="button"
            className={`crumb crumb--toggle${view.kind === 'detail' ? ' is-current' : ''}`}
            title="Visa alla noder i alla system"
            onClick={() => {
              setView(view.kind === 'detail' ? { kind: 'system' } : { kind: 'detail' });
            }}
          >
            Alla detaljer
          </button>
        </nav>
      </header>
      <FlowGraph
        key={viewKey}
        model={model}
        stepIndex={playback.stepIndex}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
      />
      <PlaybackControls flow={flow} playback={playback} />
    </div>
  );
}

import '@xyflow/react/dist/style.css';
import { type JSX, useEffect } from 'react';
import { type Flow, type FlowEdge, type FlowNode } from '@/common/model/flow';
import { useFlowPlayback } from '../hooks/useFlowPlayback';
import { FlowGraph } from './FlowGraph';
import { PlaybackControls } from './PlaybackControls';
import './graph.css';

interface Props {
  flow: Flow;
  /** Anropas när aktivt steg byts, med kanten som steget spelar upp. */
  onActiveEdgeChange?: (edge: FlowEdge | null) => void;
  onSelectNode?: (node: FlowNode) => void;
  onSelectEdge?: (edge: FlowEdge) => void;
}

/** Graf med uppspelning. Montera om med `key` när flödet byts så uppspelningen börjar om. */
export function FlowPlayer({
  flow,
  onActiveEdgeChange,
  onSelectNode,
  onSelectEdge,
}: Props): JSX.Element {
  const playback = useFlowPlayback(flow.steps.length);

  useEffect(() => {
    const step = flow.steps[playback.stepIndex];
    const edge = step ? flow.edges.find((e) => e.id === step.edgeId) : undefined;
    onActiveEdgeChange?.(edge ?? null);
  }, [flow, playback.stepIndex, onActiveEdgeChange]);

  return (
    <div className="player">
      <header className="player__header">
        <h2 className="player__title">{flow.title}</h2>
        <p className="player__summary">{flow.summary}</p>
      </header>
      <FlowGraph
        flow={flow}
        stepIndex={playback.stepIndex}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
      />
      <PlaybackControls flow={flow} playback={playback} />
    </div>
  );
}

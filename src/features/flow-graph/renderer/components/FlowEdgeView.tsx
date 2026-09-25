import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { type JSX, memo } from 'react';
import { type StepStatus } from '../../model/playback';

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphEdgeData = {
  label: string;
  payload: string | undefined;
  response: string | undefined;
  status: StepStatus;
  offset: number;
  hovered: boolean;
};

export type GraphEdge = Edge<GraphEdgeData, 'flow'>;

export const FlowEdgeView = memo(function FlowEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<GraphEdge>): JSX.Element | null {
  if (!data) return null;
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: sourceY + data.offset,
    targetX,
    targetY: targetY + data.offset,
    sourcePosition,
    targetPosition,
  });
  const showDetails = data.hovered || selected;
  const hasDetails = Boolean(data.payload ?? data.response);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={`graph-edge is-${data.status}${selected ? ' is-selected' : ''}`}
        markerEnd={`url(#graph-arrow-${data.status})`}
      />
      {data.status === 'active' && (
        <circle r="5" className="graph-edge__pulse">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          className={`graph-edge-label is-${data.status}${showDetails ? ' is-open' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <span className="graph-edge-label__text">{data.label}</span>
          {showDetails && hasDetails && (
            <div className="graph-edge-label__details">
              {data.payload && (
                <div>
                  <span className="graph-edge-label__key">Skickar</span> {data.payload}
                </div>
              )}
              {data.response && (
                <div>
                  <span className="graph-edge-label__key">Svar</span> {data.response}
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

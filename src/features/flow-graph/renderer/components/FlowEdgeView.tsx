import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { type JSX, memo } from 'react';
import { t } from '@/common/model/i18n';
import { formatPayload } from '../../model/format';
import { type Direction } from '../../model/layout';
import { type StepStatus } from '../../model/playback';

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphEdgeData = {
  label: string;
  payload: string | undefined;
  response: string | undefined;
  status: StepStatus;
  offset: number;
  direction: Direction;
  hovered: boolean;
};

/** Hur långt från linjen etiketten sitter, i pixlar */
const LABEL_DISTANCE = 26;

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
  // Framåtkanter får etiketten ovanför linjen, svar under, så linjen syns.
  const side = data.direction === 'forward' ? -1 : 1;
  const labelOffsetY = labelY + side * LABEL_DISTANCE;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={`graph-edge is-${data.status}${selected ? ' is-selected' : ''}`}
        markerEnd={`url(#graph-arrow-${data.status})`}
      />
      <line
        className={`graph-edge__leader is-${data.status}`}
        x1={labelX}
        y1={labelY}
        x2={labelX}
        y2={labelOffsetY}
      />
      {data.status === 'active' && (
        <circle r="5" className="graph-edge__pulse">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          className={`graph-edge-label is-${data.status}${showDetails ? ' is-open' : ''} graph-edge-label--${data.direction}`}
          style={{
            transform: `translate(-50%, ${side < 0 ? '-100%' : '0'}) translate(${labelX}px, ${labelOffsetY}px)`,
          }}
        >
          <span className="graph-edge-label__text">{data.label}</span>
          {showDetails && hasDetails && (
            <div className="graph-edge-label__details">
              {data.payload && (
                <div className="graph-edge-label__row">
                  <span className="graph-edge-label__key">{t('graph.sends')}</span>
                  <pre className="graph-edge-label__value">{formatPayload(data.payload)}</pre>
                </div>
              )}
              {data.response && (
                <div className="graph-edge-label__row">
                  <span className="graph-edge-label__key">{t('graph.response')}</span>
                  <pre className="graph-edge-label__value">{formatPayload(data.response)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

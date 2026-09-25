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
import { AskButton } from './AskButton';

export interface EdgeMemberData {
  id: string;
  label: string;
  payload: string | undefined;
  response: string | undefined;
  status: StepStatus;
}

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphEdgeData = {
  /** Anropen som ritas på den här linjen, i flödets ordning */
  members: EdgeMemberData[];
  /** Linjens status: aktiv om något anrop är aktivt, annars klar om något är klart */
  status: StepStatus;
  offset: number;
  direction: Direction;
  hovered: boolean;
  /** Anropet som är utpekat i frågerutan, om det ligger på den här linjen */
  askingId: string | null;
  onAsk: (memberId: string) => void;
};

/** Hur långt från linjen etiketten sitter, i pixlar */
const LABEL_DISTANCE = 26;

export type GraphEdge = Edge<GraphEdgeData, 'flow'>;

/**
 * En linje mellan två noder. Etiketten visas bara för anropet som spelas upp
 * just nu, eller för alla anrop på linjen när man håller musen över eller
 * markerar den.
 */
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
  const open = data.hovered || selected === true || data.askingId !== null;
  const active = data.members.find((m) => m.status === 'active');
  const shown = open ? data.members : active ? [active] : [];
  // Framåtkanter får etiketten ovanför linjen, svar under, så linjen syns.
  const side = data.direction === 'forward' ? -1 : 1;
  const labelOffsetY = labelY + side * LABEL_DISTANCE;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={`graph-edge is-${data.status}${selected ? ' is-selected' : ''}${data.askingId ? ' is-asking' : ''}`}
        markerEnd={`url(#graph-arrow-${data.status})`}
      />
      {shown.length > 0 && (
        <line
          className={`graph-edge__leader is-${data.status}`}
          x1={labelX}
          y1={labelY}
          x2={labelX}
          y2={labelOffsetY}
        />
      )}
      {data.status === 'active' && (
        <circle r="5" className="graph-edge__pulse">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {shown.length > 0 && (
        <EdgeLabelRenderer>
          <div
            className={`graph-edge-label is-${data.status}${open ? ' is-open' : ''} graph-edge-label--${data.direction}`}
            style={{
              transform: `translate(-50%, ${side < 0 ? '-100%' : '0'}) translate(${labelX}px, ${labelOffsetY}px)`,
            }}
          >
            {shown.map((member) => (
              <div
                key={member.id}
                className={`graph-edge-label__member is-${member.status}${member.id === data.askingId ? ' is-asking' : ''}`}
              >
                <span className="graph-edge-label__text">
                  {member.label}
                  {open && (
                    <AskButton
                      onAsk={() => {
                        data.onAsk(member.id);
                      }}
                    />
                  )}
                </span>
                {open && (member.payload ?? member.response) && (
                  <div className="graph-edge-label__details">
                    {member.payload && (
                      <div className="graph-edge-label__row">
                        <span className="graph-edge-label__key">{t('graph.sends')}</span>
                        <pre className="graph-edge-label__value">
                          {formatPayload(member.payload)}
                        </pre>
                      </div>
                    )}
                    {member.response && (
                      <div className="graph-edge-label__row">
                        <span className="graph-edge-label__key">{t('graph.response')}</span>
                        <pre className="graph-edge-label__value">
                          {formatPayload(member.response)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

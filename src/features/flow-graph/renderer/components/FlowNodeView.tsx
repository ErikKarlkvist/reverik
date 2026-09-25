import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { type JSX, memo } from 'react';
import { NODE_KIND_LABELS, SYSTEM_KIND_LABELS } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';
import { type GraphKind, type GraphLevel } from '../../model/graph';
import { type StepStatus } from '../../model/playback';

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphNodeData = {
  kind: GraphKind;
  level: GraphLevel;
  label: string;
  description: string | undefined;
  status: StepStatus;
};

export type GraphNode = Node<GraphNodeData, 'flow'>;

const KIND_LABELS: Readonly<Record<GraphKind, string>> = {
  ...NODE_KIND_LABELS,
  ...SYSTEM_KIND_LABELS,
};

export const FlowNodeView = memo(function FlowNodeView({
  data,
  selected,
}: NodeProps<GraphNode>): JSX.Element {
  const system = data.level === 'system';
  return (
    <div
      className={`graph-node graph-node--${data.kind} graph-node--${data.level} is-${data.status}${selected ? ' is-selected' : ''}`}
      title={
        system ? `${data.description ?? data.label}. Klicka för att zooma in.` : data.description
      }
    >
      <Handle type="target" position={Position.Left} id="in-left" className="graph-handle" />
      <Handle type="source" position={Position.Right} id="out-right" className="graph-handle" />
      <Handle type="source" position={Position.Left} id="out-left" className="graph-handle" />
      <Handle type="target" position={Position.Right} id="in-right" className="graph-handle" />
      <span className="graph-node__icon">
        <Icon name={data.kind} size={system ? 'lg' : 'md'} />
      </span>
      <span className="graph-node__text">
        <span className="graph-node__kind">{KIND_LABELS[data.kind]}</span>
        <span className="graph-node__label">{data.label}</span>
      </span>
    </div>
  );
});

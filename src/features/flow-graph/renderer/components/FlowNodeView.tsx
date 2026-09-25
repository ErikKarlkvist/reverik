import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { type JSX, memo } from 'react';
import { NODE_KIND_LABELS, type NodeKind } from '@/common/model/flow';
import { type StepStatus } from '../../model/playback';

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphNodeData = {
  kind: NodeKind;
  label: string;
  description: string | undefined;
  status: StepStatus;
};

export type GraphNode = Node<GraphNodeData, 'flow'>;

export const FlowNodeView = memo(function FlowNodeView({
  data,
  selected,
}: NodeProps<GraphNode>): JSX.Element {
  return (
    <div
      className={`graph-node graph-node--${data.kind} is-${data.status}${selected ? ' is-selected' : ''}`}
      title={data.description}
    >
      <Handle type="target" position={Position.Left} id="in-left" className="graph-handle" />
      <Handle type="source" position={Position.Right} id="out-right" className="graph-handle" />
      <Handle type="source" position={Position.Left} id="out-left" className="graph-handle" />
      <Handle type="target" position={Position.Right} id="in-right" className="graph-handle" />
      <span className="graph-node__kind">{NODE_KIND_LABELS[data.kind]}</span>
      <span className="graph-node__label">{data.label}</span>
    </div>
  );
});

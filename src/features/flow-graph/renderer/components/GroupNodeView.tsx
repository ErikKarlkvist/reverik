import { type Node, type NodeProps } from '@xyflow/react';
import { type JSX, memo } from 'react';
import { type SystemKind } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GroupNodeData = {
  kind: SystemKind;
  label: string;
};

export type GroupNode = Node<GroupNodeData, 'systemGroup'>;

/** Ram runt ett systems noder i detaljvyn. */
export const GroupNodeView = memo(function GroupNodeView({
  data,
}: NodeProps<GroupNode>): JSX.Element {
  return (
    <div className={`graph-group graph-group--${data.kind}`}>
      <span className="graph-group__label">
        <Icon name={data.kind} size="sm" /> {data.label}
      </span>
    </div>
  );
});

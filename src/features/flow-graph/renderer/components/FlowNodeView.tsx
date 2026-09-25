import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { type JSX, memo } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { type GraphKind, type GraphLevel, type TableInfo } from '../../model/graph';
import { useNodeState } from './GraphStateContext';
import { RemoveButton } from './RemoveButton';

// React Flow kräver Record<string, unknown>, vilket ett interface inte uppfyller.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GraphNodeData = {
  kind: GraphKind;
  level: GraphLevel;
  label: string;
  description: string | undefined;
  tables: TableInfo[];
};

export type GraphNode = Node<GraphNodeData, 'flow'>;

export const FlowNodeView = memo(function FlowNodeView({
  id,
  data,
  selected,
}: NodeProps<GraphNode>): JSX.Element {
  const { status, hovered, hide } = useNodeState(id);
  const system = data.level === 'system';
  return (
    <div
      className={`graph-node graph-node--${data.kind} graph-node--${data.level} is-${status}${selected ? ' is-selected' : ''}`}
      title={
        system ? t('graph.zoomHint', { name: data.description ?? data.label }) : data.description
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
        <span className="graph-node__kind">{t(`kind.${data.kind}`)}</span>
        <span className="graph-node__label">{data.label}</span>
      </span>
      <RemoveButton onRemove={hide} />
      {hovered && data.tables.length > 0 && <TablesPopover tables={data.tables} />}
    </div>
  );
});

function TablesPopover({ tables }: { tables: TableInfo[] }): JSX.Element {
  return (
    <div className="graph-tables">
      {tables.map((table) => (
        <div key={table.name} className="graph-tables__table">
          <div className="graph-tables__name">
            <Icon name="db" size="sm" /> {table.name}
            {table.source && (
              <span className="graph-tables__source">
                {table.source.file}:{table.source.line}
              </span>
            )}
          </div>
          {table.description && <div className="graph-tables__desc">{table.description}</div>}
          {table.columns && table.columns.length > 0 && (
            <table className="graph-tables__columns">
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <td className="graph-tables__col">{column.name}</td>
                    <td className="graph-tables__type">{column.type}</td>
                    <td className="graph-tables__coldesc">{column.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {table.touchedBy.length > 0 && (
            <div className="graph-tables__touched">
              {table.touchedBy.map((t) => (
                <span key={t.edgeId} className="graph-tables__op">
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

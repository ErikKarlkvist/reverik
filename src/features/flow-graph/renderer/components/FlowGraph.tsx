import {
  Background,
  type EdgeMouseHandler,
  type EdgeTypes,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  ReactFlow,
} from '@xyflow/react';
import { type JSX, useCallback, useMemo, useState } from 'react';
import { type FlowEdge } from '@/common/model/flow';
import { type GraphModel, type GraphNode as ModelNode } from '../../model/graph';
import { layoutFlow, NODE_SIZES } from '../../model/layout';
import { stepView } from '../../model/playback';
import { FlowEdgeView, type GraphEdge } from './FlowEdgeView';
import { FlowNodeView, type GraphNode } from './FlowNodeView';
import { GroupNodeView, type GroupNode } from './GroupNodeView';

const nodeTypes: NodeTypes = { flow: FlowNodeView, systemGroup: GroupNodeView };
const edgeTypes: EdgeTypes = { flow: FlowEdgeView };
const STATUSES = ['pending', 'active', 'done'] as const;
const GROUP_PADDING = 18;
const GROUP_LABEL_HEIGHT = 30;

type AnyNode = GraphNode | GroupNode;

interface Props {
  model: GraphModel;
  stepIndex: number;
  onNodeClick?: ((node: ModelNode) => void) | undefined;
  onEdgeClick?: ((edge: FlowEdge) => void) | undefined;
}

export function FlowGraph({ model, stepIndex, onNodeClick, onEdgeClick }: Props): JSX.Element {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const layout = useMemo(() => layoutFlow(model), [model]);
  const view = useMemo(() => stepView(model, stepIndex), [model, stepIndex]);

  const nodes = useMemo<AnyNode[]>(() => {
    const groups: GroupNode[] = model.groups.flatMap((group) => {
      const members = model.nodes.filter((n) => n.systemId === group.id && n.level === 'node');
      if (members.length === 0) return [];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const member of members) {
        const p = layout.positions.get(member.id);
        if (!p) continue;
        const size = NODE_SIZES[member.level];
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + size.width);
        maxY = Math.max(maxY, p.y + size.height);
      }
      return [
        {
          id: `group:${group.id}`,
          type: 'systemGroup',
          position: { x: minX - GROUP_PADDING, y: minY - GROUP_LABEL_HEIGHT },
          style: {
            width: maxX - minX + GROUP_PADDING * 2,
            height: maxY - minY + GROUP_LABEL_HEIGHT + GROUP_PADDING,
          },
          zIndex: -1,
          selectable: false,
          draggable: false,
          data: { kind: group.kind, label: group.label },
        },
      ];
    });

    const flowNodes: GraphNode[] = model.nodes.map((node) => ({
      id: node.id,
      type: 'flow',
      position: layout.positions.get(node.id) ?? { x: 0, y: 0 },
      draggable: true,
      data: {
        kind: node.kind,
        level: node.level,
        label: node.label,
        description: node.description,
        status: view.nodes.get(node.id) ?? 'pending',
      },
    }));

    return [...groups, ...flowNodes];
  }, [model, layout, view]);

  const edges = useMemo<GraphEdge[]>(
    () =>
      model.edges
        .filter((edge) => edge.from !== edge.to)
        .map((edge) => {
          const placement = layout.placements.get(edge.id);
          const backward = placement?.direction === 'backward';
          return {
            id: edge.id,
            type: 'flow',
            source: edge.from,
            target: edge.to,
            sourceHandle: backward ? 'out-left' : 'out-right',
            targetHandle: backward ? 'in-right' : 'in-left',
            data: {
              label: edge.label,
              payload: edge.payload,
              response: edge.response,
              status: view.edges.get(edge.id) ?? 'pending',
              offset: placement?.offset ?? 0,
              direction: placement?.direction ?? 'forward',
              hovered: hoveredEdge === edge.id,
            },
          };
        }),
    [model, layout, view, hoveredEdge],
  );

  const onEdgeMouseEnter = useCallback<EdgeMouseHandler<GraphEdge>>((_, edge) => {
    setHoveredEdge(edge.id);
  }, []);
  const onEdgeMouseLeave = useCallback<EdgeMouseHandler<GraphEdge>>(() => {
    setHoveredEdge(null);
  }, []);
  const handleNodeClick = useCallback<NodeMouseHandler<Node>>(
    (_, node) => {
      const found = model.nodes.find((n) => n.id === node.id);
      if (found) onNodeClick?.(found);
    },
    [model, onNodeClick],
  );
  const handleEdgeClick = useCallback<EdgeMouseHandler<GraphEdge>>(
    (_, edge) => {
      const found = model.edges.find((e) => e.id === edge.id);
      if (found) onEdgeClick?.(found);
    },
    [model, onEdgeClick],
  );

  return (
    <div className="graph">
      <svg className="graph__defs">
        <defs>
          {STATUSES.map((status) => (
            <marker
              key={status}
              id={`graph-arrow-${status}`}
              className={`graph-arrow is-${status}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          ))}
        </defs>
      </svg>
      <ReactFlow<AnyNode, GraphEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

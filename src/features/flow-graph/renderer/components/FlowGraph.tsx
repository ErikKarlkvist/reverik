import {
  Background,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
  ReactFlow,
} from '@xyflow/react';
import { type JSX, useCallback, useMemo, useState } from 'react';
import { type Flow, type FlowEdge, type FlowNode } from '@/common/model/flow';
import { layoutFlow } from '../../model/layout';
import { stepView } from '../../model/playback';
import { FlowEdgeView, type GraphEdge } from './FlowEdgeView';
import { FlowNodeView, type GraphNode } from './FlowNodeView';

const nodeTypes: NodeTypes = { flow: FlowNodeView };
const edgeTypes: EdgeTypes = { flow: FlowEdgeView };
const STATUSES = ['pending', 'active', 'done'] as const;

interface Props {
  flow: Flow;
  stepIndex: number;
  onSelectNode?: ((node: FlowNode) => void) | undefined;
  onSelectEdge?: ((edge: FlowEdge) => void) | undefined;
}

export function FlowGraph({ flow, stepIndex, onSelectNode, onSelectEdge }: Props): JSX.Element {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const layout = useMemo(() => layoutFlow(flow), [flow]);
  const view = useMemo(() => stepView(flow, stepIndex), [flow, stepIndex]);

  const nodes = useMemo<GraphNode[]>(
    () =>
      flow.nodes.map((node) => ({
        id: node.id,
        type: 'flow',
        position: layout.positions.get(node.id) ?? { x: 0, y: 0 },
        draggable: true,
        data: {
          kind: node.kind,
          label: node.label,
          description: node.description,
          status: view.nodes.get(node.id) ?? 'pending',
        },
      })),
    [flow, layout, view],
  );

  const edges = useMemo<GraphEdge[]>(
    () =>
      flow.edges.map((edge) => {
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
            hovered: hoveredEdge === edge.id,
          },
        };
      }),
    [flow, layout, view, hoveredEdge],
  );

  const onEdgeMouseEnter = useCallback<EdgeMouseHandler<GraphEdge>>((_, edge) => {
    setHoveredEdge(edge.id);
  }, []);
  const onEdgeMouseLeave = useCallback<EdgeMouseHandler<GraphEdge>>(() => {
    setHoveredEdge(null);
  }, []);
  const onNodeClick = useCallback<NodeMouseHandler<GraphNode>>(
    (_, node) => {
      const found = flow.nodes.find((n) => n.id === node.id);
      if (found) onSelectNode?.(found);
    },
    [flow, onSelectNode],
  );
  const onEdgeClick = useCallback<EdgeMouseHandler<GraphEdge>>(
    (_, edge) => {
      const found = flow.edges.find((e) => e.id === edge.id);
      if (found) onSelectEdge?.(found);
    },
    [flow, onSelectEdge],
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
      <ReactFlow<GraphNode, GraphEdge>
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
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

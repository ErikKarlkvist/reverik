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
import { layoutFlow } from '../../model/layout';
import { stepView } from '../../model/playback';
import { FlowEdgeView, type GraphEdge } from './FlowEdgeView';
import { FlowNodeView, type GraphNode } from './FlowNodeView';
import { GraphStateContext } from './GraphStateContext';
import { GroupNodeView, type GroupNode } from './GroupNodeView';

const nodeTypes: NodeTypes = { flow: FlowNodeView, systemGroup: GroupNodeView };
const edgeTypes: EdgeTypes = { flow: FlowEdgeView };
const STATUSES = ['pending', 'active', 'done'] as const;

type AnyNode = GraphNode | GroupNode;

interface Props {
  model: GraphModel;
  stepIndex: number;
  onNodeClick?: ((node: ModelNode) => void) | undefined;
  onEdgeClick?: ((edge: FlowEdge) => void) | undefined;
}

export function FlowGraph({ model, stepIndex, onNodeClick, onEdgeClick }: Props): JSX.Element {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const layout = useMemo(() => layoutFlow(model), [model]);
  const view = useMemo(() => stepView(model, stepIndex), [model, stepIndex]);

  const nodes = useMemo<AnyNode[]>(() => {
    const groups: GroupNode[] = model.groups.flatMap((group) => {
      const rect = layout.groupRects.get(group.id);
      if (!rect) return [];
      return [
        {
          id: `group:${group.id}`,
          type: 'systemGroup',
          position: { x: rect.x, y: rect.y },
          style: { width: rect.width, height: rect.height },
          zIndex: -1,
          selectable: false,
          draggable: false,
          data: { kind: group.kind, label: group.label },
        },
      ];
    });

    // Bara sådant som är stabilt över hover och uppspelning ligger i noddatan.
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
        tables: node.tables,
      },
    }));

    return [...groups, ...flowNodes];
  }, [model, layout]);

  const edges = useMemo<GraphEdge[]>(
    () =>
      model.edges
        .filter((edge) => edge.from !== edge.to)
        .map((edge) => {
          const placement = layout.placements.get(edge.id);
          const backward = placement?.direction === 'backward';
          const open = hoveredEdge === edge.id;
          return {
            id: edge.id,
            type: 'flow',
            source: edge.from,
            target: edge.to,
            // Öppen kant lyfts ovanför noder och andra kanter
            zIndex: open ? 1000 : 0,
            sourceHandle: backward ? 'out-left' : 'out-right',
            targetHandle: backward ? 'in-right' : 'in-left',
            data: {
              label: edge.label,
              payload: edge.payload,
              response: edge.response,
              status: view.edges.get(edge.id) ?? 'pending',
              offset: placement?.offset ?? 0,
              direction: placement?.direction ?? 'forward',
              hovered: open,
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
  const onNodeMouseEnter = useCallback<NodeMouseHandler<Node>>((_, node) => {
    setHoveredNode(node.id);
  }, []);
  const onNodeMouseLeave = useCallback<NodeMouseHandler<Node>>(() => {
    setHoveredNode(null);
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

  const graphState = useMemo(() => ({ hoveredNodeId: hoveredNode, view }), [hoveredNode, view]);

  return (
    <div className="graph">
      <GraphStateContext.Provider value={graphState}>
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
          elevateEdgesOnSelect
          proOptions={{ hideAttribution: true }}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
        >
          <Background gap={24} size={1} />
        </ReactFlow>
      </GraphStateContext.Provider>
    </div>
  );
}

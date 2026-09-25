import {
  type Flow,
  type FlowEdge,
  type FlowStep,
  type NodeKind,
  type SourceRef,
  type SystemKind,
} from '@/common/model/flow';

export type GraphKind = NodeKind | SystemKind;
export type GraphLevel = 'system' | 'node';

/** En ritad nod: antingen ett helt system eller en enskild nod i koden. */
export interface GraphNode {
  id: string;
  level: GraphLevel;
  kind: GraphKind;
  label: string;
  description: string | undefined;
  source: SourceRef | undefined;
  /** Systemet noden tillhör eller är */
  systemId: string;
}

/** Ram runt noderna i ett system i detaljvyn. */
export interface GraphGroup {
  id: string;
  kind: SystemKind;
  label: string;
}

/**
 * Det som ritas. Kanterna behåller sina id:n från flödet så stegen kan
 * spelas upp oförändrade oavsett nivå. En kant vars båda ändar hamnar på
 * samma nod är intern och ritas inte, men markerar noden när steget spelas.
 */
export interface GraphModel {
  nodes: GraphNode[];
  edges: FlowEdge[];
  steps: FlowStep[];
  groups: GraphGroup[];
}

export type GraphView =
  { kind: 'system' } | { kind: 'focus'; systemId: string } | { kind: 'detail' };

export function buildModel(flow: Flow, view: GraphView): GraphModel {
  switch (view.kind) {
    case 'system':
      return collapse(flow, () => true);
    case 'focus':
      return collapse(flow, (systemId) => systemId !== view.systemId);
    case 'detail':
      return collapse(flow, () => false);
  }
}

/** Slår ihop noderna i de system `shouldCollapse` säger ja till, till en nod per system. */
function collapse(flow: Flow, shouldCollapse: (systemId: string) => boolean): GraphModel {
  const nodeToTarget = new Map<string, string>();
  const nodes: GraphNode[] = [];
  const groups: GraphGroup[] = [];

  for (const system of flow.systems) {
    const members = flow.nodes.filter((n) => n.system === system.id);
    if (shouldCollapse(system.id)) {
      nodes.push({
        id: system.id,
        level: 'system',
        kind: system.kind,
        label: system.label,
        description: system.description,
        source: undefined,
        systemId: system.id,
      });
      for (const member of members) nodeToTarget.set(member.id, system.id);
    } else {
      if (members.length > 0)
        groups.push({ id: system.id, kind: system.kind, label: system.label });
      for (const member of members) {
        nodes.push({
          id: member.id,
          level: 'node',
          kind: member.kind,
          label: member.label,
          description: member.description,
          source: member.source,
          systemId: system.id,
        });
        nodeToTarget.set(member.id, member.id);
      }
    }
  }

  const edges = flow.edges.map((edge) => ({
    ...edge,
    from: nodeToTarget.get(edge.from) ?? edge.from,
    to: nodeToTarget.get(edge.to) ?? edge.to,
  }));

  return { nodes, edges, steps: flow.steps, groups };
}

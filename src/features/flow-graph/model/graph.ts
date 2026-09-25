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
 * Det som ritas. Kanterna behåller sina id:n från flödet. En kant vars båda
 * ändar hamnar på samma nod är intern för ett hopslaget system: den ritas
 * inte och dess steg spelas inte upp på den här nivån. `steps` är därför
 * en delmängd av flödets steg, samma objekt, så positionen kan följa med
 * när vyn byts.
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
    // Ett system utan noder deltar inte i flödet och ritas inte
    if (members.length === 0) continue;
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
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  const steps = flow.steps.filter((step) => {
    const edge = edgeById.get(step.edgeId);
    return !edge || edge.from !== edge.to;
  });

  return { nodes, edges, steps, groups };
}

/**
 * Hittar motsvarande steg i en annan modell: samma steg om det finns, annars
 * det närmast föregående steget i flödet som finns i målmodellen.
 */
export function mapStepIndex(
  flow: Flow,
  from: GraphModel,
  fromIndex: number,
  to: GraphModel,
): number {
  const step = from.steps[fromIndex];
  if (!step) return 0;
  const direct = to.steps.indexOf(step);
  if (direct !== -1) return direct;
  const original = flow.steps.indexOf(step);
  let best = 0;
  to.steps.forEach((candidate, i) => {
    if (flow.steps.indexOf(candidate) <= original) best = i;
  });
  return best;
}

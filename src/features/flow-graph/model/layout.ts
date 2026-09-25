import dagre from '@dagrejs/dagre';
import { type GraphLevel } from './graph';

export interface Size {
  width: number;
  height: number;
}

export const NODE_SIZES: Readonly<Record<GraphLevel, Size>> = {
  node: { width: 190, height: 58 },
  system: { width: 220, height: 76 },
};

export interface Point {
  x: number;
  y: number;
}

export type Direction = 'forward' | 'backward';

export interface EdgePlacement {
  /** Går kanten åt höger (forward) eller tillbaka åt vänster (backward) */
  direction: Direction;
  /** Förskjutning i pixlar för att skilja parallella kanter mellan samma noder */
  offset: number;
}

export interface Rect extends Point, Size {}

export interface Layout {
  /** Övre vänstra hörnet per nod-id */
  positions: Map<string, Point>;
  placements: Map<string, EdgePlacement>;
  /** Ram per grupp-id, beräknad av layouten så grupperna hålls ihop */
  groupRects: Map<string, Rect>;
}

/** Det layouten behöver veta om en graf. */
export interface LayoutInput {
  nodes: readonly { id: string; level: GraphLevel; systemId: string }[];
  edges: readonly { id: string; from: string; to: string }[];
  groups: readonly { id: string }[];
}

const GROUP_PADDING = 18;
const GROUP_LABEL_HEIGHT = 30;

const PARALLEL_GAP = 34;

/** Placerar noderna vänster till höger med dagre och räknar ut kanternas riktning och förskjutning. */
export function layoutFlow(input: LayoutInput): Layout {
  const graph = new dagre.graphlib.Graph({ compound: true });
  graph.setGraph({ rankdir: 'LR', nodesep: 44, ranksep: 190, marginx: 20, marginy: 20 });
  graph.setDefaultEdgeLabel(() => ({}));

  // Grupper blir kluster så dagre håller ihop ett systems noder.
  const groupIds = new Set(input.groups.map((g) => g.id));
  for (const id of groupIds) {
    graph.setNode(clusterId(id), {
      paddingLeft: GROUP_PADDING,
      paddingRight: GROUP_PADDING,
      paddingTop: GROUP_LABEL_HEIGHT,
      paddingBottom: GROUP_PADDING,
    });
  }
  // dagre skriver koordinater in i objektet, så varje nod måste få sin egen kopia.
  for (const node of input.nodes) {
    graph.setNode(node.id, { ...NODE_SIZES[node.level] });
    if (node.level === 'node' && groupIds.has(node.systemId)) {
      graph.setParent(node.id, clusterId(node.systemId));
    }
  }
  // Bara framåtriktade kanter påverkar rangordningen. En kant är "framåt" första
  // gången paret ses, så svar tillbaka inte drar isär layouten. Självkanter ignoreras.
  const seenPairs = new Set<string>();
  for (const edge of input.edges) {
    const key = pairKey(edge.from, edge.to);
    if (seenPairs.has(key) || edge.from === edge.to) continue;
    seenPairs.add(key);
    graph.setEdge(edge.from, edge.to);
  }
  dagre.layout(graph);

  const positions = new Map<string, Point>();
  for (const node of input.nodes) {
    // dagre ger centrum, React Flow vill ha övre vänstra hörnet
    const placed = graph.node(node.id) as Point;
    const size = NODE_SIZES[node.level];
    positions.set(node.id, { x: placed.x - size.width / 2, y: placed.y - size.height / 2 });
  }

  const groupRects = new Map<string, Rect>();
  for (const id of groupIds) {
    const cluster = graph.node(clusterId(id)) as Point & Size;
    groupRects.set(id, {
      x: cluster.x - cluster.width / 2,
      y: cluster.y - cluster.height / 2,
      width: cluster.width,
      height: cluster.height,
    });
  }

  return { positions, placements: placeEdges(input, positions), groupRects };
}

function clusterId(groupId: string): string {
  return `cluster:${groupId}`;
}

function placeEdges(input: LayoutInput, positions: Map<string, Point>): Map<string, EdgePlacement> {
  const groups = new Map<string, string[]>();
  for (const edge of input.edges) {
    const key = pairKey(edge.from, edge.to);
    const group = groups.get(key) ?? [];
    group.push(edge.id);
    groups.set(key, group);
  }

  const placements = new Map<string, EdgePlacement>();
  for (const edge of input.edges) {
    const group = groups.get(pairKey(edge.from, edge.to)) ?? [edge.id];
    const index = group.indexOf(edge.id);
    const offset = (index - (group.length - 1) / 2) * PARALLEL_GAP;
    const fromX = positions.get(edge.from)?.x ?? 0;
    const toX = positions.get(edge.to)?.x ?? 0;
    placements.set(edge.id, { direction: toX >= fromX ? 'forward' : 'backward', offset });
  }
  return placements;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

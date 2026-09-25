import dagre from '@dagrejs/dagre';
import { type Flow } from '@/common/model/flow';

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 58;

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

export interface Layout {
  /** Övre vänstra hörnet per nod-id */
  positions: Map<string, Point>;
  placements: Map<string, EdgePlacement>;
}

const PARALLEL_GAP = 34;

/** Placerar noderna vänster till höger med dagre och räknar ut kanternas riktning och förskjutning. */
export function layoutFlow(flow: Flow): Layout {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 90, marginx: 20, marginy: 20 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of flow.nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  // Bara framåtriktade kanter påverkar rangordningen. En kant är "framåt" första
  // gången paret ses, så svar tillbaka inte drar isär layouten.
  const seenPairs = new Set<string>();
  for (const edge of flow.edges) {
    const key = pairKey(edge.from, edge.to);
    if (seenPairs.has(key) || edge.from === edge.to) continue;
    seenPairs.add(key);
    graph.setEdge(edge.from, edge.to);
  }
  dagre.layout(graph);

  const positions = new Map<string, Point>();
  for (const node of flow.nodes) {
    // dagre ger centrum, React Flow vill ha övre vänstra hörnet
    const placed = graph.node(node.id) as Point;
    positions.set(node.id, { x: placed.x - NODE_WIDTH / 2, y: placed.y - NODE_HEIGHT / 2 });
  }

  return { positions, placements: placeEdges(flow, positions) };
}

function placeEdges(flow: Flow, positions: Map<string, Point>): Map<string, EdgePlacement> {
  const groups = new Map<string, string[]>();
  for (const edge of flow.edges) {
    const key = pairKey(edge.from, edge.to);
    const group = groups.get(key) ?? [];
    group.push(edge.id);
    groups.set(key, group);
  }

  const placements = new Map<string, EdgePlacement>();
  for (const edge of flow.edges) {
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

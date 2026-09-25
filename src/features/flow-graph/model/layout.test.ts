import { describe, expect, it } from 'vitest';
import { addTodoFlow, listTodosFlow } from '@/common/model/fixtures';
import { buildModel, groupEdges, visualEdgeId } from './graph';
import { layoutFlow, NODE_SIZES } from './layout';

describe('layoutFlow', () => {
  const detail = buildModel(addTodoFlow, { kind: 'detail' });

  it('ger varje nod en position', () => {
    const { positions } = layoutFlow(detail);
    expect(positions.size).toBe(detail.nodes.length);
    for (const p of positions.values()) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });

  it('lägger UI till vänster om backend', () => {
    const { positions } = layoutFlow(detail);
    const form = positions.get('add-form');
    const db = positions.get('table:postgres:todos');
    expect(form && db && form.x + NODE_SIZES.node.width <= db.x).toBe(true);
  });

  it('markerar svar som bakåtriktade', () => {
    const { placements } = layoutFlow(detail);
    expect(placements.get('post')?.direction).toBe('forward');
    expect(placements.get('respond')?.direction).toBe('backward');
  });

  it('förskjuter linjerna fram och tillbaka mellan samma noder', () => {
    const model = buildModel(listTodosFlow, { kind: 'detail' });
    const { placements } = layoutFlow({ ...model, edges: groupEdges(model.edges) });
    const forward = placements.get(visualEdgeId('todos-api', 'get-route'))?.offset ?? 0;
    const back = placements.get(visualEdgeId('get-route', 'todos-api'))?.offset ?? 0;
    expect(forward).not.toBe(back);
  });

  it('håller ihop grupper och lägger inte fristående system inuti dem', () => {
    const { positions, groupRects } = layoutFlow(detail);
    const backend = groupRects.get('backend');
    expect(backend).toBeDefined();
    if (!backend) return;
    for (const node of detail.nodes.filter((n) => n.systemId !== 'backend')) {
      const p = positions.get(node.id);
      if (!p) throw new Error(node.id);
      const size = NODE_SIZES[node.level];
      const inside =
        p.x + size.width > backend.x &&
        p.x < backend.x + backend.width &&
        p.y + size.height > backend.y &&
        p.y < backend.y + backend.height;
      expect(inside, `${node.id} ligger inuti backend-ramen`).toBe(false);
    }
  });

  it('klarar systemvyn med självkanter', () => {
    const system = buildModel(addTodoFlow, { kind: 'system' });
    const { positions } = layoutFlow(system);
    expect(positions.size).toBe(system.nodes.length);
    const frontend = positions.get('frontend');
    const backend = positions.get('backend');
    expect(frontend && backend && frontend.x < backend.x).toBe(true);
  });
});

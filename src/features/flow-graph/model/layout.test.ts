import { describe, expect, it } from 'vitest';
import { addTodoFlow, listTodosFlow } from '@/common/model/fixtures';
import { layoutFlow, NODE_WIDTH } from './layout';

describe('layoutFlow', () => {
  it('ger varje nod en position utan överlapp i x-led per rang', () => {
    const { positions } = layoutFlow(addTodoFlow);
    expect(positions.size).toBe(addTodoFlow.nodes.length);
    for (const p of positions.values()) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });

  it('lägger UI till vänster om backend', () => {
    const { positions } = layoutFlow(addTodoFlow);
    const form = positions.get('add-form');
    const db = positions.get('postgres');
    expect(form && db && form.x + NODE_WIDTH <= db.x).toBe(true);
  });

  it('markerar svar som bakåtriktade', () => {
    const { placements } = layoutFlow(addTodoFlow);
    expect(placements.get('post')?.direction).toBe('forward');
    expect(placements.get('respond')?.direction).toBe('backward');
  });

  it('förskjuter parallella kanter mellan samma noder', () => {
    const { placements } = layoutFlow(listTodosFlow);
    const get = placements.get('cache-get')?.offset ?? 0;
    const set = placements.get('cache-set')?.offset ?? 0;
    expect(get).not.toBe(set);
  });
});

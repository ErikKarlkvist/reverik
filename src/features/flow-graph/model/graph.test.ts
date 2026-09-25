import { describe, expect, it } from 'vitest';
import { addTodoFlow } from '@/common/model/fixtures';
import { buildModel } from './graph';

describe('buildModel', () => {
  it('systemvyn har en nod per system och kanterna pekar på system', () => {
    const model = buildModel(addTodoFlow, { kind: 'system' });
    expect(model.nodes.map((n) => n.id)).toEqual(addTodoFlow.systems.map((s) => s.id));
    expect(model.nodes.every((n) => n.level === 'system')).toBe(true);
    const post = model.edges.find((e) => e.id === 'post');
    expect(post).toMatchObject({ from: 'frontend', to: 'backend' });
    // Steg och kant-id:n är orörda
    expect(model.steps).toBe(addTodoFlow.steps);
    expect(model.edges.map((e) => e.id)).toEqual(addTodoFlow.edges.map((e) => e.id));
  });

  it('interna anrop blir självkanter i systemvyn', () => {
    const model = buildModel(addTodoFlow, { kind: 'system' });
    const internal = model.edges.find((e) => e.id === 'route-to-service');
    expect(internal).toMatchObject({ from: 'backend', to: 'backend' });
  });

  it('fokus på ett system visar dess noder och de andra som system', () => {
    const model = buildModel(addTodoFlow, { kind: 'focus', systemId: 'backend' });
    const backendNodes = model.nodes.filter((n) => n.systemId === 'backend');
    expect(backendNodes.every((n) => n.level === 'node')).toBe(true);
    expect(backendNodes.map((n) => n.id)).toEqual([
      'post-route',
      'todo-service',
      'todo-repository',
    ]);
    expect(model.nodes.find((n) => n.id === 'frontend')?.level).toBe('system');
    expect(model.edges.find((e) => e.id === 'post')).toMatchObject({
      from: 'frontend',
      to: 'post-route',
    });
    expect(model.groups.map((g) => g.id)).toEqual(['backend']);
  });

  it('detaljvyn har alla noder och en grupp per system med noder', () => {
    const model = buildModel(addTodoFlow, { kind: 'detail' });
    expect(model.nodes).toHaveLength(addTodoFlow.nodes.length);
    expect(model.groups).toHaveLength(addTodoFlow.systems.length);
  });
});

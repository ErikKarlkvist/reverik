import { describe, expect, it } from 'vitest';
import { addTodoFlow } from '@/common/model/fixtures';
import { buildModel, mapStepIndex } from './graph';

describe('buildModel', () => {
  it('systemvyn har en nod per system och kanterna pekar på system', () => {
    const model = buildModel(addTodoFlow, { kind: 'system' });
    expect(model.nodes.map((n) => n.id)).toEqual(addTodoFlow.systems.map((s) => s.id));
    expect(model.nodes.every((n) => n.level === 'system')).toBe(true);
    const post = model.edges.find((e) => e.id === 'post');
    expect(post).toMatchObject({ from: 'frontend', to: 'backend' });
    // Kant-id:n är orörda, men bara steg mellan system spelas upp
    expect(model.edges.map((e) => e.id)).toEqual(addTodoFlow.edges.map((e) => e.id));
    expect(model.steps.map((s) => s.edgeId)).toEqual([
      'post',
      'insert',
      'invalidate',
      'notify',
      'respond',
    ]);
  });

  it('ritar inte system som saknar noder', () => {
    const flow = {
      ...addTodoFlow,
      systems: [...addTodoFlow.systems, { id: 'mars', kind: 'external' as const, label: 'Mars' }],
    };
    const model = buildModel(flow, { kind: 'system' });
    expect(model.nodes.map((n) => n.id)).not.toContain('mars');
  });

  it('samlar tabeller med anropen som rör dem, även på systemnivå', () => {
    const system = buildModel(addTodoFlow, { kind: 'system' });
    const postgres = system.nodes.find((n) => n.id === 'postgres');
    expect(postgres?.tables.map((t) => t.name)).toEqual(['lists', 'todos']);
    const todos = postgres?.tables.find((t) => t.name === 'todos');
    expect(todos?.touchedBy.map((t) => t.edgeId)).toEqual(['insert']);
    expect(todos?.columns?.map((c) => c.name)).toContain('created_at');
    const frontend = system.nodes.find((n) => n.id === 'frontend');
    expect(frontend?.tables).toEqual([]);
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

  it('fokus spelar upp stegen i systemet och över gränsen, inte andras interna', () => {
    const model = buildModel(addTodoFlow, { kind: 'focus', systemId: 'backend' });
    expect(model.steps.map((s) => s.edgeId)).toEqual([
      'post',
      'route-to-service',
      'service-to-repo',
      'insert',
      'invalidate',
      'notify',
      'respond',
    ]);
  });

  it('inzoomad databas visar tabeller som noder med relationer', () => {
    const model = buildModel(addTodoFlow, { kind: 'focus', systemId: 'postgres' });
    const tables = model.nodes.filter((n) => n.level === 'table');
    expect(tables.map((n) => n.label)).toEqual(['lists', 'todos']);
    expect(model.nodes.find((n) => n.id === 'postgres')).toBeUndefined();
    expect(model.relations).toEqual([
      {
        id: 'relation:postgres:todos.list_id',
        from: 'table:postgres:todos',
        to: 'table:postgres:lists',
        label: 'list_id → id',
      },
    ]);
    // Insert-anropet pekar på tabellen todos, inte på databasnoden
    expect(model.edges.find((e) => e.id === 'insert')?.to).toBe('table:postgres:todos');
    expect(model.groups.map((g) => g.id)).toEqual(['postgres']);
  });

  it('detaljvyn har alla noder, alla steg och en grupp per system med noder', () => {
    const model = buildModel(addTodoFlow, { kind: 'detail' });
    // Postgres-noden ersätts av sina två tabeller, Redis-noden av sin nyckel
    expect(model.nodes).toHaveLength(addTodoFlow.nodes.length + 1);
    expect(model.steps).toHaveLength(addTodoFlow.steps.length);
    expect(model.groups).toHaveLength(addTodoFlow.systems.length);
  });
});

describe('mapStepIndex', () => {
  const system = buildModel(addTodoFlow, { kind: 'system' });
  const detail = buildModel(addTodoFlow, { kind: 'detail' });

  it('behåller samma steg när det finns i båda vyerna', () => {
    // 'insert' är steg 5 i detaljvyn (index 5) och steg 1 i systemvyn
    expect(mapStepIndex(addTodoFlow, detail, 5, system)).toBe(1);
    expect(mapStepIndex(addTodoFlow, system, 1, detail)).toBe(5);
  });

  it('faller tillbaka på närmast föregående steg', () => {
    // 'route-to-service' (index 3 i detalj) är internt, närmast före i systemvyn är 'post'
    expect(mapStepIndex(addTodoFlow, detail, 3, system)).toBe(0);
  });

  it('börjar från början om inget tidigare steg finns', () => {
    // 'submit' (index 0) är internt och inget systemsteg ligger före
    expect(mapStepIndex(addTodoFlow, detail, 0, system)).toBe(0);
  });
});

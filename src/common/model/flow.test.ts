import { describe, expect, it } from 'vitest';
import { addTodoFlow, demoFlows } from './fixtures';
import { type Flow, type NodeKind, nodeKindSchema, validateFlow } from './flow';

function errorsOf(input: unknown): string[] {
  const result = validateFlow(input);
  return result.ok ? [] : result.errors;
}

describe('fixturer', () => {
  for (const flow of demoFlows) {
    it(`${flow.title} validerar`, () => {
      expect(validateFlow(flow)).toEqual({ ok: true, flow });
    });
  }

  it('täcker tillsammans alla nodtyper utom queue', () => {
    const kinds = new Set<NodeKind>(demoFlows.flatMap((f) => f.nodes.map((n) => n.kind)));
    for (const kind of nodeKindSchema.options) {
      if (kind !== 'queue') expect(kinds).toContain(kind);
    }
  });
});

describe('validateFlow', () => {
  const base: Flow = addTodoFlow;

  it('avvisar kant som pekar på okänd nod', () => {
    const flow = { ...base, edges: [{ ...base.edges[0], to: 'finns-inte' }] };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('okänd nod "finns-inte"'));
  });

  it('avvisar nod som tillhör okänt system', () => {
    const [first, ...rest] = base.nodes;
    const flow = { ...base, nodes: [{ ...first, system: 'mars' }, ...rest] };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('okänt system "mars"'));
  });

  it('avvisar system som ingen nod tillhör', () => {
    const flow = {
      ...base,
      systems: [...base.systems, { id: 'mars', kind: 'external', label: 'Mars' }],
    };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('"mars" har inga noder'));
  });

  it('avvisar steg som pekar på okänd kant', () => {
    const flow = { ...base, steps: [{ edgeId: 'nope', description: 'x' }] };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('okänd kant "nope"'));
  });

  it('avvisar dubbla id:n', () => {
    const [first] = base.nodes;
    const flow = { ...base, nodes: [...base.nodes, { ...first }] };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('mer än en gång'));
  });

  it('kräver källhänvisning på kod i repot men inte på db, cache och externa system', () => {
    const [form] = base.nodes;
    const withoutSource = { ...form, source: undefined };
    expect(errorsOf({ ...base, nodes: [withoutSource, ...base.nodes.slice(1)] })).toContainEqual(
      expect.stringContaining('måste ha en källhänvisning'),
    );
    for (const kind of ['db', 'cache', 'external'] as const) {
      expect(base.nodes.find((n) => n.kind === kind)?.source).toBeUndefined();
    }
  });

  it('ger läsbara fel med sökväg', () => {
    const errors = errorsOf({ ...base, edges: [] });
    expect(errors[0]).toMatch(/^edges: /);
  });

  it('avvisar skräp', () => {
    expect(validateFlow(null).ok).toBe(false);
    expect(validateFlow({}).ok).toBe(false);
  });
});

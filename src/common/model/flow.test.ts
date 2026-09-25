import { describe, expect, it } from 'vitest';
import { addToCartFlow } from './fixtures/add-to-cart';
import { type Flow, nodeKindSchema, validateFlow } from './flow';

function errorsOf(input: unknown): string[] {
  const result = validateFlow(input);
  return result.ok ? [] : result.errors;
}

describe('fixture add-to-cart', () => {
  it('validerar mot schemat', () => {
    expect(validateFlow(addToCartFlow)).toEqual({ ok: true, flow: addToCartFlow });
  });

  it('täcker alla nodtyper', () => {
    const kinds = new Set(addToCartFlow.nodes.map((n) => n.kind));
    for (const kind of nodeKindSchema.options) expect(kinds).toContain(kind);
  });
});

describe('validateFlow', () => {
  const base: Flow = addToCartFlow;

  it('avvisar kant som pekar på okänd nod', () => {
    const flow = { ...base, edges: [{ ...base.edges[0], to: 'finns-inte' }] };
    expect(errorsOf(flow)).toContainEqual(expect.stringContaining('okänd nod "finns-inte"'));
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

  it('kräver källhänvisning på kod i repot men inte på externa system', () => {
    const [button] = base.nodes;
    const withoutSource = { ...button, source: undefined };
    expect(errorsOf({ ...base, nodes: [withoutSource, ...base.nodes.slice(1)] })).toContainEqual(
      expect.stringContaining('måste ha en källhänvisning'),
    );
    const external = base.nodes.find((n) => n.kind === 'external');
    expect(external?.source).toBeUndefined();
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

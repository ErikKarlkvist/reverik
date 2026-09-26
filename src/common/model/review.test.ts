import { describe, expect, it } from 'vitest';
import { addTodoReview, addTodoWithListFlow } from './fixtures/add-todo-review';
import { validateFlow } from './flow';
import {
  diffFlows,
  mergeForReview,
  reviewSchema,
  sortFindings,
  validateReviewDocument,
  worstSeverity,
} from './review';

describe('review-fixturen', () => {
  it('validerar mot schemat och head-flödet mot flödesschemat', () => {
    expect(reviewSchema.safeParse(addTodoReview).success).toBe(true);
    expect(validateFlow(addTodoWithListFlow).ok).toBe(true);
  });

  it('pekar bara på noder och kanter som finns i head eller base', () => {
    const nodeIds = new Set(
      [...addTodoWithListFlow.nodes, ...addTodoReview.base.nodes].map((n) => n.id),
    );
    const edgeIds = new Set(
      [...addTodoWithListFlow.edges, ...addTodoReview.base.edges].map((e) => e.id),
    );
    for (const finding of addTodoReview.findings) {
      if (finding.nodeId) expect(nodeIds.has(finding.nodeId), finding.id).toBe(true);
      if (finding.edgeId) expect(edgeIds.has(finding.edgeId), finding.id).toBe(true);
    }
  });
});

describe('diffFlows', () => {
  const diff = diffFlows(addTodoReview.base, addTodoWithListFlow);

  it('hittar tillagt, borttaget och ändrat', () => {
    expect(diff.nodes.get('list-repository')).toBe('added');
    expect(diff.edges.get('check-list')).toBe('added');
    expect(diff.edges.get('invalidate')).toBe('removed');
    expect(diff.edges.get('post')).toBe('changed');
    expect(diff.edges.get('respond')).toBeUndefined();
    expect(diff.nodes.get('webhook')).toBeUndefined();
  });

  it('är tom när flödena är lika', () => {
    const same = diffFlows(addTodoWithListFlow, addTodoWithListFlow);
    expect(same.nodes.size).toBe(0);
    expect(same.edges.size).toBe(0);
  });
});

describe('mergeForReview', () => {
  it('lägger till det borttagna utan att spela upp det', () => {
    const diff = diffFlows(addTodoReview.base, addTodoWithListFlow);
    const merged = mergeForReview(addTodoWithListFlow, addTodoReview.base, diff);
    expect(merged.edges.some((e) => e.id === 'invalidate')).toBe(true);
    expect(merged.steps).toBe(addTodoWithListFlow.steps);
    expect(validateFlow(merged).ok).toBe(true);
  });
});

describe('findings', () => {
  it('sorterar allvarligast först', () => {
    const sorted = sortFindings(addTodoReview.findings);
    expect(sorted[0]?.severity).toBe('error');
    expect(worstSeverity(addTodoReview.findings)).toBe('error');
    expect(worstSeverity([])).toBeNull();
  });
});

describe('validateReviewDocument', () => {
  it('delar upp dokumentet i flöde och review', () => {
    const result = validateReviewDocument({
      baseLabel: 'main',
      headLabel: 'feature',
      base: addTodoReview.base,
      head: addTodoWithListFlow,
      findings: addTodoReview.findings,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.flow.title).toBe('Add todo to a list');
    expect(result.review.findings).toHaveLength(4);
  });

  it('ger läsbara fel', () => {
    const result = validateReviewDocument({ baseLabel: 'main', head: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith('headLabel'))).toBe(true);
  });
});

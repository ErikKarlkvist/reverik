import { describe, expect, it } from 'vitest';
import { defaultBaseBranch } from './branches';

describe('defaultBaseBranch', () => {
  const branches = ['develop', 'feature/x', 'main'];

  it('behåller ett tidigare val som finns kvar och inte är den utcheckade', () => {
    expect(defaultBaseBranch(branches, 'feature/x', 'develop')).toBe('develop');
    expect(defaultBaseBranch(branches, 'develop', 'develop')).toBe('main');
  });

  it('föredrar main eller master', () => {
    expect(defaultBaseBranch(branches, 'feature/x', null)).toBe('main');
    expect(defaultBaseBranch(['master', 'topic'], 'topic', null)).toBe('master');
  });

  it('tar första andra branchen annars, och null om ingen finns', () => {
    expect(defaultBaseBranch(['a', 'b'], 'a', null)).toBe('b');
    expect(defaultBaseBranch(['main'], 'main', null)).toBeNull();
  });
});

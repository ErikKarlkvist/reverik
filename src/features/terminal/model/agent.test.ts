import { describe, expect, it } from 'vitest';
import { AGENTS, agentStartCommand } from './agent';

describe('agentStartCommand', () => {
  it('gives claude the guide as system prompt', () => {
    expect(agentStartCommand('claude', '.reverik/instructions.md')).toBe(
      'claude --append-system-prompt-file .reverik/instructions.md',
    );
  });

  it('points codex at the guide in its first prompt', () => {
    expect(agentStartCommand('codex', '.reverik/instructions.md')).toContain(
      'codex "Read .reverik/instructions.md',
    );
  });

  it('starts nothing for a plain shell', () => {
    expect(agentStartCommand('shell', '.reverik/instructions.md')).toBeNull();
  });

  it('has a command decision for every agent', () => {
    for (const agent of AGENTS) expect(() => agentStartCommand(agent, 'x')).not.toThrow();
  });
});

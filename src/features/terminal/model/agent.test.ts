import { describe, expect, it } from 'vitest';
import { AGENTS, agentStartCommand } from './agent';

describe('agentStartCommand', () => {
  it('gives claude the guide as system prompt', () => {
    expect(agentStartCommand('claude', '.reverik/README.md')).toBe(
      'claude --append-system-prompt-file .reverik/README.md',
    );
  });

  it('points codex at the guide in its first prompt', () => {
    expect(agentStartCommand('codex', '.reverik/README.md')).toContain(
      'codex "Read .reverik/README.md',
    );
  });

  it('starts nothing for a plain shell', () => {
    expect(agentStartCommand('shell', '.reverik/README.md')).toBeNull();
  });

  it('has a command decision for every agent', () => {
    for (const agent of AGENTS) expect(() => agentStartCommand(agent, 'x')).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { AGENTS, agentStartCommand } from './agent';

describe('agentStartCommand', () => {
  it('gives claude the guide as system prompt', () => {
    expect(agentStartCommand('claude', '.highai/README.md')).toBe(
      'claude --append-system-prompt-file .highai/README.md',
    );
  });

  it('points codex at the guide in its first prompt', () => {
    expect(agentStartCommand('codex', '.highai/README.md')).toContain(
      'codex "Read .highai/README.md',
    );
  });

  it('starts nothing for a plain shell', () => {
    expect(agentStartCommand('shell', '.highai/README.md')).toBeNull();
  });

  it('has a command decision for every agent', () => {
    for (const agent of AGENTS) expect(() => agentStartCommand(agent, 'x')).not.toThrow();
  });
});

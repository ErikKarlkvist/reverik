import { describe, expect, it } from 'vitest';
import { addTodoFlow } from '@/common/model/fixtures';
import { buildAskPrompt } from './ask';
import { buildModel } from './graph';

describe('buildAskPrompt', () => {
  it('describes a node with its source and the flow file', () => {
    const model = buildModel(addTodoFlow, { kind: 'detail' });
    const node = model.nodes.find((n) => n.id === 'todo-service');
    if (!node) throw new Error('node missing');
    const prompt = buildAskPrompt(
      addTodoFlow,
      { kind: 'node', node },
      ' what if this throws? ',
      '.highai/flows/add-todo.json',
    );
    expect(prompt).toBe(
      'About the node "TodoService.create" (backend/src/services/TodoService.ts:21) in the flow "Add todo" (saved as .highai/flows/add-todo.json, update it if the answer changes the flow): what if this throws?',
    );
  });

  it('describes a call with both ends by label', () => {
    const edge = addTodoFlow.edges.find((e) => e.id === 'post');
    if (!edge) throw new Error('edge missing');
    const prompt = buildAskPrompt(
      addTodoFlow,
      { kind: 'edge', edge },
      'is this retried?',
      undefined,
    );
    expect(prompt).toContain(
      'About the call "POST /api/todos" from "todosApi.createTodo" to "POST /api/todos"',
    );
    expect(prompt).toContain('in the flow "Add todo": is this retried?');
    expect(prompt).not.toContain('saved as');
  });

  it('omits the source for nodes without one', () => {
    const model = buildModel(addTodoFlow, { kind: 'system' });
    const node = model.nodes[0];
    if (!node) throw new Error('node missing');
    expect(buildAskPrompt(addTodoFlow, { kind: 'node', node }, 'x', undefined)).not.toContain('(');
  });
});

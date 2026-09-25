import { type Flow } from '../flow';
import { addTodoFlow } from './add-todo';
import { listTodosFlow } from './list-todos';

/** Alla fixturer, pekar på demo/todo-app. */
export const demoFlows: readonly Flow[] = [addTodoFlow, listTodosFlow];

/** Sökväg till demo-repot relativt Highai-roten. */
export const DEMO_REPO_RELATIVE_PATH = 'demo/todo-app';

export { addTodoFlow, listTodosFlow };

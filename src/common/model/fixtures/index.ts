import { type Flow } from '../flow';
import { type Review } from '../review';
import { addTodoFlow } from './add-todo';
import { addTodoReview, addTodoWithListFlow } from './add-todo-review';
import { listTodosFlow } from './list-todos';

/** En inbyggd analys: ett flöde, och för reviewer även jämförelsen mot base. */
export interface DemoAnalysis {
  flow: Flow;
  review?: Review;
}

/** Alla fixturer, pekar på demo/todo-app. */
export const demoFlows: readonly Flow[] = [addTodoFlow, listTodosFlow, addTodoWithListFlow];

/** De inbyggda analyserna i den ordning de visas. */
export const demoAnalyses: readonly DemoAnalysis[] = [
  { flow: addTodoFlow },
  { flow: listTodosFlow },
  { flow: addTodoWithListFlow, review: addTodoReview },
];

/** Sökväg till demo-repot relativt Reverik-roten. */
export const DEMO_REPO_RELATIVE_PATH = 'demo/todo-app';

export { addTodoFlow, addTodoReview, addTodoWithListFlow, listTodosFlow };

import { createContext, useContext } from 'react';
import { type StepStatus, type StepView } from '../../model/playback';

/**
 * Tillstånd som ändras ofta, hover och uppspelningssteg, delas via context i
 * stället för via noddata. Då förblir React Flows nodobjekt stabila, annars
 * gömmer React Flow noderna tills de mätts om och hela grafen blinkar.
 */
export interface GraphState {
  hoveredNodeId: string | null;
  view: StepView;
  /** Döljer en nod med dess kanter, från krysset på noden */
  hide: (nodeId: string) => void;
}

const EMPTY: GraphState = {
  hoveredNodeId: null,
  view: { nodes: new Map(), edges: new Map(), activeEdgeId: null },
  hide: () => undefined,
};

export const GraphStateContext = createContext<GraphState>(EMPTY);

export function useNodeState(id: string): {
  status: StepStatus;
  hovered: boolean;
  hide: () => void;
} {
  const { hoveredNodeId, view, hide } = useContext(GraphStateContext);
  return {
    status: view.nodes.get(id) ?? 'pending',
    hovered: hoveredNodeId === id,
    hide: () => {
      hide(id);
    },
  };
}

import '@xyflow/react/dist/style.css';
import { type JSX, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { type Flow, type FlowEdge, type SourceRef } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import {
  buildModel,
  type GraphNode,
  type GraphView,
  hideElements,
  mapStepIndex,
} from '../../model/graph';
import { type AskTarget, buildAskPrompt } from '../../model/ask';
import { type Point } from '../../model/layout';
import { AskComposer } from './AskComposer';
import { useFlowPlayback } from '../hooks/useFlowPlayback';
import { FlowGraph } from './FlowGraph';
import { PlaybackControls } from './PlaybackControls';
import './graph.css';

interface Props {
  flow: Flow;
  /** Anropas när aktivt steg byts, med kanten som steget spelar upp. */
  onActiveEdgeChange?: (edge: FlowEdge | null) => void;
  onSelectSource?: (source: SourceRef) => void;
  /** Renderas mellan grafen och kontrollerna, t.ex. ett draghandtag som ägs av appen. */
  beforeControls?: ReactNode;
  /** Filen i repot flödet kom från, så agenten kan uppdatera den */
  flowFile?: string | undefined;
  /** Tar emot frågan om en nod eller ett anrop, färdig att skicka till agenten */
  onAsk?: ((prompt: string) => void) | undefined;
}

/**
 * Graf med uppspelning. Börjar i systemvyn, klick på ett system zoomar in i
 * det. Montera om med `key` när flödet byts så uppspelningen börjar om.
 */
export function FlowPlayer({
  flow,
  onActiveEdgeChange,
  onSelectSource,
  beforeControls,
  flowFile,
  onAsk,
}: Props): JSX.Element {
  const [view, setView] = useState<GraphView>({ kind: 'system' });
  // Det användaren dolt gäller i alla vyer. Flyttade noder sparas per vy.
  const [hiddenNodes, setHiddenNodes] = useState<ReadonlySet<string>>(() => new Set());
  const [hiddenEdges, setHiddenEdges] = useState<ReadonlySet<string>>(() => new Set());
  const [moved, setMoved] = useState<ReadonlyMap<string, Point>>(() => new Map());
  const model = useMemo(
    () => hideElements(buildModel(flow, view), hiddenNodes, hiddenEdges),
    [flow, view, hiddenNodes, hiddenEdges],
  );
  const playback = useFlowPlayback(model.steps.length);
  const hiddenCount = hiddenNodes.size + hiddenEdges.size;
  const [asking, setAsking] = useState<AskTarget | null>(null);
  const cancelAsk = useCallback(() => {
    setAsking(null);
  }, []);
  const sendAsk = useCallback(
    (question: string) => {
      if (asking) onAsk?.(buildAskPrompt(flow, asking, question, flowFile));
      setAsking(null);
    },
    [asking, flow, flowFile, onAsk],
  );

  useEffect(() => {
    const step = model.steps[playback.stepIndex];
    const edge = step ? flow.edges.find((e) => e.id === step.edgeId) : undefined;
    onActiveEdgeChange?.(edge ?? null);
  }, [flow, model, playback.stepIndex, onActiveEdgeChange]);

  /** Byter vy och flyttar uppspelningen till motsvarande steg i den nya vyn. */
  const changeView = useCallback(
    (next: GraphView) => {
      const nextModel = buildModel(flow, next);
      playback.goTo(mapStepIndex(flow, model, playback.stepIndex, nextModel));
      setView(next);
    },
    [flow, model, playback],
  );

  // Klick visar koden. Inzoomning sker via förstoringsglaset på systemnoden.
  const onNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.source) onSelectSource?.(node.source);
    },
    [onSelectSource],
  );
  const onZoom = useCallback(
    (systemId: string) => {
      changeView({ kind: 'focus', systemId });
    },
    [changeView],
  );
  const onZoomOut = useCallback(() => {
    changeView({ kind: 'system' });
  }, [changeView]);
  const onEdgeClick = useCallback(
    (edge: FlowEdge) => {
      onSelectSource?.(edge.source);
    },
    [onSelectSource],
  );

  const focused = view.kind === 'focus' ? flow.systems.find((s) => s.id === view.systemId) : null;
  const viewKey = view.kind === 'focus' ? `focus:${view.systemId}` : view.kind;

  const movedInView = useMemo(() => {
    const prefix = `${viewKey}/`;
    const result = new Map<string, Point>();
    for (const [key, point] of moved) {
      if (key.startsWith(prefix)) result.set(key.slice(prefix.length), point);
    }
    return result;
  }, [moved, viewKey]);
  const onMove = useCallback(
    (nodeId: string, position: Point) => {
      setMoved((current) => new Map(current).set(`${viewKey}/${nodeId}`, position));
    },
    [viewKey],
  );
  const onHideNodes = useCallback((ids: string[]) => {
    setHiddenNodes((current) => new Set([...current, ...ids]));
  }, []);
  const onHideEdges = useCallback((ids: string[]) => {
    setHiddenEdges((current) => new Set([...current, ...ids]));
  }, []);
  const restoreHidden = useCallback(() => {
    setHiddenNodes(new Set());
    setHiddenEdges(new Set());
  }, []);

  return (
    <div className="player">
      <header className="player__header">
        <h2 className="player__title" title={flow.summary}>
          {flow.title}
        </h2>
        <nav className="player__crumbs" aria-label={t('graph.levelNav')}>
          <button
            type="button"
            className={`crumb${view.kind === 'system' ? ' is-current' : ''}`}
            onClick={() => {
              changeView({ kind: 'system' });
            }}
          >
            {t('graph.allSystems')}
          </button>
          {focused && (
            <>
              <Icon name="chevronRight" size="sm" />
              <span className="crumb is-current">
                <Icon name={focused.kind} size="sm" /> {focused.label}
              </span>
            </>
          )}
          <span className="player__crumbs-spacer" />
          {hiddenCount > 0 && (
            <button type="button" className="crumb" onClick={restoreHidden}>
              {t('graph.restoreHidden', { count: hiddenCount })}
            </button>
          )}
          <button
            type="button"
            className={`crumb crumb--toggle${view.kind === 'detail' ? ' is-current' : ''}`}
            title={t('graph.allDetailsHint')}
            onClick={() => {
              changeView(view.kind === 'detail' ? { kind: 'system' } : { kind: 'detail' });
            }}
          >
            {t('graph.allDetails')}
          </button>
        </nav>
      </header>
      <FlowGraph
        key={viewKey}
        model={model}
        stepIndex={playback.stepIndex}
        moved={movedInView}
        onMove={onMove}
        onHideNodes={onHideNodes}
        onHideEdges={onHideEdges}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        asking={onAsk ? asking : null}
        onAsk={setAsking}
        onZoom={onZoom}
        onZoomOut={onZoomOut}
        onGoToStep={playback.goTo}
        overlay={
          onAsk && asking ? (
            <AskComposer
              key={askKey(asking)}
              target={asking}
              onSend={sendAsk}
              onCancel={cancelAsk}
            />
          ) : null
        }
      />
      <div className="player__divider">{beforeControls}</div>
      <PlaybackControls steps={model.steps} playback={playback} />
    </div>
  );
}

function askKey(target: AskTarget): string {
  return target.kind === 'node' ? `node:${target.node.id}` : `edge:${target.edge.id}`;
}

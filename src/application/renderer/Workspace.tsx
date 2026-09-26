import { type JSX, useCallback, useState } from 'react';
import { type FlowEdge, type SourceRef } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { Splitter } from '@/common/renderer/Splitter';
import { InboxLog, type SavedAnalysis } from '@/features/analysis';
import { FlowPlayer, FlowSummary, ReviewPanel } from '@/features/flow-graph';
import { SourceView } from '@/features/repo';

type PanelTab = 'code' | 'summary' | 'review' | 'log';

const TAB_LABELS: Readonly<Record<PanelTab, string>> = {
  code: t('panel.code'),
  summary: t('panel.summary'),
  review: t('panel.review'),
  log: t('panel.log'),
};

interface Props {
  analysis: SavedAnalysis | null;
  hasRepo: boolean;
  active: boolean;
  logOpen: boolean;
  bottomHeight: number;
  onBottomResize: (size: number) => void;
  onLogOpenChange: (open: boolean) => void;
  onAsk: (prompt: string) => void;
}

/**
 * En arbetsyta: grafen och den nedre panelen för en analys. Varje flik har
 * sin egen, alla hålls monterade och inaktiva göms, så uppspelning, dolda
 * noder och valt fynd finns kvar när man byter flik.
 */
export function Workspace({
  analysis,
  hasRepo,
  active,
  logOpen,
  bottomHeight,
  onBottomResize,
  onLogOpenChange,
  onAsk,
}: Props): JSX.Element {
  const [source, setSource] = useState<SourceRef | null>(null);
  const [tab, setTab] = useState<PanelTab>('code');
  const [focusedFindingId, setFocusedFinding] = useState<string | null>(null);

  const onActiveEdgeChange = useCallback((edge: FlowEdge | null) => {
    setSource(edge?.source ?? null);
  }, []);
  const onSelectSource = useCallback((selected: SourceRef) => {
    setSource(selected);
  }, []);
  const onFocusFinding = useCallback(
    (findingId: string) => {
      setFocusedFinding(findingId);
      setTab('review');
      onLogOpenChange(true);
    },
    [onLogOpenChange],
  );

  const shownSource = analysis ? source : null;
  // Flikar utan innehåll faller tillbaka: kod kräver en källa, sammanfattning en analys.
  const enabled: Record<PanelTab, boolean> = {
    code: shownSource !== null,
    summary: analysis !== null,
    review: analysis?.review !== undefined,
    log: true,
  };
  const activeTab: PanelTab = enabled[tab]
    ? tab
    : tab === 'code' && enabled.review
      ? 'review'
      : tab === 'code' && enabled.summary
        ? 'summary'
        : 'log';

  const splitter = (
    <Splitter
      orientation="horizontal"
      size={bottomHeight}
      min={120}
      max={700}
      inverted
      onResize={onBottomResize}
      label={t('panel.resizeBottom')}
    />
  );

  return (
    <div
      className={`workspace${active ? ' is-active' : ''}`}
      style={{ '--bottom-height': `${bottomHeight}px` }}
    >
      <main className="workspace__canvas">
        {analysis ? (
          <FlowPlayer
            key={analysis.id}
            flow={analysis.flow}
            onActiveEdgeChange={onActiveEdgeChange}
            onSelectSource={onSelectSource}
            flowFile={analysis.file}
            onAsk={onAsk}
            review={analysis.review}
            focusedFindingId={focusedFindingId}
            onFocusFinding={onFocusFinding}
            beforeControls={logOpen ? splitter : null}
          />
        ) : (
          <p className="shell__empty">{hasRepo ? t('app.chooseAnalysis') : t('app.chooseRepo')}</p>
        )}
      </main>

      {logOpen && (
        <section className="workspace__bottom">
          {splitter}
          <div className="shell__panel-bar">
            <div className="shell__tabs" role="tablist">
              {(Object.keys(TAB_LABELS) as PanelTab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`shell__tab${activeTab === key ? ' is-active' : ''}`}
                  disabled={!enabled[key]}
                  onClick={() => {
                    setTab(key);
                  }}
                >
                  {TAB_LABELS[key]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="icon-button"
              title={t('panel.minimise')}
              aria-label={t('panel.minimise')}
              onClick={() => {
                onLogOpenChange(false);
              }}
            >
              <Icon name="chevronDown" />
            </button>
          </div>
          {activeTab === 'code' && shownSource ? (
            <SourceView source={shownSource} />
          ) : activeTab === 'summary' && analysis ? (
            <FlowSummary flow={analysis.flow} />
          ) : activeTab === 'review' && analysis?.review ? (
            <ReviewPanel
              flow={analysis.flow}
              review={analysis.review}
              focusedFindingId={focusedFindingId}
              onFocus={setFocusedFinding}
            />
          ) : (
            <InboxLog />
          )}
        </section>
      )}
    </div>
  );
}

import { type JSX } from 'react';
import { type Flow } from '@/common/model/flow';
import { Icon } from '@/common/renderer/Icon';
import { type Playback } from '../hooks/useFlowPlayback';

interface Props {
  flow: Flow;
  playback: Playback;
}

export function PlaybackControls({ flow, playback }: Props): JSX.Element {
  const step = flow.steps[playback.stepIndex];
  const total = flow.steps.length;

  return (
    <div className="playback">
      <div className="playback__buttons">
        <button
          type="button"
          className="icon-button"
          onClick={playback.restart}
          title="Från början"
          aria-label="Från början"
          disabled={total === 0}
        >
          <Icon name="restart" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={playback.prev}
          title="Föregående steg"
          aria-label="Föregående steg"
          disabled={playback.stepIndex <= 0}
        >
          <Icon name="stepBack" />
        </button>
        <button
          type="button"
          className="icon-button icon-button--primary playback__play"
          onClick={playback.toggle}
          title={playback.playing ? 'Pausa' : 'Spela'}
          aria-label={playback.playing ? 'Pausa' : 'Spela'}
          disabled={total === 0}
        >
          <Icon name={playback.playing ? 'pause' : 'play'} size="lg" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={playback.next}
          title="Nästa steg"
          aria-label="Nästa steg"
          disabled={playback.atEnd}
        >
          <Icon name="stepForward" />
        </button>
      </div>
      <input
        className="playback__scrubber"
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={Math.max(0, playback.stepIndex)}
        onChange={(e) => {
          playback.goTo(Number(e.target.value));
        }}
        aria-label="Steg"
      />
      <div className="playback__text">
        <span className="playback__counter">
          {playback.stepIndex + 1}/{total}
        </span>
        <span className="playback__description">{step?.description}</span>
      </div>
    </div>
  );
}

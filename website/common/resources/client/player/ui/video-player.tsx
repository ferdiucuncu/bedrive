import {
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {PlayerContext} from '@common/player/player-context';
import {MediaItem} from '@common/player/media-item';
import {PlayerOutlet} from '@common/player/ui/player-outlet';
import {PlayButton} from '@common/player/ui/controls/play-button';
import {VolumeControls} from '@common/player/ui/controls/volume-controls';
import {Seekbar} from '@common/player/ui/controls/seeking/seekbar';
import {FormattedCurrentTime} from '@common/player/ui/controls/formatted-current-time';
import {FormattedPlayerDuration} from '@common/player/ui/controls/formatted-player-duration';
import {
  PlayerActions,
  usePlayerActions,
} from '@common/player/hooks/use-player-actions';
import {usePlayerStore} from '@common/player/hooks/use-player-store';
import clsx from 'clsx';
import {NextButton} from '@common/player/ui/controls/next-button';
import {FullscreenButton} from '@common/player/ui/controls/fullscreen-button';
import {PipButton} from '@common/player/ui/controls/pip-button';
import {PlaybackOptionsButton} from '@common/player/ui/controls/playback-options-button';
import {ToggleCaptionsButton} from '@common/player/ui/controls/toggle-captions-button';
import {PlayerPoster} from '@common/player/ui/controls/player-poster';
import {usePlayerClickHandler} from '@common/player/hooks/use-player-click-handler';
import {IconButton} from '@common/ui/buttons/icon-button';
import {MediaPlayIcon} from '@common/icons/media/media-play';
import {BufferingSpinner} from '@common/player/ui/controls/buffering-spinner';
import {guessPlayerProvider} from '@common/player/utils/guess-player-provider';
import {usePrevious} from '@common/utils/hooks/use-previous';
import {PlayerStoreOptions} from '@common/player/state/player-store-options';

interface Props {
  id: string;
  queue?: MediaItem[];
  cuedMediaId?: string;
  autoPlay?: boolean;
  src?: string;
  listeners?: PlayerStoreOptions['listeners'];
  onDestroy?: PlayerStoreOptions['onDestroy'];
  onBeforePlayNext?: PlayerStoreOptions['onBeforePlayNext'];
  onBeforePlayPrevious?: PlayerStoreOptions['onBeforePlayPrevious'];
  apiRef?: MutableRefObject<PlayerActions>;
  rightActions?: ReactNode;
}
export function VideoPlayer({
  id,
  queue,
  cuedMediaId,
  autoPlay,
  src,
  listeners,
  onBeforePlayPrevious,
  onBeforePlayNext,
  onDestroy,
  apiRef,
  rightActions,
}: Props) {
  return (
    <PlayerContext
      id={id}
      options={{
        autoPlay,
        listeners,
        onDestroy,
        onBeforePlayNext,
        onBeforePlayPrevious,
        initialData: {
          queue: queue ? queue : [mediaItemFromSrc(src!)],
          cuedMediaId,
        },
      }}
    >
      <QueueOverrider src={src} queue={queue} />
      <PlayerLayout apiRef={apiRef} rightActions={rightActions} />
    </PlayerContext>
  );
}

interface PlayerLayoutProps {
  apiRef?: MutableRefObject<PlayerActions>;
  rightActions?: ReactNode;
}
function PlayerLayout({apiRef, rightActions}: PlayerLayoutProps) {
  const leaveTimerRef = useRef<number | null>();
  const inactiveTimerRef = useRef<number | null>();
  const pointerIsOverControls = useRef(false);
  const actions = usePlayerActions();
  const controlsVisible = usePlayerStore(s => s.controlsVisible);
  const {setControlsVisible, getState, subscribe} = actions;

  const clickHandler = usePlayerClickHandler();

  const clearTimers = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (inactiveTimerRef.current) {
      clearTimeout(inactiveTimerRef.current);
      inactiveTimerRef.current = null;
    }
  };

  const startInactiveTimer = useCallback(() => {
    if (getState().isPlaying) {
      inactiveTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [getState, setControlsVisible]);

  useEffect(() => {
    if (apiRef) {
      apiRef.current = actions;
      return actions.subscribe({
        play: () => startInactiveTimer(),
      });
    }
  }, [apiRef, actions, setControlsVisible, startInactiveTimer]);

  return (
    <div
      className={clsx(
        'fullscreen-host relative isolate aspect-video bg-black',
        !controlsVisible && 'cursor-none'
      )}
      onClick={clickHandler}
      onPointerEnter={() => {
        setControlsVisible(true);
        clearTimers();
      }}
      onPointerMove={() => {
        if (pointerIsOverControls.current) {
          return;
        }
        if (inactiveTimerRef.current) {
          setControlsVisible(true);
        }
        clearTimers();
        startInactiveTimer();
      }}
      onPointerLeave={() => {
        clearTimers();
        if (!getState().isPlaying) {
          return;
        }
        leaveTimerRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, 2500);
      }}
    >
      <PlayerOutlet className="z-50 h-full w-full" />
      <Blocker />
      <PlayerPoster className="absolute inset-0 z-30" />
      <OverlayButtons />
      <BufferingSpinner
        className="spinner pointer-events-none absolute inset-0 z-40 m-auto h-50 w-50"
        fillColor="border-white"
        trackColor="border-white/30"
        size="w-50 h-50"
      />
      <BottomGradient />
      <Controls
        rightActions={rightActions}
        onPointerEnter={() => {
          pointerIsOverControls.current = true;
          setControlsVisible(true);
          clearTimers();
        }}
        onPointerLeave={() => {
          pointerIsOverControls.current = false;
        }}
      />
    </div>
  );
}

function OverlayButtons() {
  const showPlayButton = usePlayerStore(s => !s.isPlaying && !s.isSeeking);
  return (
    <div
      className={clsx(
        'absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center transition-opacity',
        showPlayButton ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <IconButton color="primary" variant="raised" size="lg">
        <MediaPlayIcon />
      </IconButton>
    </div>
  );
}

// required in order for "onPointerEnter" to fire consistently when player provider is iframe
function Blocker() {
  return <div className="absolute inset-0 z-20" />;
}

function BottomGradient() {
  const controlsVisible = usePlayerStore(s => s.controlsVisible);
  return (
    <div
      className={clsx(
        'player-bottom-gradient pointer-events-none absolute bottom-0 z-30 h-2/4 w-full bg-bottom bg-repeat-x pt-36 transition-opacity duration-300',
        controlsVisible ? 'opacity-100' : 'opacity-0'
      )}
    />
  );
}

interface ControlsProps {
  rightActions?: ReactNode;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}
function Controls({
  rightActions,
  onPointerEnter,
  onPointerLeave,
}: ControlsProps) {
  const controlsVisible = usePlayerStore(s => s.controlsVisible);
  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={e => e.stopPropagation()}
      className={clsx(
        'player-bottom-text-shadow absolute bottom-0 left-0 right-0 z-40 p-8 text-white/87 transition-opacity duration-300',
        controlsVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <Seekbar trackColor="bg-white/40" />
      <div className="flex w-full items-center gap-4">
        <PlayButton color="white" />
        <NextButton color="white" />
        <VolumeControls
          className="max-md:hidden"
          fillColor="bg-white"
          trackColor="bg-white/20"
          buttonColor="white"
        />
        <span className="ml-10 text-sm">
          <FormattedCurrentTime className="min-w-40 text-right" /> /{' '}
          <FormattedPlayerDuration className="min-w-40 text-right" />
        </span>
        <div className="ml-auto flex flex-shrink-0 items-center gap-4">
          {rightActions}
          <ToggleCaptionsButton color="white" />
          <PlaybackOptionsButton color="white" />
          <FullscreenButton className="ml-auto" color="white" />
          <PipButton color="white" />
        </div>
      </div>
    </div>
  );
}

function mediaItemFromSrc(src: string): MediaItem {
  return {
    id: src,
    src,
    provider: guessPlayerProvider(src),
  };
}

interface QueueOverriderProps {
  src?: string;
  queue?: MediaItem[];
}
function QueueOverrider({src, queue}: QueueOverriderProps) {
  const {getState, overrideQueue} = usePlayerActions();

  const queueKey = queue?.map(item => item.id).join('-') ?? '';
  const previousKey = usePrevious(queueKey);

  // override queue when any of specified queue item id or order changes
  useEffect(() => {
    if (queue && previousKey && queueKey && previousKey !== queueKey) {
      overrideQueue(queue);
    }
  }, [queueKey, previousKey, queue, overrideQueue]);

  // override queue when src changes
  useEffect(() => {
    if (src && getState().cuedMedia?.src !== src) {
      overrideQueue([mediaItemFromSrc(src)]);
    }
  }, [src, getState, overrideQueue]);

  return null;
}

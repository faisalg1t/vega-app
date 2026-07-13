import type {ReactNode, RefObject} from 'react';
import type {ViewStyle, StyleProp, Animated} from 'react-native';
import type Reanimated from 'react-native-reanimated';
import type {StyleProps} from 'react-native-reanimated';
import type {VideoViewProps, VideoPlayer} from 'react-native-video';

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

export type VideoAnimations = {
  AnimatedView: typeof Reanimated.View | typeof Animated.View;
  hideControlAnimation: () => void;
  showControlAnimation: () => void;
  bottomControl: StyleProps;
  topControl: StyleProps;
  controlsOpacity: StyleProps;
};

export interface VideoPlayerSettingsProps {
  streamData?: any[];
  selectedStream?: any;
  onServerSelect?: (stream: any) => void;
  externalSubs?: any[];
  setExternalSubs?: (subs: any) => void;
  onAddExternalSub?: () => void;
}

export interface PlayerBottomBarProps {
  audioTracks: any[];
  textTracks: any[];
  videoTracks: any[];
  selectedAudioTrackIndex: number;
  selectedTextTrackIndex: number;
  selectedQualityIndex: number;
  playbackRate: number;
  resizeMode: string;
  handleResizeMode: () => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  setActiveTab: (tab: any) => void;
  isPlayerLocked: boolean;
  onNextEpisode?: () => void;
  showNextEpisode?: boolean;
  formatQuality: (q: string) => string;
}

export interface VideoPlayerProps extends Omit<VideoViewProps, 'player' | 'ref'> {
  children?: ReactNode;
  settingsProps?: VideoPlayerSettingsProps;
  bottomBarProps?: PlayerBottomBarProps;
  /**
   * The VideoPlayer instance from react-native-video v7 useVideoPlayer hook.
   */
  player: VideoPlayer;

  animations?: VideoAnimations;
  useAnimations?: (controlAnimationTiming: number) => VideoAnimations;

  toggleResizeModeOnFullscreen?: boolean;
  controlAnimationTiming?: number;
  doubleTapTime?: number;
  isFullscreen?: boolean;
  showOnStart?: boolean;
  showOnEnd?: boolean;
  alwaysShowControls?: boolean;

  

  /**
   * Title of the video
   */
  title?: {primary: string; secondary?: string};

  showDuration?: boolean;
  showTimeRemaining?: boolean;
  showHours?: boolean;

  onEnterFullscreen?: () => void;
  onBack?: () => void;

  /**
   * Fired when the video exits fullscreen after the fullscreen button is pressed
   */
  onExitFullscreen?: () => void;

  /**
   * Fired when the controls disappear
   */
  onHideControls?: () => void;

  /**
   * Fired when the controls appear
   */
  onShowControls?: () => void;

  /**
   * Fired when the video is paused after the play/pause button is pressed
   */
  onPause?: () => void;

  /**
   * Fired when the video begins playing after the play/pause button is pressed
   */
  onPlay?: () => void;

  /**
   * Hide controls after X amount of time in milliseconds
   *
   * @default 15000
   */
  controlTimeoutDelay?: number;

  /**
   * If true, single tapping anywhere on the video (other than a control) toggles between playing and paused.
   *
   * @default false
   */
  tapAnywhereToPause?: boolean;

  /**
   * StyleSheet passed to the <Video /> component
   *
   */
  videoStyle?: StyleProp<ViewStyle>;

  /**
   * Container styles
   *
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Fill/handle colour of the seekbar
   *
   * @default '#FFF'
   */
  seekColor?: string;

  /**
   * Hide the back button
   *
   * @default false
   */
  disableBack?: boolean;

  /**
   * Hide the Volume control
   *
   * @default false
   */
  disableVolume?: boolean;

  /**
   * Hide the fullscreen button
   *
   * @default false
   */
  disableFullscreen?: boolean;

  /**
   * Hide the timer
   *
   * @default false
   */
  disableTimer?: boolean;

  /**
   * Hide the seekbar
   *
   * @default false
   */
  disableSeekbar?: boolean;

  /**
   * Hide the play/pause toggle and the rewind/forward buttons
   *
   * @default false
   */
  disablePlayPause?: boolean;

  /**
   * Hide the rewind/forward buttons without hiding the play/pause button
   *
   * @default false
   */
  disableSeekButtons?: boolean;

  /**
   * Hide the transparent overlay which is active when the controls are shown. Generally used when you want to disable all the controls.
   *
   * @default false
   */
  disableOverlay?: boolean;

  /**
   * When using the default React Native navigator and do not override the `onBack` function,
   * you'll need to pass the navigator to the VideoPlayer for it to function
   *
   * @default null
   */
  navigator?: any;

  /**
   * Pass ref to the `<Video/>` component
   *
   * @default false
   */
  videoRef?: any;

  /**
   * Number of seconds to rewind or forward.
   *
   * @default 15
   */
  rewindTime?: number;

  /**
   * Object allowing fine grained control of the pan responder
   *
   * @default { horizontal: true, inverted: false }
   */
  pan?: {
    /**
     * Boolean representing if the player is oriented horizontally or vertically
     *
     * @default true
     */
    horizontal?: boolean;

    /**
     * Boolean representing if the player controls pan gesture should be inverted
     *
     * @default false
     */
    inverted?: boolean;
  };
  /**
   * testID selector for testing
   */
  testID?: string;

  /**
   * Disable the gesture for the player
   *
   * @default false
   */
  disableGesture?: boolean;

  /**
   * is Player Locked
   *
   * @default false
   */
  hideAllControlls?: boolean;
}

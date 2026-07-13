import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View } from 'react-native';
import { VideoView, useEvent } from 'react-native-video';
import { SettingsModal } from './components/SettingsModal';
import { PlayerBottomBar } from './components/PlayerBottomBar';
import { useControlTimeout, useJSAnimations, usePanResponders } from '../../lib/hooks/videoPlayer';
import {
    Error,
    Loader,
    TopControls,
    BottomControls,
    PlayPause,
    Overlay,
} from './components';
import { PlatformSupport } from './OSSupport';
import { _onBack } from './utils';
import { _styles } from './styles';
import type { VideoPlayerProps, WithRequiredProperty } from './types';
import Gestures from './components/Gestures';

const volumeWidth = 150;
const iconOffset = 0;

const AnimatedVideoPlayer = (
    props: WithRequiredProperty<VideoPlayerProps, 'animations'>,
) => {
    const {
        animations,
        toggleResizeModeOnFullscreen,
        doubleTapTime = 130,
        isFullscreen = false,
        showOnStart = false,
        showOnEnd = false,
        alwaysShowControls = false,
        title = { primary: '', secondary: '' },
        showDuration = false,
        showTimeRemaining = false,
        showHours = false,
        onBack,
        onEnterFullscreen = () => { },
        onExitFullscreen = () => { },
        onHideControls = () => { },
        onShowControls = () => { },
        controlTimeoutDelay = 15000,
        tapAnywhereToPause = false,
        resizeMode = 'none',
        videoStyle = {},
        containerStyle = {},
        seekColor = '',
        player,
        disableBack = false,
        disableVolume = false,
        disableFullscreen = false,
        disableTimer = false,
        disableSeekbar = false,
        disablePlayPause = false,
        disableSeekButtons = false,
        disableOverlay,
        navigator,
        rewindTime = 15,
        pan: { horizontal: horizontalPan, inverted: invertedPan } = {},
        testID,
        disableGesture = false,
        hideAllControlls = false,
        settingsProps,
        bottomBarProps,
    } = props;

    const mounted = useRef(false);

    const controlTimeout = useRef<ReturnType<typeof setTimeout>>(
        setTimeout(() => { }),
    ).current;
    const tapActionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [_isFullscreen, setIsFullscreen] = useState<boolean>(
        isFullscreen || false,
    );
    const [_showTimeRemaining, setShowTimeRemaining] =
        useState<boolean>(showTimeRemaining);
    const [volumeTrackWidth, setVolumeTrackWidth] = useState<number>(0);
    const [volumeFillWidth, setVolumeFillWidth] = useState<number>(0);
    const [seekerFillWidth, setSeekerFillWidth] = useState<number>(0);
    const [showControls, setShowControls] = useState(showOnStart);
    const [volumePosition, setVolumePositionState] = useState(0);
    const [seekerPosition, setSeekerPositionState] = useState(0);
    const [volumeOffset, setVolumeOffset] = useState(0);
    const [seekerOffset, setSeekerOffset] = useState(0);
    const [seekerWidth, setSeekerWidth] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState(false);
    const [duration, setDuration] = useState(0);
    const [buffering, setBuffering] = useState(false);
    const [cachedDuration, setCachedDuration] = useState(0);
    const [cachedPosition, setCachedPosition] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    // Tab currently shown in the settings modal. Driven by the bottom bar
    // buttons so tapping e.g. the audio icon opens the modal on the audio tab.
    const [activeSettingsTab, setActiveSettingsTab] = useState<
        'audio' | 'subtitle' | 'server' | 'quality' | 'speed'
    >('server');

    let isPlayerValid = false;
    let _paused = true;
    let _volume = 1;
    try {
        // Attempting to read player properties will throw if the C++ object is released
        if (player) {
            const status = player.status;
            _paused = !player.isPlaying;
            _volume = player.volume ?? 1;
            isPlayerValid = true;
        }
    } catch (e) {
        // Player is released, safe to ignore
        isPlayerValid = false;
    }

    // Sync state from player using useEvent
    const [, forceRender] = useState({});
    const triggerRender = useCallback(() => forceRender({}), []);

    // Declared before the event handlers below because handleLoad references
    // setControlTimeout in its dependency array (avoids a temporal-dead-zone
    // ReferenceError that crashed the player on render).
    const { clearControlTimeout, resetControlTimeout, setControlTimeout } =
        useControlTimeout({
            controlTimeout,
            controlTimeoutDelay,
            mounted: mounted.current,
            showControls,
            setShowControls,
            alwaysShowControls,
        });

    const handleProgress = useCallback((e: any) => {
        if (!seeking && !buffering) {
            // v7 onProgress payload is { currentTime, bufferDuration }.
            const bufferDuration = e.bufferDuration ?? 0;
            setCurrentTime(e.currentTime);
            setCachedDuration(bufferDuration);

            if (duration > 0 && seekerWidth > 0) {
                const progress = e.currentTime / duration;
                const position = progress * seekerWidth;
                setSeekerPosition(position);
            }

            if (duration > 0 && seekerWidth > 0) {
                const bufferProgress = bufferDuration / duration;
                const cachedPos = bufferProgress * seekerWidth;
                setCachedPosition(cachedPos);
            }
        }
        setLoading(false);
    }, [seeking, buffering, duration, seekerWidth]);



    const handleError = useCallback((err: any) => {
        console.log('🎥 [AnimatedVideoPlayer] onError fired!', err);
        setError(true);
    }, []);

    const handleBuffer = useCallback((isBuffering: boolean) => {
        // v7 onBuffer passes a boolean directly (v6 passed { isBuffering }).
        setBuffering(!!isBuffering);
    }, []);

    const handleLoad = useCallback((e: any) => {
        console.log('🎥 [AnimatedVideoPlayer] onLoad. Duration:', e.duration);
        setDuration(e.duration);
        setLoading(false);
        if (showControls) setControlTimeout();
    }, [showControls, setControlTimeout]);

    const handleEnd = useCallback(() => {
        console.log('🎥 [AnimatedVideoPlayer] onEnd. Current time:', currentTime, 'Duration:', duration);
        if (currentTime < duration) {
            setCurrentTime(duration);
            if (showOnEnd) {
                setShowControls(true);
            }
        }
    }, [currentTime, duration, showOnEnd]);

    // Use the stable triggerRender reference so useEvent doesn't tear down and
    // re-subscribe the listener on every single render (a source of churn/lag).
    useEvent(player, 'onStatusChange', triggerRender);
    useEvent(player, 'onProgress', handleProgress);
    useEvent(player, 'onVolumeChange', triggerRender);
    useEvent(player, 'onError', handleError);
    useEvent(player, 'onBuffer', handleBuffer);
    useEvent(player, 'onLoad', handleLoad);
    useEvent(player, 'onEnd', handleEnd);

    const toggleFullscreen = useCallback(
        () => setIsFullscreen((prevState) => !prevState),
        [],
    );
    const toggleControls = useCallback(
        () => setShowControls((prevState) => alwaysShowControls || !prevState),
        [alwaysShowControls],
    );
    const toggleTimer = useCallback(
        () => setShowTimeRemaining((prevState) => !prevState),
        [],
    );
    const togglePlayPause = useCallback(() => {
        try {
            if (player?.isPlaying) {
                player.pause();
            } else {
                player?.play();
            }
        } catch (e) { }
    }, [player]);

    const styles = useMemo(
        () => ({
            videoStyle,
            containerStyle: containerStyle,
        }),
        [videoStyle, containerStyle],
    );

    const _onScreenTouch = useCallback(() => {
        if (tapActionTimeout.current) {
            clearTimeout(tapActionTimeout.current);
            tapActionTimeout.current = null;
            toggleFullscreen();
            if (showControls) {
                resetControlTimeout();
            }
        } else {
            tapActionTimeout.current = setTimeout(() => {
                if (tapAnywhereToPause && showControls) {
                    togglePlayPause();
                    resetControlTimeout();
                } else {
                    toggleControls();
                }
                tapActionTimeout.current = null;
            }, doubleTapTime);
        }
    }, [
        toggleFullscreen,
        showControls,
        resetControlTimeout,
        tapAnywhereToPause,
        togglePlayPause,
        toggleControls,
        doubleTapTime,
    ]);

    const events = {
        onBack: props.onBack || _onBack(props.navigator),
        onScreenTouch: _onScreenTouch,
        onEnterFullscreen: props.onEnterFullscreen,
        onExitFullscreen: props.onExitFullscreen,
        onShowControls: props.onShowControls,
        onHideControls: props.onHideControls
    };

    const constrainToSeekerMinMax = useCallback(
        (val = 0) => {
            if (val <= 0) {
                return 0;
            } else if (val >= seekerWidth) {
                return seekerWidth;
            }
            return val;
        },
        [seekerWidth],
    );

    const constrainToVolumeMinMax = useCallback((val = 0) => {
        if (val <= 0) {
            return 0;
        } else if (val >= volumeWidth + 9) {
            return volumeWidth + 9;
        }
        return val;
    }, []);

    const setSeekerPosition = useCallback(
        (position = 0) => {
            const positionValue = constrainToSeekerMinMax(position);

            setSeekerPositionState(positionValue);
            setSeekerOffset(positionValue);
            setSeekerFillWidth(positionValue);
        },
        [constrainToSeekerMinMax],
    );

    const setVolumePosition = useCallback(
        (position = 0) => {
            const positionValue = constrainToVolumeMinMax(position);

            setVolumePositionState(positionValue + iconOffset);

            if (positionValue < 0) {
                setVolumeFillWidth(0);
            } else {
                setVolumeFillWidth(positionValue);
            }
        },
        [constrainToVolumeMinMax],
    );

    const seekVideo = useCallback((time: number) => {
        try { player?.seekTo(time); } catch (e) { }
    }, [player]);

    const { volumePanResponder, seekPanResponder } = usePanResponders({
        duration,
        seekerOffset,
        volumeOffset,
        loading,
        seekerWidth,
        seeking,
        seekerPosition,
        seek: seekVideo,
        clearControlTimeout,
        setVolumePosition,
        setSeekerPosition,
        setSeeking,
        setControlTimeout,
        onEnd: () => { },
        horizontal: horizontalPan,
        inverted: invertedPan,
    });

    useEffect(() => {
        if (currentTime >= duration && duration > 0) {
            try { player?.seekTo(0); } catch (e) { }
        }
    }, [currentTime, duration, player]);

    useEffect(() => {
        if (mounted.current) {
            if (_isFullscreen) {
                typeof events.onEnterFullscreen === 'function' &&
                    events.onEnterFullscreen();
            } else {
                typeof events.onExitFullscreen === 'function' &&
                    events.onExitFullscreen();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_isFullscreen]);

    useEffect(() => {
        setIsFullscreen(isFullscreen);
    }, [isFullscreen]);


    useEffect(() => {
        if (seeking && seekerPosition && seekerWidth && duration) {
            const percent = seekerPosition / seekerWidth;
            const newTime = duration * percent;
            setCurrentTime(newTime);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seeking, seekerPosition]);

    useEffect(() => {
        if (showControls) {
            animations.showControlAnimation();
            setControlTimeout();
            typeof events.onShowControls === 'function' && events.onShowControls();
        } else {
            animations.hideControlAnimation();
            clearControlTimeout();
            typeof events.onHideControls === 'function' && events.onHideControls();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showControls, loading]);

    const updateVolumeRef = useRef<number | null>(null);

    useEffect(() => {
        if (updateVolumeRef.current) {
            cancelAnimationFrame(updateVolumeRef.current);
        }

        updateVolumeRef.current = requestAnimationFrame(() => {
            const newVolume = volumePosition / volumeWidth;

            if (player) {
                try {
                    player.volume = newVolume;
                    player.muted = newVolume <= 0;
                } catch (e) { }
            }
            setVolumeOffset(volumePosition);

            const newVolumeTrackWidth = volumeWidth - volumeFillWidth;

            if (newVolumeTrackWidth > 150) {
                setVolumeTrackWidth(150);
            } else {
                setVolumeTrackWidth(newVolumeTrackWidth);
            }

            updateVolumeRef.current = null;
        });

        return () => {
            if (updateVolumeRef.current) {
                cancelAnimationFrame(updateVolumeRef.current);
            }
        };
    }, [volumeFillWidth, volumePosition]);

    useEffect(() => {
        const position = volumeWidth * _volume;
        setVolumePosition(position);
        setVolumeOffset(position);
        mounted.current = true;
        return () => {
            mounted.current = false;
            clearControlTimeout();
            if (updateVolumeRef.current) {
                cancelAnimationFrame(updateVolumeRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rewind = useCallback(
        (time?: number) => {
            const newTime =
                typeof time === 'number'
                    ? currentTime - time
                    : currentTime - rewindTime;
            setCurrentTime(newTime);
            try { player?.seekTo(newTime); } catch (e) { }
        },
        [currentTime, rewindTime, player],
    );

    const forward = useCallback(
        (time?: number) => {
            const newTime =
                typeof time === 'number'
                    ? currentTime + time
                    : currentTime + rewindTime;
            setCurrentTime(newTime);
            try { player?.seekTo(newTime); } catch (e) { }
        },
        [currentTime, rewindTime, player],
    );

    return (
        <PlatformSupport
            showControls={showControls}
            containerStyles={styles.containerStyle}
            onScreenTouch={events.onScreenTouch}
            testID={testID}>
            <View
                style={[_styles.player.container, containerStyle] as any}>
                {(!player || isPlayerValid) ? (
                    <VideoViewErrorBoundary player={player}>
                        <VideoView
                            player={player}
                            style={[_styles.player.video, styles.videoStyle] as any}
                            resizeMode={resizeMode as any}
                        />
                    </VideoViewErrorBoundary>
                ) : (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                )}
                {
                    <>
                        <Error error={error} />
                        {!hideAllControlls && (
                            <>
                                {!disableOverlay && <Overlay animations={animations} />}
                                <TopControls
                                    onSettingsPress={() => setShowSettings(!showSettings)}
                                    title={title}
                                    panHandlers={volumePanResponder.panHandlers}
                                    animations={animations}
                                    disableBack={disableBack}
                                    disableVolume={disableVolume}
                                    volumeFillWidth={volumeFillWidth}
                                    volumeTrackWidth={volumeTrackWidth}
                                    volumePosition={volumePosition}
                                    onBack={events.onBack}
                                    resetControlTimeout={resetControlTimeout}
                                    showControls={showControls}
                                />
                                {loading ? (
                                    <Loader color={seekColor} />
                                ) : (
                                    <PlayPause
                                        animations={animations}
                                        disablePlayPause={disablePlayPause}
                                        disableSeekButtons={disableSeekButtons}
                                        paused={_paused}
                                        togglePlayPause={togglePlayPause}
                                        resetControlTimeout={resetControlTimeout}
                                        showControls={showControls}
                                        onPressRewind={rewind}
                                        onPressForward={forward}
                                        buffering={buffering}
                                        primaryColor={seekColor}
                                    />
                                )}
                                <Gestures
                                    forward={forward}
                                    rewind={rewind}
                                    togglePlayPause={togglePlayPause}
                                    doubleTapTime={doubleTapTime}
                                    seekerWidth={seekerWidth}
                                    rewindTime={rewindTime}
                                    toggleControls={toggleControls}
                                    tapActionTimeout={tapActionTimeout}
                                    tapAnywhereToPause={tapAnywhereToPause}
                                    showControls={showControls}
                                    disableGesture={disableGesture}
                                    setPlayback={() => {
                                        try {
                                            if (player) {
                                                player.rate = player.rate === 1 ? 2 : 1;
                                            }
                                        } catch (e) { }
                                    }}
                                />
                                <BottomControls
                                    animations={animations}
                                    panHandlers={seekPanResponder.panHandlers}
                                    disableTimer={disableTimer}
                                    disableSeekbar={disableSeekbar}
                                    showHours={showHours}
                                    showDuration={showDuration}
                                    paused={_paused}
                                    showTimeRemaining={_showTimeRemaining}
                                    currentTime={currentTime}
                                    duration={duration}
                                    seekColor={seekColor}
                                    toggleTimer={toggleTimer}
                                    resetControlTimeout={resetControlTimeout}
                                    seekerFillWidth={seekerFillWidth}
                                    seekerPosition={seekerPosition}
                                    setSeekerWidth={setSeekerWidth}
                                    cachedPosition={cachedPosition}
                                    isFullscreen={isFullscreen}
                                    disableFullscreen={disableFullscreen}
                                    toggleFullscreen={toggleFullscreen}
                                    showControls={showControls}
                                />
                                {props.children}
                            </>
                        )}
                    </>
                }
                {bottomBarProps && (
                    <PlayerBottomBar
                        {...bottomBarProps}
                        animations={animations}
                    />
                )}
                {settingsProps && (
                    <SettingsModal
                        player={player}
                        settingsProps={settingsProps}
                        showSettings={showSettings}
                        setShowSettings={setShowSettings}
                        activeTab={activeSettingsTab}
                        setActiveTab={setActiveSettingsTab}
                    />
                )}
            </View>
        </PlatformSupport>
    );
};

const CustomAnimations = ({
    useAnimations,
    controlAnimationTiming = 450,
    ...props
}: WithRequiredProperty<VideoPlayerProps, 'useAnimations'>) => {
    const animations = useAnimations(controlAnimationTiming);
    return <AnimatedVideoPlayer animations={animations} {...props} />;
};

class VideoViewErrorBoundary extends React.Component<any, { hasError: boolean; player: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, player: props.player };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    static getDerivedStateFromProps(nextProps: any, prevState: any) {
        if (nextProps.player !== prevState.player) {
            return { hasError: false, player: nextProps.player };
        }
        return null;
    }
    componentDidCatch(error: Error) {
        if (__DEV__) {
            console.log('VideoView caught error (expected on unmount if player is released):', error.message);
        }
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

const JSAnimations = (props: VideoPlayerProps) => {
    const animations = useJSAnimations(props.controlAnimationTiming);

    return <AnimatedVideoPlayer animations={animations} {...props} />;
};

export const VideoPlayer = (props: Omit<VideoPlayerProps, 'animations'>) => {
    if (props?.useAnimations) {
        return <CustomAnimations useAnimations={props?.useAnimations as any} {...(props as any)} />;
    }

    return <JSAnimations {...(props as any)} />;
};

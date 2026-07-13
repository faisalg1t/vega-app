import React from 'react';
import { Text, TouchableOpacity, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { PlayerBottomBarProps } from '../types';
import type { VideoAnimations } from '../types';

interface Props extends PlayerBottomBarProps {
  animations: VideoAnimations;
}

export const PlayerBottomBar = ({
  audioTracks,
  textTracks,
  videoTracks,
  selectedAudioTrackIndex,
  selectedTextTrackIndex,
  selectedQualityIndex,
  playbackRate,
  resizeMode,
  handleResizeMode,
  showSettings,
  setShowSettings,
  setActiveTab,
  isPlayerLocked,
  onNextEpisode,
  showNextEpisode,
  formatQuality,
  animations,
}: Props) => {
  const { AnimatedView, ...anims } = animations;

  if (isPlayerLocked) return null;

  return (
    <AnimatedView
      style={[anims.controlsOpacity, anims.bottomControl]}
      // @ts-ignore
      className="absolute bottom-3 right-6 flex flex-row justify-center w-full gap-x-16">

      {/* Audio */}
      <TouchableOpacity
        onPress={() => {
          setActiveTab('audio');
          setShowSettings(!showSettings);
        }}
        className="flex flex-row gap-x-1 items-center">
        <MaterialIcons
          style={{ opacity: 0.7 }}
          name="multitrack-audio"
          size={26}
          color="white"
        />
        <Text className="capitalize text-xs text-white opacity-70">
          {audioTracks[selectedAudioTrackIndex]?.language || 'auto'}
        </Text>
      </TouchableOpacity>

      {/* Subtitle */}
      <TouchableOpacity
        onPress={() => {
          setActiveTab('subtitle');
          setShowSettings(!showSettings);
        }}
        className="flex flex-row gap-x-1 items-center">
        <MaterialIcons
          style={{ opacity: 0.6 }}
          name="subtitles"
          size={24}
          color="white"
        />
        <Text className="text-xs capitalize text-white opacity-70">
          {selectedTextTrackIndex === 1000
            ? 'none'
            : textTracks[selectedTextTrackIndex]?.language}
        </Text>
      </TouchableOpacity>

      {/* Speed */}
      <TouchableOpacity
        className="flex-row gap-1 items-center opacity-60"
        onPress={() => {
          setActiveTab('speed');
          setShowSettings(!showSettings);
        }}>
        <MaterialIcons name="speed" size={26} color="white" />
        <Text className="text-white text-sm">
          {playbackRate === 1 ? '1.0' : playbackRate}
        </Text>
      </TouchableOpacity>

      {/* PIP */}
      {!Platform.isTV && (
        <TouchableOpacity
          className="flex-row gap-1 items-center opacity-60"
          onPress={() => {}}>
          <MaterialIcons name="picture-in-picture" size={24} color="white" />
          <Text className="text-white text-xs">PIP</Text>
        </TouchableOpacity>
      )}

      {/* Server & Quality */}
      <TouchableOpacity
        className="flex-row gap-1 items-center opacity-60"
        onPress={() => {
          setActiveTab('server');
          setShowSettings(!showSettings);
        }}>
        <MaterialIcons name="video-settings" size={25} color="white" />
        <Text className="text-xs text-white capitalize">
          {videoTracks?.length === 1
            ? formatQuality(videoTracks[0]?.height?.toString() || 'auto')
            : formatQuality(
                videoTracks?.[selectedQualityIndex]?.height?.toString() || 'auto',
              )}
        </Text>
      </TouchableOpacity>

      {/* Resize */}
      <TouchableOpacity
        className="flex-row gap-1 items-center opacity-60"
        onPress={handleResizeMode}>
        <MaterialIcons name="fit-screen" size={28} color="white" />
        <Text className="text-white text-sm min-w-[38px]">
          {resizeMode === 'none'
            ? 'Fit'
            : resizeMode === 'cover'
              ? 'Cover'
              : resizeMode === 'stretch'
                ? 'Stretch'
                : 'Contain'}
        </Text>
      </TouchableOpacity>

      {/* Next Episode */}
      {showNextEpisode && onNextEpisode && (
        <TouchableOpacity
          className="flex-row items-center opacity-60"
          onPress={onNextEpisode}>
          <Text className="text-white text-base">Next</Text>
          <MaterialIcons name="skip-next" size={28} color="white" />
        </TouchableOpacity>
      )}
    </AnimatedView>
  );
};

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import SearchSubtitles from '../../SearchSubtitles';
import useThemeStore from '../../../lib/zustand/themeStore';
import { cacheStorage } from '../../../lib/storage';

export const SettingsModal = ({
  player,
  settingsProps,
  showSettings,
  setShowSettings,
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
}: any) => {
  const { primary } = useThemeStore(state => state);
  const playbacks = [0.25, 0.5, 1.0, 1.25, 1.35, 1.5, 1.75, 2];

  const [activeTabInternal, setActiveTabInternal] = useState('server');
  const activeTab = activeTabProp ?? activeTabInternal;
  const setActiveTab = setActiveTabProp ?? setActiveTabInternal;
  const [searchQuery, setSearchQuery] = useState('');

  const { streamData, selectedStream, onServerSelect, externalSubs, setExternalSubs } = settingsProps || {};

  const settingsTranslateY = useSharedValue(10000);
  const settingsOpacity = useSharedValue(0);

  React.useEffect(() => {
    settingsTranslateY.value = withTiming(showSettings ? 0 : 5000, { duration: 250 });
    settingsOpacity.value = withTiming(showSettings ? 1 : 0, { duration: 250 });
  }, [showSettings]);

  const settingsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: settingsTranslateY.value }],
    opacity: settingsOpacity.value,
  }));

  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [textTracks, setTextTracks] = useState<any[]>([]);
  const [videoTracks, setVideoTracks] = useState<any[]>([]);
  const [currentRate, setCurrentRate] = useState(1);

  React.useEffect(() => {
    if (showSettings && player) {
      try {
        setAudioTracks(player.getAvailableAudioTracks?.() || []);
        setTextTracks(player.getAvailableTextTracks?.() || []);
        setVideoTracks(player.getAvailableVideoTracks?.() || []);
        setCurrentRate(player.rate);
      } catch (e) {}
    }
  }, [showSettings, player]);

  return (
    <Animated.View
      style={[settingsStyle, {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
      }]}
      onTouchEnd={() => setShowSettings(false)}>
      <View
        style={{
          backgroundColor: 'black',
          padding: 12,
          width: 600,
          height: 288,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
        onTouchEnd={e => e.stopPropagation()}>

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <ScrollView className="w-full h-full p-1 px-4">
            <Text className="text-lg font-bold text-center text-white">
              Audio
            </Text>
            {audioTracks.length === 0 && (
              <View className="flex justify-center items-center">
                <Text className="text-white text-xs">
                  Loading audio tracks...
                </Text>
              </View>
            )}
            {audioTracks.map((track: any, i: number) => (
              <TouchableOpacity
                className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                key={i}
                onPress={() => {
                  try { player.selectedAudioTrack = track; } catch(e) {}
                  setShowSettings(false);
                }}>
                <Text
                  className={'text-lg font-semibold'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.language}
                </Text>
                <Text
                  className={'text-base italic'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.type}
                </Text>
                <Text
                  className={'text-sm italic'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.title}
                </Text>
                {track.selected && (
                  <MaterialIcons name="check" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Subtitle Tab */}
        {activeTab === 'subtitle' && (
          <FlashList
            estimatedItemSize={70}
            data={textTracks}
            ListHeaderComponent={
              <View>
                <Text className="text-lg font-bold text-center text-white">
                  Subtitle
                </Text>
                <TouchableOpacity
                  className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-3"
                  onPress={() => {
                    try { player.selectTextTrack?.(null); } catch(e) {}
                    setShowSettings(false);
                  }}>
                  <Text className="text-base font-semibold text-white">
                    Disabled
                  </Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              <>
                <TouchableOpacity
                  className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                  onPress={async () => {
                    try {
                      const res = await DocumentPicker.getDocumentAsync({
                        type: [
                          'text/vtt',
                          'application/x-subrip',
                          'text/srt',
                          'application/ttml+xml',
                        ],
                        multiple: false,
                      });

                      if (!res.canceled && res.assets?.[0]) {
                        const asset = res.assets[0];
                        const track = {
                          type: asset.mimeType as any,
                          title:
                            asset.name && asset.name.length > 20
                              ? asset.name.slice(0, 20) + '...'
                              : asset.name || 'undefined',
                          language: 'und',
                          uri: asset.uri,
                        };
                        setExternalSubs?.((prev: any) => [track, ...prev]);
                      }
                    } catch (err) {
                      console.log(err);
                    }
                  }}>
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text className="text-base font-semibold text-white">
                    Add external file
                  </Text>
                </TouchableOpacity>
                <SearchSubtitles
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setExternalSubs={setExternalSubs}
                />
              </>
            }
            renderItem={({ item: track }: any) => (
              <TouchableOpacity
                className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                onPress={() => {
                  try { player.selectTextTrack?.(track); } catch(e) {}
                  setShowSettings(false);
                }}>
                <Text
                  className={'text-base font-semibold'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.language}
                </Text>
                <Text
                  className={'text-sm italic'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.type}
                </Text>
                <Text
                  className={'text-sm italic'}
                  style={{ color: track.selected ? primary : 'white' }}>
                  {track.title}
                </Text>
                {track.selected && (
                  <MaterialIcons name="check" size={20} color="white" />
                )}
              </TouchableOpacity>
            )}
          />
        )}

        {/* Server Tab */}
        {activeTab === 'server' && (
          <View className="flex flex-row w-full h-full p-1 px-4">
            <ScrollView className="border-r border-white/50">
              <Text className="w-full text-center text-white text-lg font-extrabold">
                Server
              </Text>
              {streamData?.length > 0 &&
                streamData?.map((track: any, i: number) => (
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                    key={i}
                    onPress={() => {
                      onServerSelect?.(track);
                      setShowSettings(false);
                    }}>
                    <Text
                      className={'text-base capitalize font-semibold'}
                      style={{
                        color: track.link === selectedStream?.link ? primary : 'white',
                      }}>
                      {track.server}
                    </Text>
                    {track.link === selectedStream?.link && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView>
              <Text className="w-full text-center text-white text-lg font-extrabold">
                Quality
              </Text>
              {videoTracks &&
                videoTracks.map((track: any, i: number) => (
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                    key={i}
                    onPress={() => {
                      try { player.selectedVideoTrack = track; } catch(e) {}
                      setShowSettings(false);
                    }}>
                    <Text
                      className={'text-base font-semibold pl-4'}
                      style={{
                        color: track.selected ? primary : 'white',
                      }}>
                      {track.height + 'x' + track.width}
                    </Text>
                    <Text
                      style={{ color: track.selected ? primary : 'white' }}>
                      {!!track.bitrate && `| Bitrate ${track.bitrate}`}
                      {!!track.codecs && `| Codec ${track.codecs}`}
                    </Text>
                    {track.selected && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Speed Tab */}
        {activeTab === 'speed' && (
          <ScrollView className="w-full h-full p-1 px-4">
            <Text className="text-lg font-bold text-center text-white">
              Playback Speed
            </Text>
            {playbacks.map((rate, i) => (
              <TouchableOpacity
                className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                key={i}
                onPress={() => {
                  try { player.rate = rate; } catch(e) {}
                  setShowSettings(false);
                }}>
                <Text
                  className={'text-lg font-semibold'}
                  style={{ color: currentRate === rate ? primary : 'white' }}>
                  {rate}x
                </Text>
                {currentRate === rate && (
                  <MaterialIcons name="check" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
};

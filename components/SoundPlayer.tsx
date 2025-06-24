import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2, Timer } from 'lucide-react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSounds } from '../context/SoundContext';
import { BlurView } from 'expo-blur';

// Only import Slider on non-web platforms
let Slider: any = null;
if (Platform.OS !== 'web') {
  try {
    Slider = require('@react-native-community/slider').default;
  } catch (error) {
    console.warn('Slider not available on this platform');
  }
}

// CallTuneAI brand colors
const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
  darkBackground: '#1A1A1A',
};

const SoundPlayer: React.FC = () => {
  const { 
    currentSound, 
    isPlaying, 
    isLooping,
    playbackPosition, 
    playbackDuration,
    playSound, 
    pauseSound, 
    seekSound,
    toggleLooping,
    volume,
    setVolume
  } = useSounds();

  // Session timer state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Start session timer when first sound plays
  useEffect(() => {
    if (isPlaying && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
  }, [isPlaying, sessionStartTime]);

  // Update elapsed time every second
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Reset session timer
  const resetSessionTimer = () => {
    setSessionStartTime(null);
    setElapsedTime(0);
  };

  if (!currentSound) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = playbackDuration > 0 ? playbackPosition / playbackDuration : 0;

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress * 100}%`,
      backgroundColor: BRAND_COLORS.brightBlue,
    };
  });

  const handleSeek = (event: any) => {
    if (Platform.OS === 'web') {
      return;
    }
    
    const { locationX } = event.nativeEvent;
    const { width } = event.nativeEvent.layout;
    const position = (locationX / width) * playbackDuration;
    seekSound(position);
  };

  const handleVolumeChange = (value: number) => {
    if (Platform.OS !== 'web') {
      setVolume(value);
    }
  };

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios' 
    ? { intensity: 80, tint: "dark" as "dark" } 
    : {};

  return (
    <Container style={styles.container} {...containerProps}>
      {/* Top Section - Sound Info & Session Timer */}
      <View style={styles.topSection}>
        <View style={styles.soundInfo}>
          <Text style={styles.title} numberOfLines={1}>{currentSound.name}</Text>
          <Text style={styles.category}>{currentSound.category}</Text>
        </View>
        
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTimer}>
            <Timer size={14} color={BRAND_COLORS.brightBlue} />
            <Text style={styles.sessionTimeText}>
              {formatElapsedTime(elapsedTime)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetSessionTimer}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle Section - Progress Bar */}
      <View style={styles.progressSection}>
        <Text style={styles.time}>{formatTime(playbackPosition)}</Text>
        <TouchableOpacity 
          style={styles.progressBar} 
          activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
          onPress={handleSeek}
          disabled={Platform.OS === 'web'}
        >
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(playbackDuration)}</Text>
      </View>

      {/* Bottom Section - Controls */}
      <View style={styles.controlsSection}>
        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => Platform.OS !== 'web' && seekSound(Math.max(0, playbackPosition - 10))}
            disabled={Platform.OS === 'web'}
          >
            <SkipBack size={20} color={Platform.OS === 'web' ? "#666666" : "#FFFFFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={isPlaying ? pauseSound : playSound}
          >
            {isPlaying ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => Platform.OS !== 'web' && seekSound(Math.min(playbackDuration, playbackPosition + 10))}
            disabled={Platform.OS === 'web'}
          >
            <SkipForward size={20} color={Platform.OS === 'web' ? "#666666" : "#FFFFFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isLooping && styles.activeControlButton]} 
            onPress={toggleLooping}
          >
            <Repeat size={20} color={isLooping ? BRAND_COLORS.brightBlue : "#FFFFFF"} />
          </TouchableOpacity>
        </View>

        {/* Volume Control - Always at Bottom */}
        <View style={styles.volumeSection}>
          <Volume2 size={16} color="#AAAAAA" />
          
          {Platform.OS === 'web' ? (
            <View style={styles.webVolumeContainer}>
              <Text style={styles.webVolumeText}>
                Volume: {Math.round(volume * 100)}% (Use system controls)
              </Text>
            </View>
          ) : Slider ? (
            <>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={BRAND_COLORS.brightBlue}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbStyle={{ 
                  backgroundColor: BRAND_COLORS.brightBlue,
                  width: 16,
                  height: 16,
                }}
                trackStyle={{ height: 3, borderRadius: 2 }}
              />
              <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
            </>
          ) : (
            <Text style={styles.volumeText}>Volume: {Math.round(volume * 100)}%</Text>
          )}
        </View>
      </View>

      {/* Web Platform Notice */}
      {Platform.OS === 'web' && (
        <View style={styles.webNotice}>
          <Text style={styles.webNoticeText}>
            ⚠️ Limited functionality in web preview. Full features available on mobile.
          </Text>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above tab bar
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : BRAND_COLORS.deepBlue,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Top Section
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  soundInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  category: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  sessionInfo: {
    alignItems: 'flex-end',
  },
  sessionTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTimeText: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#AAAAAA',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },

  // Progress Section
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  time: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    width: 35,
    textAlign: 'center',
  },

  // Controls Section
  controlsSection: {
    gap: 12,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 16,
  },
  activeControlButton: {
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLORS.brightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },

  // Volume Section - Fixed at Bottom
  volumeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  volumeSlider: {
    flex: 1,
    height: 24,
    marginHorizontal: 12,
  },
  volumeText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    width: 30,
    textAlign: 'right',
  },
  webVolumeContainer: {
    flex: 1,
    marginLeft: 12,
  },
  webVolumeText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },

  // Web Notice
  webNotice: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  webNoticeText: {
    color: '#FFA500',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default SoundPlayer;
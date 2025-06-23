import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSounds } from '../context/SoundContext';
import { BlurView } from 'expo-blur';

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
    toggleLooping
  } = useSounds();

  if (!currentSound) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
    const { locationX } = event.nativeEvent;
    const { width } = event.nativeEvent.layout;
    const position = (locationX / width) * playbackDuration;
    seekSound(position);
  };

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios' 
    ? { intensity: 50, tint: "dark" as "dark" } 
    : {};

  return (
    <Container style={styles.container} {...containerProps}>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentSound.name}</Text>
        <Text style={styles.category}>{currentSound.category}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(playbackPosition)}</Text>
        <TouchableOpacity 
          style={styles.progressBar} 
          activeOpacity={0.7}
          onPress={handleSeek}
        >
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(playbackDuration)}</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => seekSound(Math.max(0, playbackPosition - 10))}>
          <SkipBack size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={isPlaying ? pauseSound : playSound}
        >
          {isPlaying ? (
            <Pause size={28} color="#FFFFFF" />
          ) : (
            <Play size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => seekSound(Math.min(playbackDuration, playbackPosition + 10))}>
          <SkipForward size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isLooping && styles.activeControlButton]} 
          onPress={toggleLooping}
        >
          <Repeat size={24} color={isLooping ? BRAND_COLORS.brightBlue : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  category: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginHorizontal: 8,
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
    width: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 12,
  },
  activeControlButton: {
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
    borderRadius: 20,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND_COLORS.brightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
});

export default SoundPlayer;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Timer } from 'lucide-react-native';
import { useSounds } from '../context/SoundContext';
import { BlurView } from 'expo-blur';

// CallTuneAI brand colors
const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

const SoundPlayer: React.FC = () => {
  const { currentSound, isPlaying } = useSounds();
  
  // Session timer state - independent of individual sounds
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

  // Only show if there's a current sound
  if (!currentSound) return null;

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios' 
    ? { intensity: 80, tint: "dark" as "dark" } 
    : {};

  return (
    <Container style={styles.container} {...containerProps}>
      {/* Session Timer - Independent of individual sounds */}
      <View style={styles.sessionContainer}>
        <View style={styles.sessionTimer}>
          <Timer size={16} color={BRAND_COLORS.brightBlue} />
          <Text style={styles.sessionTimeText}>
            Session: {formatElapsedTime(elapsedTime)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetSessionTimer}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTimeText: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});

export default SoundPlayer;
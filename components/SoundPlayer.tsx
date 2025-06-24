import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Volume2 } from 'lucide-react-native';
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
};

const SoundPlayer: React.FC = () => {
  const { currentSound, volume, setVolume } = useSounds();

  // Only show if there's a current sound
  if (!currentSound) return null;

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
      <View style={styles.volumeContainer}>
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
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeSlider: {
    flex: 1,
    height: 24,
    marginHorizontal: 12,
  },
  volumeText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    width: 35,
    textAlign: 'right',
  },
  webVolumeContainer: {
    flex: 1,
    marginLeft: 12,
  },
  webVolumeText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

export default SoundPlayer;
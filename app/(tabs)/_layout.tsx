import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Play, Upload, Settings, Info } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Slider from '@react-native-community/slider';
import SystemSetting from 'react-native-system-setting';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function TabLayout() {
  const router = useRouter();
  const [volume, setVolume] = useState(0.5);
  let volumeListener: any = null;

  useEffect(() => {
    // Only use volume controls on native platforms
    if (Platform.OS !== 'web') {
      // Get initial volume
      SystemSetting.getVolume().then((vol) => {
        console.log(vol, "s");
        setVolume(vol);
      });

      // Set up volume listener
      volumeListener = SystemSetting.addVolumeListener((data) => {
        setVolume(data.value);
      });
    }

    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/register');
      }
    });

    // Clean up listener
    return () => {
      if (volumeListener && Platform.OS !== 'web') {
        SystemSetting.removeVolumeListener(volumeListener);
      }
    };
  }, []);

  const handleVolumeChange = (value: number) => {
    console.log('Volume changed:', value);
    setVolume(value);
    
    // Only set system volume on native platforms
    if (Platform.OS !== 'web') {
      SystemSetting.setVolume(value, {
        playSound: true, // Set to true if you want to play sound when changing volume
        showUI: true,   // Set to true to show native volume UI
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Volume Control - Only show on native platforms */}
      {Platform.OS !== 'web' && (
        <View style={styles.sliderWrapper}>
          <BlurView intensity={60} tint="dark" style={styles.sliderBackground}>
            <Text style={styles.sliderLabel}>Volume</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              step={0.01}
              minimumTrackTintColor={BRAND_COLORS.brightBlue}
              maximumTrackTintColor="#888"
              thumbTintColor={BRAND_COLORS.brightBlue}
              onValueChange={handleVolumeChange}
            />
            <Text style={styles.volumeValue}>{`${Math.round(volume * 100)}%`}</Text>
          </BlurView>
        </View>
      )}

      {/* Tabs */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : BRAND_COLORS.deepBlue,
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: 8,
          },
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : null,
          tabBarActiveTintColor: BRAND_COLORS.brightBlue,
          tabBarInactiveTintColor: BRAND_COLORS.lightGray,
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: Platform.select({ ios: 11, android: 12, default: 12 }),
            marginTop: -4,
          },
          animation: 'none',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => <Play size={size * 0.8} color={color} />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => <Upload size={size * 0.8} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={size * 0.8} color={color} />,
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'About',
            tabBarIcon: ({ color, size }) => <Info size={size * 0.8} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrapper: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sliderBackground: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 4,
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  volumeValue: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 12,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
});
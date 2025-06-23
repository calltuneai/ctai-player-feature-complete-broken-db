import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Play, Upload, Settings, Info } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import SoundPlayer from '../../components/SoundPlayer';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/register');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
      
      {/* Sound Player - appears above tab bar when playing */}
      <SoundPlayer />
    </View>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { SoundProvider } from '../context/SoundContext';
import { checkAuth } from '../lib/auth';
import { checkAppConfig, getCurrentAppVersion, isVersionOutdated } from '../lib/app-config';
import { StatusBar } from 'expo-status-bar';
import UpdateRequiredModal from '../components/UpdateRequiredModal';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Orbitron_400Regular,
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import {
  RobotoSlab_400Regular,
  RobotoSlab_700Bold,
} from '@expo-google-fonts/roboto-slab'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync();

type AppState = 'loading' | 'update-required' | 'ready';

export default function RootLayout() {
  useFrameworkReady();
  
  const [appState, setAppState] = useState<AppState>('loading');
  const [updateMessage, setUpdateMessage] = useState('');
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isOffline?: boolean;
  }>({ isAuthenticated: false });
  
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Orbitron-Regular': Orbitron_400Regular,
    'Orbitron-Medium': Orbitron_500Medium,
    'Orbitron-SemiBold': Orbitron_600SemiBold,
    'Orbitron-Bold': Orbitron_700Bold,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'RobotoSlab-Regular': RobotoSlab_400Regular,
    'RobotoSlab-Bold': RobotoSlab_700Bold,
  });

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      // Wait for fonts to load
      if (!fontsLoaded && !fontError) {
        return;
      }

      try {
        // Step 1: Check for app updates (kill switch)
        const config = await checkAppConfig();
        const currentVersion = getCurrentAppVersion();
        
        if (config.mustUpdate || isVersionOutdated(currentVersion, config.minVersion)) {
          setUpdateMessage(config.message);
          setAppState('update-required');
          await SplashScreen.hideAsync();
          return;
        }

        // Step 2: Handle authentication and routing
        const authResult = await checkAuth();
        const currentRoute = segments[0] || '';

        if (__DEV__) {
          console.log('Auth status:', authResult.isAuthenticated, 'Current route:', currentRoute);
          if (authResult.isOffline) console.log('Running in offline mode');
        }

        setAuthState({
          isAuthenticated: authResult.isAuthenticated,
          isOffline: authResult.isOffline
        });

        // Route based on auth state
        if (!authResult.isAuthenticated && currentRoute !== 'auth') {
          if (__DEV__) console.log('Redirecting to register');
          router.replace('/auth/register');
        } else if (authResult.isAuthenticated && currentRoute === 'auth') {
          if (__DEV__) console.log('Redirecting to tabs');
          router.replace('/(tabs)');
        }

        // Step 3: App is ready
        setAppState('ready');
        await SplashScreen.hideAsync();

      } catch (error) {
        console.error('App initialization error:', error);
        // Fallback to auth screen on error
        router.replace('/auth/register');
        setAppState('ready');
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [fontsLoaded, fontError, segments, router]);

  // Handle font loading errors
  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  // Debug close handler for update modal
  const handleDebugClose = useCallback(() => {
    if (__DEV__) {
      setAppState('ready');
    }
  }, []);

  // Show update modal if required
  if (appState === 'update-required') {
    return (
      <SoundProvider>
        <UpdateRequiredModal
          visible={true}
          message={updateMessage}
          onClose={__DEV__ ? handleDebugClose : undefined}
        />
        <StatusBar style="light" />
      </SoundProvider>
    );
  }

  // Show loading state (splash screen is still visible)
  if (appState === 'loading') {
    return (
      <SoundProvider>
        <Slot />
      </SoundProvider>
    );
  }

  // App is ready - show main content
  return (
    <SoundProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="light" />
        {authState.isOffline && (
          <View style={styles.offlineIndicator}>
            <View style={styles.offlineDot} />
          </View>
        )}
      </View>
    </SoundProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
});
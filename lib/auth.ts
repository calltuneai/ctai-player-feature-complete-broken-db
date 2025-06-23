import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Platform } from 'react-native';

const AUTH_STORAGE_KEY = '@calltuneai:auth';

interface StoredAuthData {
  session: Session;
  lastVerified: string;
  isVerified: boolean;
  userProfile?: any;
}

export async function storeAuthData(session: Session, isVerified: boolean, userProfile?: any) {
  const authData: StoredAuthData = {
    session,
    lastVerified: new Date().toISOString(),
    isVerified,
    userProfile
  };
  
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } else {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    }
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
}

export async function getStoredAuthData(): Promise<StoredAuthData | null> {
  try {
    let data: string | null;
    
    if (Platform.OS === 'web') {
      data = localStorage.getItem(AUTH_STORAGE_KEY);
    } else {
      data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting stored auth data:', error);
    return null;
  }
}

export async function clearAuthData() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

export async function checkAuth() {
  try {
    // First check local storage for offline capability
    const storedAuth = await getStoredAuthData();
    
    if (storedAuth?.isVerified) {
      // Try to refresh the session if we have stored auth and we're online
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          // Check if user is still verified in the database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_verified, first_name, last_name, email, trial_end, is_trial_expired')
            .eq('id', session.user.id)
            .single();

          if (!userError && userData?.is_verified) {
            // Update stored auth with fresh session and user data
            await storeAuthData(session, true, userData);
            return { isAuthenticated: true, session, userProfile: userData };
          }
        }
      } catch (onlineError) {
        console.log('Offline mode - using stored auth data');
      }
      
      // If online refresh fails but we have verified stored auth, use it for offline mode
      return { 
        isAuthenticated: true, 
        session: storedAuth.session, 
        userProfile: storedAuth.userProfile,
        isOffline: true 
      };
    }

    // If not verified locally, try online verification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Check if user exists in our users table and is verified
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_verified, first_name, last_name, email, trial_end, is_trial_expired')
        .eq('id', session.user.id)
        .single();

      if (!error && userData?.is_verified) {
        // Store verification status locally for offline access
        await storeAuthData(session, true, userData);
        return { isAuthenticated: true, session, userProfile: userData };
      }
    }

    return { isAuthenticated: false, session: null };
  } catch (error) {
    console.error('Auth check error:', error);
    // If offline, fall back to stored auth data
    const storedAuth = await getStoredAuthData();
    return {
      isAuthenticated: !!storedAuth?.isVerified,
      session: storedAuth?.session || null,
      userProfile: storedAuth?.userProfile,
      isOffline: true
    };
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
    await clearAuthData();
  } catch (error) {
    console.error('Sign out error:', error);
    // Clear local data even if remote sign out fails
    await clearAuthData();
  }
}

export async function refreshUserProfile(userId: string) {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_verified, first_name, last_name, email, trial_end, is_trial_expired')
      .eq('id', userId)
      .single();

    if (!error && userData) {
      // Update stored auth data with fresh user profile
      const storedAuth = await getStoredAuthData();
      if (storedAuth) {
        await storeAuthData(storedAuth.session, userData.is_verified, userData);
      }
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing user profile:', error);
    return null;
  }
}
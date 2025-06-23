import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

const AUTH_STORAGE_KEY = '@calltuneai:auth';

interface StoredAuthData {
  session: Session;
  lastVerified: string;
  isVerified: boolean;
}

export async function storeAuthData(session: Session, isVerified: boolean) {
  const authData: StoredAuthData = {
    session,
    lastVerified: new Date().toISOString(),
    isVerified
  };
  
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

export async function getStoredAuthData(): Promise<StoredAuthData | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting stored auth data:', error);
    return null;
  }
}

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

export async function checkAuth() {
  try {
    // First check local storage for offline capability
    const storedAuth = await getStoredAuthData();
    
    if (storedAuth?.isVerified) {
      // Try to refresh the session if we have stored auth
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        // Update stored auth with fresh session
        await storeAuthData(session, true);
        return { isAuthenticated: true, session };
      }
      
      // If online refresh fails but we have verified stored auth, use it for offline mode
      return { isAuthenticated: true, session: storedAuth.session };
    }

    // If not verified locally, try online verification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Check if user exists in our users table and is verified
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_verified')
        .eq('id', session.user.id)
        .single();

      if (!error && userData?.is_verified) {
        // Store verification status locally for offline access
        await storeAuthData(session, true);
        return { isAuthenticated: true, session };
      }
    }

    return { isAuthenticated: false, session: null };
  } catch (error) {
    console.error('Auth check error:', error);
    // If offline, fall back to stored auth data
    const storedAuth = await getStoredAuthData();
    return {
      isAuthenticated: !!storedAuth?.isVerified,
      session: storedAuth?.session || null
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
import { supabase } from './supabase';

export interface AppConfig {
  id: string;
  must_update: boolean;
  message: string;
  min_version: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if the app needs to be updated (kill switch)
 * This function works without authentication
 */
export async function checkAppConfig(): Promise<{
  mustUpdate: boolean;
  message: string;
  minVersion: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('must_update, message, min_version')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching app config:', error);
      // Fail open - if we can't check, allow app to continue
      return {
        mustUpdate: false,
        message: '',
        minVersion: '1.0.0',
        error: error.message
      };
    }

    return {
      mustUpdate: data.must_update || false,
      message: data.message || 'A new version is required.',
      minVersion: data.min_version || '1.0.0'
    };
  } catch (error) {
    console.error('Error in checkAppConfig:', error);
    // Fail open - if we can't check, allow app to continue
    return {
      mustUpdate: false,
      message: '',
      minVersion: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current app version from app.json
 */
export function getCurrentAppVersion(): string {
  // In a real app, you'd import this from app.json or expo-constants
  // For now, we'll use a hardcoded version
  return '1.0.0';
}

/**
 * Compare version strings (simple semantic versioning)
 * Returns true if current version is less than required version
 */
export function isVersionOutdated(currentVersion: string, minVersion: string): boolean {
  const current = currentVersion.split('.').map(Number);
  const minimum = minVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
    const currentPart = current[i] || 0;
    const minimumPart = minimum[i] || 0;

    if (currentPart < minimumPart) return true;
    if (currentPart > minimumPart) return false;
  }

  return false;
}
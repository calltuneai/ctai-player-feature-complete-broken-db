import { supabase } from './supabase';

export async function checkUserData(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in checkUserData:', error);
    return null;
  }
}

export async function getUserSettings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return null;
  }
}

export async function createUserSettings(userId: string, settings: {
  high_quality_enabled?: boolean;
  bluetooth_auto_connect?: boolean;
  keep_screen_on?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        ...settings
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserSettings:', error);
    return null;
  }
}

export async function updateUserSettings(userId: string, settings: {
  high_quality_enabled?: boolean;
  bluetooth_auto_connect?: boolean;
  keep_screen_on?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return null;
  }
}
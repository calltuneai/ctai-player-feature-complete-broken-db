import { supabase } from './supabase';
import { Sound, UserSound } from '../types/sound';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Upload a sound file to Supabase Storage
 */
export async function uploadSoundFile(
  userId: string, 
  fileUri: string, 
  fileName: string
): Promise<string> {
  try {
    // For web, we need to handle file upload differently
    if (Platform.OS === 'web') {
      // For web, the fileUri might be a blob URL or file path
      // This is a simplified version - in production you'd handle file uploads properly
      throw new Error('File upload not implemented for web platform');
    }

    // Read the file as base64
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });

    // Upload to Supabase Storage
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('user-sounds')
      .upload(filePath, blob);

    if (error) {
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Error uploading sound file:', error);
    throw error;
  }
}

/**
 * Get download URL for a sound file
 */
export async function getSoundFileUrl(filePath: string): Promise<string> {
  try {
    const { data } = await supabase.storage
      .from('user-sounds')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (!data?.signedUrl) {
      throw new Error('Failed to get download URL');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting sound file URL:', error);
    throw error;
  }
}

/**
 * Save sound metadata to database
 */
export async function saveSoundToDatabase(
  userId: string,
  sound: Omit<Sound, 'id' | 'uri'>,
  filePath: string
): Promise<UserSound> {
  try {
    const { data, error } = await supabase
      .from('user_sounds')
      .insert({
        user_id: userId,
        name: sound.name,
        description: sound.description,
        category: sound.category,
        tags: sound.tags,
        duration: sound.duration,
        file_path: filePath,
        file_size: sound.size,
        is_favorite: sound.favorite,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving sound to database:', error);
    throw error;
  }
}

/**
 * Get all sounds for a user from database
 */
export async function getUserSounds(userId: string): Promise<UserSound[]> {
  try {
    const { data, error } = await supabase
      .from('user_sounds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user sounds:', error);
    throw error;
  }
}

/**
 * Update sound metadata in database
 */
export async function updateSoundInDatabase(
  soundId: string,
  updates: Partial<Pick<UserSound, 'name' | 'description' | 'category' | 'tags' | 'is_favorite'>>
): Promise<UserSound> {
  try {
    const { data, error } = await supabase
      .from('user_sounds')
      .update(updates)
      .eq('id', soundId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating sound in database:', error);
    throw error;
  }
}

/**
 * Delete sound from database and storage
 */
export async function deleteSoundFromDatabase(soundId: string, filePath: string): Promise<void> {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('user-sounds')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_sounds')
      .delete()
      .eq('id', soundId);

    if (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting sound:', error);
    throw error;
  }
}

/**
 * Convert UserSound to Sound format for local use
 */
export async function convertUserSoundToSound(userSound: UserSound): Promise<Sound> {
  try {
    // Get download URL for the file
    const uri = await getSoundFileUrl(userSound.file_path);

    return {
      id: userSound.id,
      name: userSound.name,
      description: userSound.description,
      duration: userSound.duration,
      uri: uri,
      size: userSound.file_size,
      dateAdded: userSound.created_at,
      category: userSound.category,
      favorite: userSound.is_favorite,
      tags: userSound.tags,
      // Include database fields
      user_id: userSound.user_id,
      file_path: userSound.file_path,
      created_at: userSound.created_at,
      updated_at: userSound.updated_at,
    };
  } catch (error) {
    console.error('Error converting UserSound to Sound:', error);
    throw error;
  }
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Sound } from '../types/sound';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { 
  getUserSounds, 
  saveSoundToDatabase, 
  updateSoundInDatabase, 
  deleteSoundFromDatabase,
  uploadSoundFile,
  convertUserSoundToSound 
} from '../lib/sounds';

interface SoundContextType {
  sounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  isLooping: boolean;
  playbackPosition: number;
  playbackDuration: number;
  volume: number;
  highQualityEnabled: boolean;
  isLoading: boolean;
  setVolume: (volume: number) => void;
  setHighQualityEnabled: (enabled: boolean) => void;
  loadAndPlaySound: (sound: Sound) => Promise<void>;
  playSound: () => Promise<void>;
  pauseSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  seekSound: (position: number) => Promise<void>;
  toggleLooping: () => Promise<void>;
  addSound: (sound: Sound) => Promise<void>;
  deleteSound: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateSound: (sound: Sound) => Promise<void>;
  clearAllSounds: () => Promise<void>;
  syncSounds: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const getDirectoryPath = () => {
  return Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}sounds/`;
};

const getDataFilePath = () => {
  return Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}sounds.json`;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [highQualityEnabled, setHighQualityEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize audio and load sounds
  useEffect(() => {
    const initialize = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          // Load sounds from database for authenticated users
          await syncSounds();
        } else {
          // Load local sounds for unauthenticated users (fallback)
          await loadLocalSounds();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio:', error);
        setSounds([]);
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user);
          await syncSounds();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSounds([]);
          if (soundObject) {
            await soundObject.unloadAsync();
            setSoundObject(null);
          }
          setCurrentSound(null);
          setIsPlaying(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [soundObject]);

  // Load local sounds (fallback for offline/unauthenticated users)
  const loadLocalSounds = async () => {
    try {
      if (Platform.OS !== 'web') {
        const dirInfo = await FileSystem.getInfoAsync(getDirectoryPath());
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(getDirectoryPath(), { intermediates: true });
        }
        
        const fileInfo = await FileSystem.getInfoAsync(getDataFilePath());
        if (fileInfo.exists) {
          const soundsData = await FileSystem.readAsStringAsync(getDataFilePath());
          const loadedSounds = JSON.parse(soundsData);
          if (Array.isArray(loadedSounds)) {
            setSounds(loadedSounds);
          }
        }
      } else {
        const soundsData = localStorage.getItem('sounds');
        if (soundsData) {
          const loadedSounds = JSON.parse(soundsData);
          if (Array.isArray(loadedSounds)) {
            setSounds(loadedSounds);
          }
        }
      }
    } catch (error) {
      console.error('Error loading local sounds:', error);
      setSounds([]);
    }
  };

  // Sync sounds with database
  const syncSounds = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const userSounds = await getUserSounds(currentUser.id);
      
      // Convert database sounds to local format
      const convertedSounds = await Promise.all(
        userSounds.map(userSound => convertUserSoundToSound(userSound))
      );
      
      setSounds(convertedSounds);
    } catch (error) {
      console.error('Error syncing sounds:', error);
      // Fallback to local sounds if database sync fails
      await loadLocalSounds();
    } finally {
      setIsLoading(false);
    }
  };

  // Save sounds locally (backup)
  useEffect(() => {
    if (!isInitialized || !currentUser) return;

    const saveSoundsLocally = async () => {
      try {
        if (sounds.length > 0) {
          if (Platform.OS !== 'web') {
            await FileSystem.writeAsStringAsync(getDataFilePath(), JSON.stringify(sounds));
          } else {
            localStorage.setItem('sounds', JSON.stringify(sounds));
          }
        }
      } catch (error) {
        console.error('Error saving sounds locally:', error);
      }
    };

    saveSoundsLocally();
  }, [sounds, isInitialized, currentUser]);

  // Update volume when it changes
  useEffect(() => {
    if (soundObject) {
      soundObject.setVolumeAsync(volume);
    }
  }, [volume, soundObject]);

  // Playback status updates
  useEffect(() => {
    if (!soundObject) return;

    const interval = setInterval(async () => {
      try {
        const status = await soundObject.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis / 1000);
          setPlaybackDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
          setIsPlaying(status.isPlaying);
        }
      } catch (error) {
        console.error('Error getting playback status:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [soundObject]);

  const loadAndPlaySound = async (sound: Sound) => {
    try {
      if (soundObject) {
        await soundObject.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: sound.uri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: volume,
          shouldCorrectPitch: highQualityEnabled,
        },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        }
      );

      setSoundObject(newSound);
      setCurrentSound(sound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading and playing sound:', error);
      throw error;
    }
  };

  const playSound = async () => {
    if (!soundObject) return;
    try {
      await soundObject.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    if (!soundObject) return;
    try {
      await soundObject.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const stopSound = async () => {
    if (!soundObject) return;
    
    try {
      await soundObject.stopAsync();
      await soundObject.setPositionAsync(0);
      setIsPlaying(false);
      setPlaybackPosition(0);
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const seekSound = async (position: number) => {
    if (!soundObject) return;
    
    try {
      await soundObject.setPositionAsync(position * 1000);
      setPlaybackPosition(position);
    } catch (error) {
      console.error('Error seeking sound:', error);
    }
  };

  const toggleLooping = async () => {
    if (!soundObject) return;
    
    try {
      const newLoopingState = !isLooping;
      await soundObject.setIsLoopingAsync(newLoopingState);
      setIsLooping(newLoopingState);
    } catch (error) {
      console.error('Error toggling loop mode:', error);
    }
  };

  const addSound = async (sound: Sound) => {
    try {
      if (currentUser) {
        // Upload to database and storage
        let filePath = sound.file_path;
        
        // If it's a new file (not from database), upload it
        if (!filePath && sound.uri && !sound.uri.startsWith('http')) {
          const fileName = sound.uri.split('/').pop() || `sound-${Date.now()}.mp3`;
          filePath = await uploadSoundFile(currentUser.id, sound.uri, fileName);
        }

        if (filePath) {
          const userSound = await saveSoundToDatabase(currentUser.id, sound, filePath);
          const convertedSound = await convertUserSoundToSound(userSound);
          setSounds(prevSounds => [convertedSound, ...prevSounds]);
        }
      } else {
        // Fallback to local storage for unauthenticated users
        if (Platform.OS !== 'web') {
          const SOUNDS_DIRECTORY = getDirectoryPath();
          
          const fileInfo = await FileSystem.getInfoAsync(sound.uri);
          if (!fileInfo.exists) {
            throw new Error('Sound file does not exist');
          }

          if (!sound.uri.startsWith(SOUNDS_DIRECTORY)) {
            const fileName = sound.uri.split('/').pop() || `sound-${Date.now()}.mp3`;
            const newUri = `${SOUNDS_DIRECTORY}${fileName}`;
            
            await FileSystem.copyAsync({
              from: sound.uri,
              to: newUri
            });
            
            sound.uri = newUri;
          }
        }

        setSounds(prevSounds => [sound, ...prevSounds]);
      }
    } catch (error) {
      console.error('Error adding sound:', error);
      throw error;
    }
  };

  const deleteSound = async (id: string) => {
    try {
      const soundToDelete = sounds.find(s => s.id === id);
      if (!soundToDelete) return;

      if (currentSound && currentSound.id === id) {
        if (soundObject) {
          await soundObject.unloadAsync();
          setSoundObject(null);
        }
        setCurrentSound(null);
        setIsPlaying(false);
      }

      if (currentUser && soundToDelete.file_path) {
        // Delete from database and storage
        await deleteSoundFromDatabase(id, soundToDelete.file_path);
      } else {
        // Delete local file
        if (Platform.OS !== 'web') {
          const SOUNDS_DIRECTORY = getDirectoryPath();
          if (soundToDelete.uri.startsWith(SOUNDS_DIRECTORY)) {
            await FileSystem.deleteAsync(soundToDelete.uri);
          }
        }
      }

      setSounds(prevSounds => prevSounds.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting sound:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const sound = sounds.find(s => s.id === id);
      if (!sound) return;

      const newFavoriteStatus = !sound.favorite;

      if (currentUser && sound.file_path) {
        // Update in database
        await updateSoundInDatabase(id, { is_favorite: newFavoriteStatus });
      }

      // Update local state
      setSounds(prevSounds => 
        prevSounds.map(s => 
          s.id === id 
            ? { ...s, favorite: newFavoriteStatus } 
            : s
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const updateSound = async (updatedSound: Sound) => {
    try {
      if (currentUser && updatedSound.file_path) {
        // Update in database
        await updateSoundInDatabase(updatedSound.id, {
          name: updatedSound.name,
          description: updatedSound.description,
          category: updatedSound.category,
          tags: updatedSound.tags,
          is_favorite: updatedSound.favorite,
        });
      }

      // Update local state
      setSounds(prevSounds => 
        prevSounds.map(sound => 
          sound.id === updatedSound.id 
            ? updatedSound 
            : sound
        )
      );

      if (currentSound && currentSound.id === updatedSound.id) {
        setCurrentSound(updatedSound);
      }
    } catch (error) {
      console.error('Error updating sound:', error);
    }
  };

  const clearAllSounds = async () => {
    try {
      // Stop current playback
      if (soundObject) {
        await soundObject.unloadAsync();
        setSoundObject(null);
      }
      setCurrentSound(null);
      setIsPlaying(false);

      if (currentUser) {
        // Delete all user sounds from database
        // Note: This would require a bulk delete function
        // For now, we'll just clear the local state
        console.warn('Bulk delete from database not implemented');
      }

      // Clear local storage
      if (Platform.OS !== 'web') {
        const dirInfo = await FileSystem.getInfoAsync(getDirectoryPath());
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(getDirectoryPath(), { idempotent: true });
          await FileSystem.makeDirectoryAsync(getDirectoryPath(), { intermediates: true });
        }
        
        const fileInfo = await FileSystem.getInfoAsync(getDataFilePath());
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(getDataFilePath(), { idempotent: true });
        }
      } else {
        localStorage.removeItem('sounds');
      }

      setSounds([]);
    } catch (error) {
      console.error('Error clearing all sounds:', error);
    }
  };

  return (
    <SoundContext.Provider
      value={{
        sounds,
        currentSound,
        isPlaying,
        isLooping,
        playbackPosition,
        playbackDuration,
        volume,
        highQualityEnabled,
        isLoading,
        setVolume,
        setHighQualityEnabled,
        loadAndPlaySound,
        playSound,
        pauseSound,
        stopSound,
        seekSound,
        toggleLooping,
        addSound,
        deleteSound,
        toggleFavorite,
        updateSound,
        clearAllSounds,
        syncSounds,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};
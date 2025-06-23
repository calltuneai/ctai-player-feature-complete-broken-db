import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Sound } from '../types/sound';
import { Platform } from 'react-native';

interface SoundContextType {
  sounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  isLooping: boolean;
  playbackPosition: number;
  playbackDuration: number;
  highQualityEnabled: boolean;
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
  const [highQualityEnabled, setHighQualityEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio and CLEAR all existing sounds
  useEffect(() => {
    const initialize = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        // FORCE CLEAR ALL STORAGE - both web and mobile
        if (Platform.OS !== 'web') {
          // Clear mobile storage
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
          // Clear web storage completely
          localStorage.removeItem('sounds');
          localStorage.removeItem('calltuneai_sounds');
          localStorage.removeItem('predator_sounds');
          // Clear any other possible storage keys
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('sound') || key.includes('audio') || key.includes('sample')) {
              localStorage.removeItem(key);
            }
          });
        }

        // Ensure sounds array is completely empty
        setSounds([]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio:', error);
        // Even if there's an error, ensure we start with empty sounds
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

  // Save sounds when they change (but only if not empty)
  useEffect(() => {
    if (!isInitialized) return;

    const saveSounds = async () => {
      try {
        // Only save if there are actual sounds (not empty array)
        if (sounds.length > 0) {
          if (Platform.OS !== 'web') {
            await FileSystem.writeAsStringAsync(getDataFilePath(), JSON.stringify(sounds));
          } else {
            localStorage.setItem('sounds', JSON.stringify(sounds));
          }
        }
      } catch (error) {
        console.error('Error saving sounds:', error);
      }
    };

    saveSounds();
  }, [sounds, isInitialized]);

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
      // Unload current sound if exists
      if (soundObject) {
        await soundObject.unloadAsync();
      }

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: sound.uri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
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

      setSounds(prevSounds => [...prevSounds, sound]);
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

      if (Platform.OS !== 'web') {
        const SOUNDS_DIRECTORY = getDirectoryPath();
        if (soundToDelete.uri.startsWith(SOUNDS_DIRECTORY)) {
          await FileSystem.deleteAsync(soundToDelete.uri);
        }
      }

      setSounds(prevSounds => prevSounds.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting sound:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    setSounds(prevSounds => 
      prevSounds.map(sound => 
        sound.id === id 
          ? { ...sound, favorite: !sound.favorite } 
          : sound
      )
    );
  };

  const updateSound = async (updatedSound: Sound) => {
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

      // Clear storage
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
        localStorage.clear();
      }

      // Clear sounds array
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
        highQualityEnabled,
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
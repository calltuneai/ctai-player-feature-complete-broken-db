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
  volume: number;
  highQualityEnabled: boolean;
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

  // Initialize audio and load sounds
  useEffect(() => {
    const initialize = async () => {
      try {
        // Only set audio mode on non-web platforms
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
          });
        }

        // Load local sounds
        await loadLocalSounds();
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
        soundObject.unloadAsync().catch(console.error);
      }
    };
  }, []);

  // Load local sounds
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

  // Save sounds locally
  useEffect(() => {
    if (!isInitialized) return;

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
  }, [sounds, isInitialized]);

  // Update volume when it changes (with web safety)
  useEffect(() => {
    if (soundObject && Platform.OS !== 'web') {
      soundObject.setVolumeAsync(volume).catch(console.error);
    }
  }, [volume, soundObject]);

  // Playback status updates (with web safety and proper error handling)
  useEffect(() => {
    if (!soundObject) return;

    const interval = setInterval(async () => {
      try {
        const status = await soundObject.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition((status.positionMillis || 0) / 1000);
          setPlaybackDuration((status.durationMillis || 0) / 1000);
          setIsPlaying(status.isPlaying || false);
        }
      } catch (error) {
        console.error('Error getting playback status:', error);
        // Clear the interval if there's an error
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [soundObject]);

  const loadAndPlaySound = async (sound: Sound) => {
    try {
      // Stop and unload current sound
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch (error) {
          console.error('Error stopping previous sound:', error);
        }
        setSoundObject(null);
      }

      // Create new sound with web-safe configuration
      const audioConfig: any = {
        shouldPlay: true,
        isLooping: true,
        volume: volume,
      };

      // Add non-web specific options
      if (Platform.OS !== 'web') {
        audioConfig.shouldCorrectPitch = highQualityEnabled;
      }

      // Create status update callback with proper error handling
      const onPlaybackStatusUpdate = (status: any) => {
        try {
          if (status && status.isLoaded) {
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        } catch (error) {
          console.error('Error in playback status update:', error);
        }
      };

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: sound.uri },
        audioConfig,
        onPlaybackStatusUpdate
      );

      setSoundObject(newSound);
      setCurrentSound(sound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading and playing sound:', error);
      // Reset state on error
      setCurrentSound(null);
      setIsPlaying(false);
      setSoundObject(null);
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
      setIsPlaying(false);
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
      // Force reset state even if stop fails
      setIsPlaying(false);
      setPlaybackPosition(0);
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
      // Store locally on device - perfect for field use!
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
          try {
            await soundObject.stopAsync();
            await soundObject.unloadAsync();
          } catch (error) {
            console.error('Error stopping sound during delete:', error);
          }
          setSoundObject(null);
        }
        setCurrentSound(null);
        setIsPlaying(false);
      }

      // Delete local file
      if (Platform.OS !== 'web') {
        const SOUNDS_DIRECTORY = getDirectoryPath();
        if (soundToDelete.uri.startsWith(SOUNDS_DIRECTORY)) {
          try {
            await FileSystem.deleteAsync(soundToDelete.uri);
          } catch (error) {
            console.error('Error deleting sound file:', error);
          }
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
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch (error) {
          console.error('Error stopping sound during clear:', error);
        }
        setSoundObject(null);
      }
      setCurrentSound(null);
      setIsPlaying(false);

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
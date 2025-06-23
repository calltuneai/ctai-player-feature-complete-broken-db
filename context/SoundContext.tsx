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
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const getDirectoryPath = () => {
  return Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}sounds/`;
};

const getDataFilePath = () => {
  return Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}sounds.json`;
};

// Sample predator call data using the actual uploaded file
const createSampleSound = (): Sound => ({
  id: 'sample-predator-call-001',
  name: 'Sample Rabbit Distress Call',
  description: 'A high-quality sample rabbit distress call to test your setup and demonstrate CallTuneAI capabilities.',
  duration: 45, // Approximate duration - will be updated when loaded
  uri: Platform.OS === 'web' 
    ? '/assets/audio/demo_rabbit_distress.wav' // Web path
    : require('../assets/audio/demo_rabbit_distress.wav'),
  size: 1024 * 1024, // 1MB approximate
  dateAdded: new Date().toISOString(),
  category: 'Distress',
  favorite: false,
  tags: ['sample', 'demo', 'distress', 'rabbit'],
  isSample: true
});

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
  const [webPlaybackInterval, setWebPlaybackInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize audio and load saved sounds
  useEffect(() => {
    const initialize = async () => {
      try {
        // Only set audio mode on native platforms
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
          });

          const dirInfo = await FileSystem.getInfoAsync(getDirectoryPath());
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(getDirectoryPath(), { intermediates: true });
          }

          const fileInfo = await FileSystem.getInfoAsync(getDataFilePath());
          if (fileInfo.exists) {
            const data = await FileSystem.readAsStringAsync(getDataFilePath());
            const loadedSounds = JSON.parse(data);
            
            // Check if user has uploaded any sounds
            const userSounds = loadedSounds.filter((sound: Sound) => !sound.isSample);
            
            if (userSounds.length === 0) {
              // No user sounds, include sample
              const sampleSound = createSampleSound();
              setSounds([sampleSound]);
            } else {
              // User has sounds, don't include sample by default
              setSounds(userSounds);
            }
          } else {
            // First time - add sample sound
            const sampleSound = createSampleSound();
            setSounds([sampleSound]);
          }
        } else {
          // Web platform
          const storedSounds = localStorage.getItem('sounds');
          if (storedSounds) {
            const loadedSounds = JSON.parse(storedSounds);
            
            // Check if user has uploaded any sounds
            const userSounds = loadedSounds.filter((sound: Sound) => !sound.isSample);
            
            if (userSounds.length === 0) {
              // No user sounds, include sample
              const sampleSound = createSampleSound();
              setSounds([sampleSound]);
            } else {
              // User has sounds, don't include sample by default
              setSounds(userSounds);
            }
          } else {
            // First time - add sample sound
            const sampleSound = createSampleSound();
            setSounds([sampleSound]);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio:', error);
        // Still add sample sound even if audio initialization fails
        const sampleSound = createSampleSound();
        setSounds([sampleSound]);
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      if (webPlaybackInterval) {
        clearInterval(webPlaybackInterval);
      }
      if (soundObject && Platform.OS !== 'web') {
        soundObject.unloadAsync().catch(console.warn);
      }
    };
  }, []);

  // Save sounds when they change
  useEffect(() => {
    if (!isInitialized) return;

    const saveSounds = async () => {
      try {
        if (Platform.OS !== 'web') {
          await FileSystem.writeAsStringAsync(getDataFilePath(), JSON.stringify(sounds));
        } else {
          localStorage.setItem('sounds', JSON.stringify(sounds));
        }
      } catch (error) {
        console.error('Error saving sounds:', error);
      }
    };

    saveSounds();
  }, [sounds, isInitialized]);

  // Playback status updates - only on native platforms
  useEffect(() => {
    if (!soundObject || Platform.OS === 'web') return;

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
      // Web platform fallback
      if (Platform.OS === 'web') {
        console.log('Audio playback simulated in web preview');
        console.log('Playing:', sound.name);
        
        // Clear any existing interval
        if (webPlaybackInterval) {
          clearInterval(webPlaybackInterval);
        }
        
        setCurrentSound(sound);
        setIsPlaying(true);
        setPlaybackDuration(sound.duration);
        setPlaybackPosition(0);
        
        // Simulate playback progress
        const interval = setInterval(() => {
          setPlaybackPosition(prev => {
            const newPosition = prev + 0.5;
            if (newPosition >= sound.duration) {
              if (isLooping) {
                return 0;
              } else {
                setIsPlaying(false);
                clearInterval(interval);
                return 0;
              }
            }
            return newPosition;
          });
        }, 500);
        
        setWebPlaybackInterval(interval);
        return;
      }

      // Unload current sound if exists
      if (soundObject) {
        await soundObject.unloadAsync();
      }

      // For sample sound, show a message that it's a demo
      if (sound.isSample) {
        console.log('Playing sample sound - demo file');
      }

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        sound.isSample ? sound.uri : { uri: sound.uri },
        {
          shouldPlay: true,
          isLooping: isLooping,
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
      
      // Fallback for web or when audio fails
      if (Platform.OS === 'web') {
        setCurrentSound(sound);
        setIsPlaying(false);
        setPlaybackDuration(sound.duration);
        setPlaybackPosition(0);
      } else {
        throw error;
      }
    }
  };

  const playSound = async () => {
    if (Platform.OS === 'web') {
      if (currentSound && !isPlaying) {
        setIsPlaying(true);
        
        // Resume web playback simulation
        const interval = setInterval(() => {
          setPlaybackPosition(prev => {
            const newPosition = prev + 0.5;
            if (newPosition >= (currentSound?.duration || 0)) {
              if (isLooping) {
                return 0;
              } else {
                setIsPlaying(false);
                clearInterval(interval);
                return 0;
              }
            }
            return newPosition;
          });
        }, 500);
        
        setWebPlaybackInterval(interval);
      }
      return;
    }
    
    if (!soundObject) return;
    try {
      await soundObject.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    if (Platform.OS === 'web') {
      setIsPlaying(false);
      if (webPlaybackInterval) {
        clearInterval(webPlaybackInterval);
        setWebPlaybackInterval(null);
      }
      return;
    }
    
    if (!soundObject) return;
    try {
      await soundObject.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const stopSound = async () => {
    if (Platform.OS === 'web') {
      setIsPlaying(false);
      setPlaybackPosition(0);
      if (webPlaybackInterval) {
        clearInterval(webPlaybackInterval);
        setWebPlaybackInterval(null);
      }
      return;
    }
    
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
    if (Platform.OS === 'web') {
      setPlaybackPosition(position);
      return;
    }
    
    if (!soundObject) return;
    
    try {
      await soundObject.setPositionAsync(position * 1000);
      setPlaybackPosition(position);
    } catch (error) {
      console.error('Error seeking sound:', error);
    }
  };

  const toggleLooping = async () => {
    const newLoopingState = !isLooping;
    setIsLooping(newLoopingState);
    
    if (Platform.OS === 'web') {
      return;
    }
    
    if (!soundObject) return;
    
    try {
      await soundObject.setIsLoopingAsync(newLoopingState);
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

      // When user adds their first sound, remove sample sounds
      const currentUserSounds = sounds.filter(s => !s.isSample);
      if (currentUserSounds.length === 0) {
        // This is the first user sound, remove all sample sounds
        setSounds([sound]);
      } else {
        // Add to existing user sounds
        setSounds(prevSounds => [...prevSounds.filter(s => !s.isSample), sound]);
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
        if (webPlaybackInterval) {
          clearInterval(webPlaybackInterval);
          setWebPlaybackInterval(null);
        }
        if (soundObject && Platform.OS !== 'web') {
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

      const remainingSounds = sounds.filter(s => s.id !== id);
      const remainingUserSounds = remainingSounds.filter(s => !s.isSample);
      
      // If no user sounds remain, add back the sample sound
      if (remainingUserSounds.length === 0) {
        const sampleSound = createSampleSound();
        setSounds([sampleSound]);
      } else {
        setSounds(remainingSounds);
      }
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
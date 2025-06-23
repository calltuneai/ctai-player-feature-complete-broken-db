export interface Sound {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  uri: string;
  size: number; // in bytes
  dateAdded: string;
  category: string;
  favorite: boolean;
  tags: string[];
  isSample?: boolean; // Flag to identify sample sounds
}

export type SoundCategory = 'Distress' | 'Predator' | 'Prey' | 'Other';
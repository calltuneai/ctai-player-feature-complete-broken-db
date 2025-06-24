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
  // Database fields (when synced with server)
  user_id?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

export type SoundCategory = 'Distress' | 'Predator' | 'Prey' | 'Other';

// Database type for user_sounds table
export interface UserSound {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  duration: number;
  file_path: string;
  file_size: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          trial_start: string | null
          trial_end: string | null
          is_trial_expired: boolean | null
          is_verified: boolean | null
          last_verified_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          terms_ip_address: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          trial_start?: string | null
          trial_end?: string | null
          is_trial_expired?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          terms_ip_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          trial_start?: string | null
          trial_end?: string | null
          is_trial_expired?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          terms_ip_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          high_quality_enabled: boolean | null
          bluetooth_auto_connect: boolean | null
          keep_screen_on: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          high_quality_enabled?: boolean | null
          bluetooth_auto_connect?: boolean | null
          keep_screen_on?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          high_quality_enabled?: boolean | null
          bluetooth_auto_connect?: boolean | null
          keep_screen_on?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      app_config: {
        Row: {
          id: string
          must_update: boolean | null
          message: string | null
          min_version: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          must_update?: boolean | null
          message?: string | null
          min_version?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          must_update?: boolean | null
          message?: string | null
          min_version?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
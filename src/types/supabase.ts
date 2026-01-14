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
      archive: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          title: string
          completed_at: string | null
          metadata: Json | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          title: string
          completed_at?: string | null
          metadata?: Json | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          title?: string
          completed_at?: string | null
          metadata?: Json | null
          notes?: string | null
        }
      }
      system_events: {
        Row: {
          id: string
          type: string
          payload: Json
          severity: string | null
          source: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          payload: Json
          severity?: string | null
          source?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          payload?: Json
          severity?: string | null
          source?: string | null
          created_at?: string | null
        }
      }
      ai_gaps: {
        Row: {
          id: string
          user_id: string | null
          query: string
          context_tags: string[] | null
          resolved: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          context_tags?: string[] | null
          resolved?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          context_tags?: string[] | null
          resolved?: boolean | null
          created_at?: string | null
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          user_id: string | null
          role: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          role: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: string
          content?: string
          created_at?: string | null
        }
      }
    }
  }
}

// The Ledger: Historical habit completions
export type Archive = Database['public']['Tables']['archive']['Row'];
export type SystemEvents = Database['public']['Tables']['system_events']['Row'];
export type AIGaps = Database['public']['Tables']['ai_gaps']['Row'];
export type AIChatHistory = Database['public']['Tables']['ai_chat_history']['Row'];

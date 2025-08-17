export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          source: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'custom'
          content: string
          metadata: Json
          created_at: string
          updated_at: string
          tags: string[]
          category: string | null
          is_archived: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          source: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'custom'
          content: string
          metadata?: Json
          created_at?: string
          updated_at?: string
          tags?: string[]
          category?: string | null
          is_archived?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          source?: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'custom'
          content?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
          tags?: string[]
          category?: string | null
          is_archived?: boolean
        }
      }
      highlights: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          content: string
          category: 'code' | 'insight' | 'action_item' | 'resource' | 'question' | 'other'
          confidence_score: number
          tags: string[]
          notes: string | null
          position: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          content: string
          category: 'code' | 'insight' | 'action_item' | 'resource' | 'question' | 'other'
          confidence_score?: number
          tags?: string[]
          notes?: string | null
          position?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          content?: string
          category?: 'code' | 'insight' | 'action_item' | 'resource' | 'question' | 'other'
          confidence_score?: number
          tags?: string[]
          notes?: string | null
          position?: Json
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string
          layout: Json
          styling: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          layout: Json
          styling: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          layout?: Json
          styling?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exports: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          template_id: string | null
          format: 'pdf' | 'markdown' | 'notion' | 'obsidian' | 'anki'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          template_id?: string | null
          format: 'pdf' | 'markdown' | 'notion' | 'obsidian' | 'anki'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          template_id?: string | null
          format?: 'pdf' | 'markdown' | 'notion' | 'obsidian' | 'anki'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      conversation_relationships: {
        Row: {
          id: string
          source_conversation_id: string
          target_conversation_id: string
          relationship_type: 'related' | 'follows' | 'references' | 'similar'
          strength: number
          created_at: string
        }
        Insert: {
          id?: string
          source_conversation_id: string
          target_conversation_id: string
          relationship_type: 'related' | 'follows' | 'references' | 'similar'
          strength?: number
          created_at?: string
        }
        Update: {
          id?: string
          source_conversation_id?: string
          target_conversation_id?: string
          relationship_type?: 'related' | 'follows' | 'references' | 'similar'
          strength?: number
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

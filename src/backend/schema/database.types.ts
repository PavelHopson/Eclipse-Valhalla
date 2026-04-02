/**
 * Eclipse Valhalla — Supabase Database Types
 *
 * Generated-style type definitions matching the Supabase schema.
 * In production: replace with `supabase gen types typescript`.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          tier: 'free' | 'pro';
          locale: string;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      quests: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          category: string;
          repeat: string;
          due_at: string;
          completed_at: string | null;
          archived_at: string | null;
          subtasks: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quests']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quests']['Insert']>;
      };

      notes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          color: string;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          z_index: number;
          minimized: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notes']['Insert']>;
      };

      widget_configs: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string | null;
          type: string;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          locked: boolean;
          opacity: number;
          visible: boolean;
          priority: string;
          desktop_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['widget_configs']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['widget_configs']['Insert']>;
      };

      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string | null;
          started_at: string;
          ended_at: string | null;
          duration_sec: number;
          completed: boolean;
        };
        Insert: Database['public']['Tables']['focus_sessions']['Row'];
        Update: Partial<Database['public']['Tables']['focus_sessions']['Insert']>;
      };

      gamification_profiles: {
        Row: {
          user_id: string;
          xp: number;
          level: number;
          streak_days: number;
          discipline_score: number;
          total_completed: number;
          total_failed: number;
          focus_sessions: number;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['gamification_profiles']['Row'];
        Update: Partial<Database['public']['Tables']['gamification_profiles']['Insert']>;
      };

      notification_preferences: {
        Row: {
          user_id: string;
          in_app_enabled: boolean;
          push_enabled: boolean;
          email_enabled: boolean;
          sms_enabled: boolean;
          escalation_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['notification_preferences']['Row'];
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
      };

      app_settings: {
        Row: {
          user_id: string;
          accent_theme: string;
          reduced_motion: boolean;
          widget_transparency: number;
          atmosphere_level: number;
          compact_mode: boolean;
          glow_intensity: number;
          locale: string;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['app_settings']['Row'];
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
      };

      oracle_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oracle_sessions']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['oracle_sessions']['Insert']>;
      };

      oracle_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oracle_messages']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['oracle_messages']['Insert']>;
      };
    };
  };
}

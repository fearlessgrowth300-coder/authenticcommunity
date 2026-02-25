export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          category: string | null
          community_name: string
          community_type: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          longitude: number | null
          member_count: number | null
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          community_name: string
          community_type?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          member_count?: number | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          community_name?: string
          community_type?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          member_count?: number | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_type: string | null
          created_at: string
          id: string
          status: string | null
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          id?: string
          status?: string | null
          user_id_1: string
          user_id_2: string
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          id?: string
          status?: string | null
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rsvp_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rsvp_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rsvp_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number | null
          category: string | null
          community_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string | null
          event_image_url: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          max_attendees: number | null
          name: string
          organizer_id: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          attendee_count?: number | null
          category?: string | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_image_url?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          name: string
          organizer_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          attendee_count?: number | null
          category?: string | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_image_url?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          name?: string
          organizer_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_reason: string | null
          match_score: number | null
          status: string | null
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          status?: string | null
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          status?: string | null
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          notify_communities: boolean | null
          notify_digest: boolean | null
          notify_events: boolean | null
          notify_matches: boolean | null
          notify_messages: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_communities?: boolean | null
          notify_digest?: boolean | null
          notify_events?: boolean | null
          notify_matches?: boolean | null
          notify_messages?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_communities?: boolean | null
          notify_digest?: boolean | null
          notify_events?: boolean | null
          notify_matches?: boolean | null
          notify_messages?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allow_invitations: boolean | null
          allow_messages: boolean | null
          bio: string | null
          created_at: string
          first_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          longitude: number | null
          onboarding_completed: boolean | null
          profile_image_url: string | null
          show_in_search: boolean | null
          show_location: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          allow_invitations?: boolean | null
          allow_messages?: boolean | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          profile_image_url?: string | null
          show_in_search?: boolean | null
          show_location?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          allow_invitations?: boolean | null
          allow_messages?: boolean | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          profile_image_url?: string | null
          show_in_search?: boolean | null
          show_location?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string | null
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_category: string | null
          interest_name: string
          proficiency_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_category?: string | null
          interest_name: string
          proficiency_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_category?: string | null
          interest_name?: string
          proficiency_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_values: {
        Row: {
          created_at: string
          id: string
          importance_level: string | null
          user_id: string
          value_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          importance_level?: string | null
          user_id: string
          value_name: string
        }
        Update: {
          created_at?: string
          id?: string
          importance_level?: string | null
          user_id?: string
          value_name?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blooms: {
        Row: {
          category: Database["public"]["Enums"]["mission_category"]
          consent_to_share: boolean
          created_at: string
          id: string
          mission_id: string
          participant_names: string[]
          story: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["mission_category"]
          consent_to_share?: boolean
          created_at?: string
          id?: string
          mission_id: string
          participant_names?: string[]
          story: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["mission_category"]
          consent_to_share?: boolean
          created_at?: string
          id?: string
          mission_id?: string
          participant_names?: string[]
          story?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blooms_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      helper_availability: {
        Row: {
          active: boolean
          categories: Database["public"]["Enums"]["mission_category"][]
          created_at: string
          ends_at: string
          helper_id: string
          id: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          categories?: Database["public"]["Enums"]["mission_category"][]
          created_at?: string
          ends_at: string
          helper_id: string
          id?: string
          starts_at: string
        }
        Update: {
          active?: boolean
          categories?: Database["public"]["Enums"]["mission_category"][]
          created_at?: string
          ends_at?: string
          helper_id?: string
          id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helper_availability_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          metadata: Json
          mission_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json
          mission_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_system: boolean
          mission_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_system?: boolean
          mission_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_system?: boolean
          mission_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          accessibility_notes: string | null
          ai_model: string | null
          ai_rationale: string | null
          cancelled_at: string | null
          category: Database["public"]["Enums"]["mission_category"]
          completed_at: string | null
          created_at: string
          duration_minutes: number
          guide: Json
          helper_id: string | null
          id: string
          language: string
          location_label: string
          organiser_id: string | null
          original_request: string
          requester_id: string
          safety_level: Database["public"]["Enums"]["safety_level"]
          scheduled_at: string
          status: Database["public"]["Enums"]["mission_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          ai_model?: string | null
          ai_rationale?: string | null
          cancelled_at?: string | null
          category: Database["public"]["Enums"]["mission_category"]
          completed_at?: string | null
          created_at?: string
          duration_minutes: number
          guide?: Json
          helper_id?: string | null
          id?: string
          language?: string
          location_label: string
          organiser_id?: string | null
          original_request: string
          requester_id: string
          safety_level?: Database["public"]["Enums"]["safety_level"]
          scheduled_at: string
          status?: Database["public"]["Enums"]["mission_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          ai_model?: string | null
          ai_rationale?: string | null
          cancelled_at?: string | null
          category?: Database["public"]["Enums"]["mission_category"]
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          guide?: Json
          helper_id?: string | null
          id?: string
          language?: string
          location_label?: string
          organiser_id?: string | null
          original_request?: string
          requester_id?: string
          safety_level?: Database["public"]["Enums"]["safety_level"]
          scheduled_at?: string
          status?: Database["public"]["Enums"]["mission_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          mission_id: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          mission_id?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          mission_id?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accessibility_notes: string | null
          age_band: string | null
          avatar_url: string | null
          bio: string
          created_at: string
          full_name: string
          id: string
          neighbourhood: string
          onboarded_at: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["profile_role"]
          skills: string[]
          spoken_languages: string[]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accessibility_notes?: string | null
          age_band?: string | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name: string
          id: string
          neighbourhood?: string
          onboarded_at?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["profile_role"]
          skills?: string[]
          spoken_languages?: string[]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accessibility_notes?: string | null
          age_band?: string | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name?: string
          id?: string
          neighbourhood?: string
          onboarded_at?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["profile_role"]
          skills?: string[]
          spoken_languages?: string[]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_organiser: { Args: never; Returns: boolean }
    }
    Enums: {
      mission_category: "digital" | "wellbeing" | "repair" | "food" | "skills"
      mission_status:
        | "draft"
        | "open"
        | "matched"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "flagged"
      profile_role: "resident" | "helper" | "organiser"
      safety_level: "community" | "review"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mission_category: ["digital", "wellbeing", "repair", "food", "skills"],
      mission_status: [
        "draft",
        "open",
        "matched",
        "in_progress",
        "completed",
        "cancelled",
        "flagged",
      ],
      profile_role: ["resident", "helper", "organiser"],
      safety_level: ["community", "review"],
    },
  },
} as const

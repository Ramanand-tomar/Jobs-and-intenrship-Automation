export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      billing_history: {
        Row: {
          amount_paid: number
          billing_plan: string
          created_at: string | null
          currency: string
          id: string
          payment_status: string
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          billing_plan: string
          created_at?: string | null
          currency: string
          id?: string
          payment_status: string
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          billing_plan?: string
          created_at?: string | null
          currency?: string
          id?: string
          payment_status?: string
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_apply_usage: {
        Row: {
          apply_count: number | null
          apply_date: string | null
          id: string
          user_id: string
        }
        Insert: {
          apply_count?: number | null
          apply_date?: string | null
          id?: string
          user_id: string
        }
        Update: {
          apply_count?: number | null
          apply_date?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_apply_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          browserbase_session_id: string | null
          company: string
          created_at: string | null
          id: string
          is_saved: boolean | null
          location: string | null
          match_percentage: number | null
          platform: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          browserbase_session_id?: string | null
          company: string
          created_at?: string | null
          id?: string
          is_saved?: boolean | null
          location?: string | null
          match_percentage?: number | null
          platform?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          browserbase_session_id?: string | null
          company?: string
          created_at?: string | null
          id?: string
          is_saved?: boolean | null
          location?: string | null
          match_percentage?: number | null
          platform?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          awards: Json | null
          bio: string | null
          certifications: string[] | null
          completeness_percentage: number | null
          created_at: string | null
          education: Json | null
          email: string
          experience: Json | null
          full_name: string
          github_url: string | null
          id: string
          languages: Json | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          projects: Json | null
          publications: Json | null
          skills: string[] | null
          skills_categorized: Json | null
          summary: string | null
          title: string | null
          updated_at: string | null
          volunteer_experience: Json | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          awards?: Json | null
          bio?: string | null
          certifications?: string[] | null
          completeness_percentage?: number | null
          created_at?: string | null
          education?: Json | null
          email: string
          experience?: Json | null
          full_name: string
          github_url?: string | null
          id: string
          languages?: Json | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          projects?: Json | null
          publications?: Json | null
          skills?: string[] | null
          skills_categorized?: Json | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          volunteer_experience?: Json | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          awards?: Json | null
          bio?: string | null
          certifications?: string[] | null
          completeness_percentage?: number | null
          created_at?: string | null
          education?: Json | null
          email?: string
          experience?: Json | null
          full_name?: string
          github_url?: string | null
          id?: string
          languages?: Json | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          projects?: Json | null
          publications?: Json | null
          skills?: string[] | null
          skills_categorized?: Json | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          volunteer_experience?: Json | null
          website_url?: string | null
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

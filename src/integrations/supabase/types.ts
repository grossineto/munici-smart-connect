export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          value: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          value: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          value?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          assigned_to: string | null
          citizen_id: string
          created_at: string | null
          description: string | null
          id: string
          scheduled_date: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          citizen_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_date: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          citizen_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      citizens: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          phone: string
          preferred_language: string | null
          registration_step: string | null
          updated_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          phone: string
          preferred_language?: string | null
          registration_step?: string | null
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          phone?: string
          preferred_language?: string | null
          registration_step?: string | null
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_state: string | null
          created_at: string | null
          id: string
          is_from_citizen: boolean | null
          media_url: string | null
          message_type: string | null
          request_id: string | null
          sender_phone: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_state?: string | null
          created_at?: string | null
          id?: string
          is_from_citizen?: boolean | null
          media_url?: string | null
          message_type?: string | null
          request_id?: string | null
          sender_phone: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_state?: string | null
          created_at?: string | null
          id?: string
          is_from_citizen?: boolean | null
          media_url?: string | null
          message_type?: string | null
          request_id?: string | null
          sender_phone?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_keywords: {
        Row: {
          active: boolean | null
          alert_threshold: number | null
          category: string | null
          created_at: string
          id: string
          keyword: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          alert_threshold?: number | null
          category?: string | null
          created_at?: string
          id?: string
          keyword: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          alert_threshold?: number | null
          category?: string | null
          created_at?: string
          id?: string
          keyword?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          article_id: string | null
          created_at: string
          id: string
          message: string
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          article_id?: string | null
          created_at?: string
          id?: string
          message: string
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          article_id?: string | null
          created_at?: string
          id?: string
          message?: string
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_alerts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_analysis: {
        Row: {
          article_id: string | null
          created_at: string
          crisis_potential: boolean | null
          id: string
          impact_analysis: string | null
          keywords: string[] | null
          mentions_city: boolean | null
          mentions_mayor: boolean | null
          recommended_action: string | null
          relevance_score: number | null
          sentiment_score: number | null
          summary: string | null
          updated_at: string
          urgency_level: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          crisis_potential?: boolean | null
          id?: string
          impact_analysis?: string | null
          keywords?: string[] | null
          mentions_city?: boolean | null
          mentions_mayor?: boolean | null
          recommended_action?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          summary?: string | null
          updated_at?: string
          urgency_level?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          crisis_potential?: boolean | null
          id?: string
          impact_analysis?: string | null
          keywords?: string[] | null
          mentions_city?: boolean | null
          mentions_mayor?: boolean | null
          recommended_action?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          summary?: string | null
          updated_at?: string
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_analysis_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string | null
          source_id: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_crawled_at: string | null
          name: string
          region: string | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_crawled_at?: string | null
          name: string
          region?: string | null
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_crawled_at?: string | null
          name?: string
          region?: string | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_to: string | null
          citizen_id: string
          completed_at: string | null
          created_at: string | null
          description: string
          id: string
          location: string | null
          priority: Database["public"]["Enums"]["request_priority"] | null
          protocol_number: string
          status: Database["public"]["Enums"]["request_status"] | null
          title: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          citizen_id: string
          completed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["request_priority"] | null
          protocol_number: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          citizen_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["request_priority"] | null
          protocol_number?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          citizen_id: string | null
          created_at: string | null
          current_flow: string | null
          flow_data: Json | null
          id: string
          last_activity: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          citizen_id?: string | null
          created_at?: string | null
          current_flow?: string | null
          flow_data?: Json | null
          id?: string
          last_activity?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          citizen_id?: string | null
          created_at?: string | null
          current_flow?: string | null
          flow_data?: Json | null
          id?: string
          last_activity?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _user_id: string
          _title: string
          _message: string
          _type?: string
          _action_url?: string
          _metadata?: Json
        }
        Returns: string
      }
      generate_analytics_insights: {
        Args: Record<PropertyKey, never>
        Returns: {
          insight_type: string
          title: string
          description: string
          severity: string
          data: Json
        }[]
      }
      generate_protocol_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          _title: string
          _message: string
          _type?: string
          _action_url?: string
          _metadata?: Json
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "operator" | "viewer"
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
      request_type:
        | "manutencao"
        | "limpeza"
        | "iluminacao"
        | "transporte"
        | "saude"
        | "educacao"
        | "outros"
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
    Enums: {
      app_role: ["admin", "moderator", "operator", "viewer"],
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: ["pending", "in_progress", "completed", "cancelled"],
      request_type: [
        "manutencao",
        "limpeza",
        "iluminacao",
        "transporte",
        "saude",
        "educacao",
        "outros",
      ],
    },
  },
} as const

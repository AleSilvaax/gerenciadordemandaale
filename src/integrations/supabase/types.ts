export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_data: {
        Row: {
          address: string | null
          adjustment_description: string | null
          cable_gauge: string | null
          charger_circuit_breaker: string | null
          charger_status: string | null
          circuit_breaker_entry: string | null
          city: string | null
          client: string | null
          complies_with_nbr17019: boolean | null
          created_at: string
          executed_by: string | null
          homologated_installation: boolean | null
          homologated_name: string | null
          id: string
          installation_date: string | null
          model_number: string | null
          required_adjustment: boolean | null
          serial_number_new: string | null
          serial_number_old: string | null
          technical_comments: string | null
          updated_at: string
          valid_warranty: boolean | null
        }
        Insert: {
          address?: string | null
          adjustment_description?: string | null
          cable_gauge?: string | null
          charger_circuit_breaker?: string | null
          charger_status?: string | null
          circuit_breaker_entry?: string | null
          city?: string | null
          client?: string | null
          complies_with_nbr17019?: boolean | null
          created_at?: string
          executed_by?: string | null
          homologated_installation?: boolean | null
          homologated_name?: string | null
          id: string
          installation_date?: string | null
          model_number?: string | null
          required_adjustment?: boolean | null
          serial_number_new?: string | null
          serial_number_old?: string | null
          technical_comments?: string | null
          updated_at?: string
          valid_warranty?: boolean | null
        }
        Update: {
          address?: string | null
          adjustment_description?: string | null
          cable_gauge?: string | null
          charger_circuit_breaker?: string | null
          charger_status?: string | null
          circuit_breaker_entry?: string | null
          city?: string | null
          client?: string | null
          complies_with_nbr17019?: boolean | null
          created_at?: string
          executed_by?: string | null
          homologated_installation?: boolean | null
          homologated_name?: string | null
          id?: string
          installation_date?: string | null
          model_number?: string | null
          required_adjustment?: boolean | null
          serial_number_new?: string | null
          serial_number_old?: string | null
          technical_comments?: string | null
          updated_at?: string
          valid_warranty?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "report_data_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_messages: {
        Row: {
          id: string
          message: string
          sender_id: string
          sender_name: string
          sender_role: string
          service_id: string | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          message: string
          sender_id: string
          sender_name: string
          sender_role: string
          service_id?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
          service_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_messages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_technicians: {
        Row: {
          created_at: string
          id: string
          service_id: string
          technician_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          technician_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_technicians_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          id: string
          location: string
          number: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          number: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          number?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_service_messages_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_service_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          message: string
          sender_id: string
          sender_name: string
          sender_role: string
          service_id: string | null
          timestamp: string | null
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      has_permission: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      nextval_for_service: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

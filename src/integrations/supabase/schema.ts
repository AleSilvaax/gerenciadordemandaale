
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
      permission_roles: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "permission_roles_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "system_permissions"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          complies_with_nbr17019: boolean
          created_at: string
          executed_by: string | null
          homologated_installation: boolean
          homologated_name: string | null
          id: string
          installation_date: string | null
          model_number: string | null
          required_adjustment: boolean
          serial_number_new: string | null
          serial_number_old: string | null
          technical_comments: string | null
          updated_at: string
          valid_warranty: boolean
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
          complies_with_nbr17019?: boolean
          created_at?: string
          executed_by?: string | null
          homologated_installation?: boolean
          homologated_name?: string | null
          id: string
          installation_date?: string | null
          model_number?: string | null
          required_adjustment?: boolean
          serial_number_new?: string | null
          serial_number_old?: string | null
          technical_comments?: string | null
          updated_at?: string
          valid_warranty?: boolean
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
          complies_with_nbr17019?: boolean
          created_at?: string
          executed_by?: string | null
          homologated_installation?: boolean
          homologated_name?: string | null
          id?: string
          installation_date?: string | null
          model_number?: string | null
          required_adjustment?: boolean
          serial_number_new?: string | null
          serial_number_old?: string | null
          technical_comments?: string | null
          updated_at?: string
          valid_warranty?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "report_data_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
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
          }
        ]
      }
      services: {
        Row: {
          created_at: string
          id: string
          location: string
          number: string
          status: string
          technician_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          number: string
          status: string
          technician_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          number?: string
          status?: string
          technician_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      system_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          question: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          question: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          question?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "tecnico" | "administrador" | "gestor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

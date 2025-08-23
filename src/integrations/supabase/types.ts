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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      inventory: {
        Row: {
          available_stock: number | null
          created_at: string
          current_stock: number
          id: string
          last_movement_at: string | null
          material_id: string
          organization_id: string
          reserved_stock: number | null
          updated_at: string
        }
        Insert: {
          available_stock?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          last_movement_at?: string | null
          material_id: string
          organization_id?: string
          reserved_stock?: number | null
          updated_at?: string
        }
        Update: {
          available_stock?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          last_movement_at?: string | null
          material_id?: string
          organization_id?: string
          reserved_stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          created_by: string
          id: string
          material_id: string
          movement_type: string
          new_stock: number
          notes: string | null
          organization_id: string
          previous_stock: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string
          id?: string
          material_id: string
          movement_type: string
          new_stock: number
          notes?: string | null
          organization_id?: string
          previous_stock: number
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string
          id?: string
          material_id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          organization_id?: string
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          organization_id: string
          sku: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          organization_id?: string
          sku?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          organization_id?: string
          sku?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          service_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          service_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          service_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          id: string
          must_change_password: boolean | null
          name: string | null
          organization_id: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          id: string
          must_change_password?: boolean | null
          name?: string | null
          organization_id: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          must_change_password?: boolean | null
          name?: string | null
          organization_id?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
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
          service_id: string | null
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
          service_id?: string | null
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
          service_id?: string | null
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
          {
            foreignKeyName: "report_data_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_material_usage: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          material_id: string
          notes: string | null
          organization_id: string
          planned_quantity: number | null
          service_id: string
          updated_at: string
          used_quantity: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          material_id: string
          notes?: string | null
          organization_id?: string
          planned_quantity?: number | null
          service_id: string
          updated_at?: string
          used_quantity?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          material_id?: string
          notes?: string | null
          organization_id?: string
          planned_quantity?: number | null
          service_id?: string
          updated_at?: string
          used_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_material_usage_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_material_usage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
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
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          service_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          service_id?: string
          title?: string | null
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
      service_type_materials: {
        Row: {
          created_at: string
          default_quantity: number
          id: string
          is_required: boolean | null
          material_id: string
          organization_id: string
          service_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_quantity?: number
          id?: string
          is_required?: boolean | null
          material_id: string
          organization_id?: string
          service_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_quantity?: number
          id?: string
          is_required?: boolean | null
          material_id?: string
          organization_id?: string
          service_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_type_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_materials_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string
          default_priority: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_priority?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_priority?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          address: string | null
          city: string | null
          client: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          date: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          feedback: Json | null
          id: string
          location: string
          notes: string | null
          number: string
          organization_id: string
          photo_titles: string[] | null
          photos: string[] | null
          priority: string | null
          service_type: string | null
          service_type_id: string | null
          signatures: Json | null
          status: string
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          client?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feedback?: Json | null
          id?: string
          location: string
          notes?: string | null
          number: string
          organization_id: string
          photo_titles?: string[] | null
          photos?: string[] | null
          priority?: string | null
          service_type?: string | null
          service_type_id?: string | null
          signatures?: Json | null
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          client?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feedback?: Json | null
          id?: string
          location?: string
          notes?: string | null
          number?: string
          organization_id?: string
          photo_titles?: string[] | null
          photos?: string[] | null
          priority?: string | null
          service_type?: string | null
          service_type_id?: string | null
          signatures?: Json | null
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_fields: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          options: Json | null
          organization_id: string | null
          required: boolean
          service_type_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          options?: Json | null
          organization_id?: string | null
          required?: boolean
          service_type_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          options?: Json | null
          organization_id?: string | null
          required?: boolean
          service_type_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_fields_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_schedule: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          service_id: string | null
          start_time: string
          status: string
          technician_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          service_id?: string | null
          start_time: string
          status?: string
          technician_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          service_id?: string | null
          start_time?: string
          status?: string
          technician_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_schedule_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_schedule_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          team_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          team_id?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          team_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_first_organization: {
        Args: { admin_email: string; admin_name: string; org_name: string }
        Returns: string
      }
      create_inventory_movement: {
        Args: {
          p_cost_per_unit?: number
          p_material_id: string
          p_movement_type: string
          p_notes?: string
          p_quantity: number
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          notification_message: string
          target_service_id?: string
          target_user_id: string
        }
        Returns: undefined
      }
      create_service_messages_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_team: {
        Args: { creator_id: string; name: string }
        Returns: string
      }
      generate_random_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_effective_user_role: {
        Args: { check_org_id?: string }
        Returns: string
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
      get_user_complete_profile: {
        Args: { user_uuid: string }
        Returns: {
          avatar: string
          id: string
          name: string
          organization_id: string
          role: string
          team_id: string
          team_name: string
        }[]
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_role: {
        Args: { target_org_id: string; target_user_id: string }
        Returns: string
      }
      get_user_organization_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_safe: {
        Args: { target_user_id: string }
        Returns: string
      }
      has_permission: {
        Args: { required_role: string; user_id: string }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { check_user_id: string; org_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      is_technician_for_service: {
        Args: { service_uuid: string }
        Returns: boolean
      }
      join_team_by_code: {
        Args: { code: string; user_id: string }
        Returns: string
      }
      nextval_for_service: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      setup_initial_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      user_role:
        | "super_admin"
        | "owner"
        | "administrador"
        | "gestor"
        | "tecnico"
        | "requisitor"
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
      user_role: [
        "super_admin",
        "owner",
        "administrador",
        "gestor",
        "tecnico",
        "requisitor",
      ],
    },
  },
} as const

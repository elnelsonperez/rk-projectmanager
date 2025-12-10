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
      audit_logs: {
        Row: {
          action_type: string
          changed_fields: Json | null
          created_at: string
          id: number
          new_values: Json | null
          old_values: Json | null
          project_id: number
          record_id: number
          table_name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          changed_fields?: Json | null
          created_at?: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          project_id: number
          record_id: number
          table_name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          changed_fields?: Json | null
          created_at?: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          project_id?: number
          record_id?: number
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_number: string | null
          created_at: string | null
          email: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_items: {
        Row: {
          area: string | null
          category: string
          client_cost: number | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          id: number
          internal_cost: number | null
          item_name: string
          notes: string | null
          project_id: number | null
          quantity: number | null
          status: string | null
          supplier_id: number | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          category?: string
          client_cost?: number | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: number
          internal_cost?: number | null
          item_name: string
          notes?: string | null
          project_id?: number | null
          quantity?: number | null
          status?: string | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          category?: string
          client_cost?: number | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: number
          internal_cost?: number | null
          item_name?: string
          notes?: string | null
          project_id?: number | null
          quantity?: number | null
          status?: string | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: number | null
          created_at: string | null
          deleted_at: string | null
          estimated_completion: string | null
          id: number
          name: string
          notes: string | null
          report_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["estado_proyecto"]
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          estimated_completion?: string | null
          id?: number
          name: string
          notes?: string | null
          report_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["estado_proyecto"]
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          estimated_completion?: string | null
          id?: number
          name?: string
          notes?: string | null
          report_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["estado_proyecto"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string[] | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: number
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string[] | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string[] | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          client_facing_amount: number | null
          created_at: string | null
          date: string
          description: string | null
          id: number
          invoice_receipt_number: string | null
          payment_method: Database["public"]["Enums"]["metodo_pago"]
          project_id: number | null
          project_item_id: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          client_facing_amount?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: number
          invoice_receipt_number?: string | null
          payment_method?: Database["public"]["Enums"]["metodo_pago"]
          project_id?: number | null
          project_item_id?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          client_facing_amount?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: number
          invoice_receipt_number?: string | null
          payment_method?: Database["public"]["Enums"]["metodo_pago"]
          project_id?: number | null
          project_item_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_item_id_fkey"
            columns: ["project_item_id"]
            isOneToOne: false
            referencedRelation: "project_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_projects: {
        Args: { p_client_id?: number }
        Returns: {
          budget: number | null
          client_id: number | null
          created_at: string | null
          deleted_at: string | null
          estimated_completion: string | null
          id: number
          name: string
          notes: string | null
          report_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["estado_proyecto"]
          updated_at: string | null
        }[]
      }
      get_audit_logs: {
        Args: {
          p_project_id?: number
          p_start_date?: string
          p_end_date?: string
          p_page?: number
          p_page_size?: number
        }
        Returns: {
          id: number
          table_name: string
          record_id: number
          project_id: number
          project_name: string
          action_type: string
          changed_fields: Json
          old_values: Json
          new_values: Json
          user_id: string
          user_email: string
          created_at: string
          total_count: number
        }[]
      }
      get_project_report: {
        Args: { p_project_id: number }
        Returns: {
          category: string
          area: string
          item_name: string
          description: string
          estimated_cost: number
          actual_cost: number
          difference_percentage: number
          amount_paid: number
          pending_to_pay: number
          supplier_id: number
          supplier_name: string
          internal_amount_paid: number
        }[]
      }
      soft_delete_project: {
        Args: { project_id: number }
        Returns: undefined
      }
    }
    Enums: {
      estado_proyecto:
        | "Planificación"
        | "En Progreso"
        | "En Pausa"
        | "Completado"
      metodo_pago: "Efectivo" | "Transferencia" | "Tarjeta de Credito" | "Otros"
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
    Enums: {
      estado_proyecto: [
        "Planificación",
        "En Progreso",
        "En Pausa",
        "Completado",
      ],
      metodo_pago: ["Efectivo", "Transferencia", "Tarjeta de Credito", "Otros"],
    },
  },
} as const

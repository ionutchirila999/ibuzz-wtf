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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      enquiry_rate_limits: {
        Row: {
          created_at: string
          id: string
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          visitor_hash?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_title: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_title: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_title?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_contact: string
          buyer_name: string
          created_at: string
          customer_note: string | null
          id: string
          order_number: string
          payment_status: string
          status: string
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_contact: string
          buyer_name: string
          created_at?: string
          customer_note?: string | null
          id?: string
          order_number?: string
          payment_status?: string
          status?: string
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_contact?: string
          buyer_name?: string
          created_at?: string
          customer_note?: string | null
          id?: string
          order_number?: string
          payment_status?: string
          status?: string
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          fault_notes: string | null
          other_expenses: number
          platform_fees: number
          product_id: string
          purchase_cost: number
          repair_cost: number
          shipping_cost: number
          updated_at: string
        }
        Insert: {
          fault_notes?: string | null
          other_expenses?: number
          platform_fees?: number
          product_id: string
          purchase_cost?: number
          repair_cost?: number
          shipping_cost?: number
          updated_at?: string
        }
        Update: {
          fault_notes?: string | null
          other_expenses?: number
          platform_fees?: number
          product_id?: string
          purchase_cost?: number
          repair_cost?: number
          shipping_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: string
          authenticity_notes: string | null
          authenticity_verified: boolean
          brand: string | null
          category: string
          color: string | null
          condition: string
          created_at: string
          delivery_options: string | null
          description: string | null
          description_ro: string | null
          description_th: string | null
          id: string
          images: string[]
          is_demo: boolean
          market_category: string
          market_condition: string
          material: string | null
          model: string | null
          negotiable: boolean
          price: number
          return_policy: string | null
          share_image: string | null
          shoe_size: string | null
          size_system: string | null
          status: string
          stock: number
          subcategory: string
          title: string
          title_ro: string | null
          title_th: string | null
          translation_status_ro: string
          translation_status_th: string
          updated_at: string
        }
        Insert: {
          audience?: string
          authenticity_notes?: string | null
          authenticity_verified?: boolean
          brand?: string | null
          category: string
          color?: string | null
          condition?: string
          created_at?: string
          delivery_options?: string | null
          description?: string | null
          description_ro?: string | null
          description_th?: string | null
          id?: string
          images?: string[]
          is_demo?: boolean
          market_category?: string
          market_condition?: string
          material?: string | null
          model?: string | null
          negotiable?: boolean
          price?: number
          return_policy?: string | null
          share_image?: string | null
          shoe_size?: string | null
          size_system?: string | null
          status?: string
          stock?: number
          subcategory: string
          title: string
          title_ro?: string | null
          title_th?: string | null
          translation_status_ro?: string
          translation_status_th?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          authenticity_notes?: string | null
          authenticity_verified?: boolean
          brand?: string | null
          category?: string
          color?: string | null
          condition?: string
          created_at?: string
          delivery_options?: string | null
          description?: string | null
          description_ro?: string | null
          description_th?: string | null
          id?: string
          images?: string[]
          is_demo?: boolean
          market_category?: string
          market_condition?: string
          material?: string | null
          model?: string | null
          negotiable?: boolean
          price?: number
          return_policy?: string | null
          share_image?: string | null
          shoe_size?: string | null
          size_system?: string | null
          status?: string
          stock?: number
          subcategory?: string
          title?: string
          title_ro?: string | null
          title_th?: string | null
          translation_status_ro?: string
          translation_status_th?: string
          updated_at?: string
        }
        Relationships: []
      }
      resale_offers: {
        Row: {
          asking_price: number | null
          brand: string | null
          category: string
          condition_notes: string | null
          contact: string
          created_at: string
          device_condition: string | null
          device_type: string | null
          id: string
          item_description: string
          model: string | null
          name: string
          photos: string[]
          status: string
        }
        Insert: {
          asking_price?: number | null
          brand?: string | null
          category: string
          condition_notes?: string | null
          contact: string
          created_at?: string
          device_condition?: string | null
          device_type?: string | null
          id?: string
          item_description: string
          model?: string | null
          name: string
          photos?: string[]
          status?: string
        }
        Update: {
          asking_price?: number | null
          brand?: string | null
          category?: string
          condition_notes?: string | null
          contact?: string
          created_at?: string
          device_condition?: string | null
          device_type?: string | null
          id?: string
          item_description?: string
          model?: string | null
          name?: string
          photos?: string[]
          status?: string
        }
        Relationships: []
      }
      service_enquiries: {
        Row: {
          contact: string
          created_at: string
          description: string
          id: string
          kind: string
          name: string
          photos: string[]
          service: string
          status: string
        }
        Insert: {
          contact: string
          created_at?: string
          description: string
          id?: string
          kind: string
          name: string
          photos?: string[]
          service: string
          status?: string
        }
        Update: {
          contact?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name?: string
          photos?: string[]
          service?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_customer_order: {
        Args: { p_buyer_contact: string; p_buyer_name: string; p_items: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owner_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_table: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_table: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_table?: string
          id?: string
        }
        Relationships: []
      }
      customer_carts: {
        Row: {
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_notifications: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          order_id: string | null
          read_at: string | null
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          order_id?: string | null
          read_at?: string | null
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          read_at?: string | null
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          delivery_addresses: Json
          full_name: string
          phone: string
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          delivery_addresses?: Json
          full_name?: string
          phone?: string
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          delivery_addresses?: Json
          full_name?: string
          phone?: string
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_order_amount: number
          redemption_count: number
          starts_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order_amount?: number
          redemption_count?: number
          starts_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order_amount?: number
          redemption_count?: number
          starts_at?: string
        }
        Relationships: []
      }
      discount_redemptions: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          discount_code_id: string
          id: string
          order_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount: number
          discount_code_id: string
          id?: string
          order_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          discount_code_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
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
      expense_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          occurred_on: string
          order_id: string | null
          product_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          occurred_on?: string
          order_id?: string | null
          product_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          occurred_on?: string
          order_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          product_id: string
          quantity_delta: number
          reason: string
          stock_after: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          product_id: string
          quantity_delta: number
          reason?: string
          stock_after: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string
          quantity_delta?: number
          reason?: string
          stock_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          created_at: string
          points_balance: number
          referral_code: string
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          points_balance?: number
          referral_code: string
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          points_balance?: number
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          points_delta: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          points_delta: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          points_delta?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_referrals: {
        Row: {
          created_at: string
          qualifying_order_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          created_at?: string
          qualifying_order_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          created_at?: string
          qualifying_order_id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_referrals_qualifying_order_id_fkey"
            columns: ["qualifying_order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      order_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          order_id: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          payment_status: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          payment_status: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          payment_status?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_support_messages: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          request_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          request_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_support_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "order_support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      order_support_requests: {
        Row: {
          admin_reply: string | null
          assigned_to: string | null
          created_at: string
          id: string
          internal_notes: string | null
          message: string
          order_id: string
          replied_at: string | null
          request_type: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          message: string
          order_id: string
          replied_at?: string | null
          request_type: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          message?: string
          order_id?: string
          replied_at?: string | null
          request_type?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_support_requests_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          discount_amount: number
          discount_code: string | null
          id: string
          order_number: string
          payment_status: string
          shipping_address: string | null
          status: string
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          buyer_contact: string
          buyer_name: string
          created_at?: string
          customer_note?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          order_number?: string
          payment_status?: string
          shipping_address?: string | null
          status?: string
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          buyer_contact?: string
          buyer_name?: string
          created_at?: string
          customer_note?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          order_number?: string
          payment_status?: string
          shipping_address?: string | null
          status?: string
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
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
          is_featured: boolean
          low_stock_threshold: number
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
          sold_out_label_en: string
          sold_out_label_ro: string
          sold_out_label_th: string
          status: string
          stock: number
          subcategory: string
          title: string
          title_ro: string | null
          title_th: string | null
          translation_status_ro: string
          translation_status_th: string
          updated_at: string
          video_url: string | null
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
          is_featured?: boolean
          low_stock_threshold?: number
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
          sold_out_label_en?: string
          sold_out_label_ro?: string
          sold_out_label_th?: string
          status?: string
          stock?: number
          subcategory: string
          title: string
          title_ro?: string | null
          title_th?: string | null
          translation_status_ro?: string
          translation_status_th?: string
          updated_at?: string
          video_url?: string | null
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
          is_featured?: boolean
          low_stock_threshold?: number
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
          sold_out_label_en?: string
          sold_out_label_ro?: string
          sold_out_label_th?: string
          status?: string
          stock?: number
          subcategory?: string
          title?: string
          title_ro?: string | null
          title_th?: string | null
          translation_status_ro?: string
          translation_status_th?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      repair_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          customer_contact: string
          customer_name: string
          device: string
          diagnosis: string | null
          enquiry_id: string | null
          final_price: number
          id: string
          internal_notes: string | null
          issue_description: string
          job_number: string
          labour_cost: number
          parts_cost: number
          quoted_price: number
          status: string
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_contact: string
          customer_name: string
          device: string
          diagnosis?: string | null
          enquiry_id?: string | null
          final_price?: number
          id?: string
          internal_notes?: string | null
          issue_description: string
          job_number?: string
          labour_cost?: number
          parts_cost?: number
          quoted_price?: number
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_contact?: string
          customer_name?: string
          device?: string
          diagnosis?: string | null
          enquiry_id?: string | null
          final_price?: number
          id?: string
          internal_notes?: string | null
          issue_description?: string
          job_number?: string
          labour_cost?: number
          parts_cost?: number
          quoted_price?: number
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_jobs_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "service_enquiries"
            referencedColumns: ["id"]
          },
        ]
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
      site_banners: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          assigned_to: string | null
          created_at: string
          customer_email: string | null
          id: string
          internal_notes: string | null
          message: string
          order_id: string | null
          priority: string
          replied_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          id?: string
          internal_notes?: string | null
          message: string
          order_id?: string | null
          priority?: string
          replied_at?: string | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string
          order_id?: string | null
          priority?: string
          replied_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_customer_order:
        | {
            Args: {
              p_buyer_contact: string
              p_buyer_name: string
              p_items: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_buyer_contact: string
              p_buyer_name: string
              p_items: Json
              p_shipping_address: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_buyer_contact: string
              p_buyer_name: string
              p_discount_code: string
              p_items: Json
              p_shipping_address: string
            }
            Returns: Json
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ibuzz_add_order_support_message: {
        Args: {
          p_is_internal?: boolean
          p_message: string
          p_request_id: string
        }
        Returns: string
      }
      ibuzz_add_support_message: {
        Args: {
          p_is_internal?: boolean
          p_message: string
          p_ticket_id: string
        }
        Returns: string
      }
      ibuzz_adjust_inventory: {
        Args: {
          p_new_stock: number
          p_note?: string
          p_product_id: string
          p_reason: string
        }
        Returns: string
      }
      ibuzz_apply_referral_code: { Args: { p_code: string }; Returns: boolean }
      ibuzz_get_my_loyalty_account: {
        Args: never
        Returns: {
          points_balance: number
          referral_code: string
        }[]
      }
      ibuzz_redeem_loyalty_points: {
        Args: { p_points: number }
        Returns: string
      }
      owner_exists: { Args: never; Returns: boolean }
      record_order_refund: {
        Args: { p_amount: number; p_order_id: string; p_reason: string }
        Returns: string
      }
      validate_discount_code: {
        Args: { p_code: string; p_subtotal: number }
        Returns: Json
      }
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

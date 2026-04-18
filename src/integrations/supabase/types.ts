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
      admin_commissions: {
        Row: {
          base_amount: number
          commission_amount: number
          commission_percent: number
          created_at: string
          id: string
          merchant_id: string | null
          order_id: string
          order_item_id: string | null
          product_id: string | null
          promotion_id: string | null
          status: string
        }
        Insert: {
          base_amount: number
          commission_amount: number
          commission_percent: number
          created_at?: string
          id?: string
          merchant_id?: string | null
          order_id: string
          order_item_id?: string | null
          product_id?: string | null
          promotion_id?: string | null
          status?: string
        }
        Update: {
          base_amount?: number
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          merchant_id?: string | null
          order_id?: string
          order_item_id?: string | null
          product_id?: string | null
          promotion_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_commissions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "site_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_rate_limits: {
        Row: {
          attempt_type: string
          attempted_at: string
          id: string
          identifier: string
          success: boolean | null
        }
        Insert: {
          attempt_type: string
          attempted_at?: string
          id?: string
          identifier: string
          success?: boolean | null
        }
        Update: {
          attempt_type?: string
          attempted_at?: string
          id?: string
          identifier?: string
          success?: boolean | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
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
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_applications: {
        Row: {
          admin_notes: string | null
          business_description: string
          business_proof_path: string | null
          business_type: string
          city: string
          cnic_image_path: string | null
          cnic_number: string
          created_at: string
          id: string
          phone: string
          pitch: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          store_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_description: string
          business_proof_path?: string | null
          business_type: string
          city: string
          cnic_image_path?: string | null
          cnic_number: string
          created_at?: string
          id?: string
          phone: string
          pitch: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          store_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_description?: string
          business_proof_path?: string | null
          business_type?: string
          city?: string
          cnic_image_path?: string | null
          cnic_number?: string
          created_at?: string
          id?: string
          phone?: string
          pitch?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          store_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          merchant_id: string
          order_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          merchant_id: string
          order_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          merchant_id?: string
          order_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_orders: boolean
          email_promotions: boolean
          id: string
          push_orders: boolean
          push_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_orders?: boolean
          email_promotions?: boolean
          id?: string
          push_orders?: boolean
          push_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_orders?: boolean
          email_promotions?: boolean
          id?: string
          push_orders?: boolean
          push_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
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
          created_at: string
          id: string
          notes: string | null
          order_number: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          merchant_id: string | null
          name: string
          original_price: number | null
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant_id?: string | null
          name: string
          original_price?: number | null
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant_id?: string | null
          name?: string
          original_price?: number | null
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number | null
          exit_intent_timer_minutes: number
          expires_at: string
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          max_uses: number | null
          merchant_id: string | null
          product_id: string | null
          scope: string
          show_on_exit_intent: boolean
          starts_at: string
          status: Database["public"]["Enums"]["promo_status"]
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number | null
          exit_intent_timer_minutes?: number
          expires_at: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          merchant_id?: string | null
          product_id?: string | null
          scope?: string
          show_on_exit_intent?: boolean
          starts_at?: string
          status?: Database["public"]["Enums"]["promo_status"]
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number | null
          exit_intent_timer_minutes?: number
          expires_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          merchant_id?: string | null
          product_id?: string | null
          scope?: string
          show_on_exit_intent?: boolean
          starts_at?: string
          status?: Database["public"]["Enums"]["promo_status"]
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_fees: {
        Row: {
          city: string
          created_at: string
          fee: number
          id: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          fee?: number
          id?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          fee?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_promotions: {
        Row: {
          admin_notes: string | null
          commission_percent: number
          created_at: string
          created_by: string
          cta_label: string | null
          cta_url: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          merchant_id: string | null
          message: string
          product_id: string | null
          promo_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          commission_percent?: number
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_url?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          merchant_id?: string | null
          message: string
          product_id?: string | null
          promo_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: string
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          commission_percent?: number
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_url?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          merchant_id?: string | null
          message?: string
          product_id?: string | null
          promo_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      check_rate_limit: {
        Args: {
          _attempt_type: string
          _identifier: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_merchant_orders: { Args: never; Returns: Json[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "merchant" | "admin"
      application_status: "pending" | "approved" | "declined"
      order_status:
        | "placed"
        | "confirmed"
        | "dispatched"
        | "shipped"
        | "delivered"
        | "cancelled"
      promo_status: "pending" | "approved" | "rejected"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["user", "merchant", "admin"],
      application_status: ["pending", "approved", "declined"],
      order_status: [
        "placed",
        "confirmed",
        "dispatched",
        "shipped",
        "delivered",
        "cancelled",
      ],
      promo_status: ["pending", "approved", "rejected"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const

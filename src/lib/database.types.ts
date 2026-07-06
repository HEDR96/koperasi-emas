export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          nik: string | null;
          phone: string | null;
          role: "master" | "admin" | "member";
          is_member: boolean;
          referral_code: string | null;
          referred_by: string | null;
          gold_grams: number;
          rupiah_balance: number;
          status: "active" | "suspended" | "pending" | "rejected";
          status_changed_by: string | null;
          status_changed_at: string | null;
          status_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at" | "status_changed_by" | "status_changed_at" | "status_reason" | "is_member"> & {
          is_member?: boolean;
          created_at?: string;
          updated_at?: string;
          status_changed_by?: string | null;
          status_changed_at?: string | null;
          status_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      gold_prices: {
        Row: {
          id: number;
          buy_member: number;
          buy_non_member: number;
          buyback_member: number;
          buyback_non_member: number;
          change_amount: number;
          change_percent: number;
          trend: "up" | "down" | "stable";
          updated_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["gold_prices"]["Row"], "id" | "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gold_prices"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "buy" | "buyback" | "cicilan" | "Simpanan" | "transfer" | "referral_bonus";
          gram: number | null;
          amount: number;
          price_per_gram: number | null;
          status: "pending" | "processing" | "completed" | "rejected";
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      installments: {
        Row: {
          id: string;
          user_id: string;
          product_name: string;
          total_gram: number;
          total_amount: number;
          monthly_amount: number;
          tenor: number;
          down_payment: number;
          paid_installments: number;
          status: "active" | "completed" | "overdue";
          next_due_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["installments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["installments"]["Insert"]>;
      };
      savings: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_gram: number;
          current_gram: number;
          monthly_amount: number;
          status: "active" | "completed" | "paused";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["savings"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["savings"]["Insert"]>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          bonus_amount: number;
          status: "pending" | "paid";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          transaction_id: string;
          user_id: string;
          amount: number;
          payment_method: string | null;
          proof_url: string | null;
          status: "pending" | "verified" | "rejected";
          notes: string | null;
          verified_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      promos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          discount_percent: number;
          start_date: string | null;
          end_date: string | null;
          gram_weight: number | null;
          price: number | null;
          expired_at: string | null;
          stok: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["promos"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promos"]["Insert"]>;
      };
      product_orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_name: string;
          customer_phone: string | null;
          items: Array<{ product_id: string; title: string; gram_weight: number | null; price: number; quantity: number; image_url: string | null }>;
          total_amount: number;
          status: "pending" | "approved" | "rejected" | "cancelled";
          notes: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_orders"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_orders"]["Insert"]>;
      };
      product_payments: {
        Row: {
          id: string;
          order_id: string;
          customer_name: string | null;
          nominal: number;
          terbayar: number;
          payment_method: string;
          proof_url: string | null;
          notes: string | null;
          verified_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_payments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_payments"]["Insert"]>;
      };
      news: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          category: string | null;
          image_url: string | null;
          author_id: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["news"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
      };
      branches: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          address: string | null;
          phone: string | null;
          manager: string | null;
          status: "active" | "inactive";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type Profile      = Database["public"]["Tables"]["profiles"]["Row"];
export type GoldPriceRow = Database["public"]["Tables"]["gold_prices"]["Row"];
export type Transaction  = Database["public"]["Tables"]["transactions"]["Row"];
export type Installment  = Database["public"]["Tables"]["installments"]["Row"];
export type Saving       = Database["public"]["Tables"]["savings"]["Row"];
export type Referral     = Database["public"]["Tables"]["referrals"]["Row"];
export type Payment      = Database["public"]["Tables"]["payments"]["Row"];
export type Promo        = Database["public"]["Tables"]["promos"]["Row"];
export type NewsArticle  = Database["public"]["Tables"]["news"]["Row"];
export type Branch       = Database["public"]["Tables"]["branches"]["Row"];


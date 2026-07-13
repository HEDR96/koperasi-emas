"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";

export type UserRole = "master" | "admin" | "member";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  referralCode: string | null;
  balance: { gold: number; rupiah: number };
  status: string;
  phone?: string;
  nik?: string;
  productQuota: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncUser: () => Promise<void>;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nik: string;
  referral?: string;
}

function profileToUser(profile: Profile, email: string): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email,
    role: profile.role as UserRole,
    referralCode: profile.referral_code,
    balance: { gold: Number(profile.gold_grams), rupiah: Number(profile.rupiah_balance) },
    status: profile.status,
    phone: profile.phone ?? undefined,
    nik: profile.nik ?? undefined,
    productQuota: Number((profile as any).product_quota ?? 3),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.user) {
            set({ isLoading: false, error: error?.message || "Login gagal. Periksa email & password." });
            return false;
          }
          const { data: profile, error: pErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (pErr || !profile) {
            set({ isLoading: false, error: "Profil tidak ditemukan" });
            return false;
          }
          set({ user: profileToUser(profile, email), isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch {
          set({ isLoading: false, error: "Terjadi kesalahan jaringan" });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                name: data.name,
                phone: data.phone,
                nik: data.nik,
                role: "member",
                referred_by: data.referral || null,
              },
            },
          });

          if (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
          if (!authData.user) {
            set({ isLoading: false });
            return { success: false, error: "Gagal membuat akun" };
          }

          // Handle referral bonus
          if (data.referral && authData.user) {
            const { data: referrer } = await supabase
              .from("profiles")
              .select("id")
              .eq("referral_code", data.referral)
              .single() as { data: { id: string } | null; error: unknown };
            if (referrer) {
              await (supabase.from("referrals") as any).insert({
                referrer_id: referrer.id,
                referred_id: authData.user.id,
                bonus_amount: 50000,
                status: "pending",
              });
            }
          }

          set({ isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false, error: "Terjadi kesalahan" });
          return { success: false, error: "Terjadi kesalahan" };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, error: null });
      },

      syncUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          set({ user: profileToUser(profile, session.user.email ?? ""), isAuthenticated: true });
        }
      },
    }),
    {
      name: "ked-auth",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { GoldPrice } from "@/types";
import type { GoldPriceRow } from "@/lib/database.types";
import { MOCK_GOLD_PRICES } from "@/lib/constants";
import { isDemoMode } from "@/lib/demo";

interface GoldState {
  prices: GoldPrice;
  isLoading: boolean;
  lastFetch: string | null;
  setPrices: (prices: GoldPrice) => void;
  fetchPrices: () => Promise<void>;
}

export const useGoldStore = create<GoldState>((set) => ({
  prices: MOCK_GOLD_PRICES,
  isLoading: false,
  lastFetch: null,

  setPrices: (prices) => set({ prices }),

  fetchPrices: async () => {
    set({ isLoading: true });
    if (isDemoMode()) {
      set({ isLoading: false, lastFetch: new Date().toISOString(), prices: MOCK_GOLD_PRICES });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("gold_prices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single() as { data: GoldPriceRow | null; error: unknown };

      if (error || !data) throw new Error("No price data");

      set({
        isLoading: false,
        lastFetch: new Date().toISOString(),
        prices: {
          buyMember:        data.buy_member,
          buyNonMember:     data.buy_non_member,
          buybackMember:    data.buyback_member,
          buybackNonMember: data.buyback_non_member,
          change:           data.change_amount,
          changePercent:    Number(data.change_percent),
          trend:            data.trend as "up" | "down",
          lastUpdate:       data.created_at,
        },
      });
    } catch {
      // Fallback to constants if DB unreachable
      set({ isLoading: false, lastFetch: new Date().toISOString() });
    }
  },
}));

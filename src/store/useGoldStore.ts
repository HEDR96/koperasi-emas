"use client";

import { create } from "zustand";
import type { GoldPrice } from "@/types";
import { MOCK_GOLD_PRICES } from "@/lib/constants";

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
    await new Promise((r) => setTimeout(r, 800));
    // Small deterministic fluctuation based on current second to simulate live feed
    const second = new Date().getSeconds();
    const fluctuation = ((second % 10) - 5) * 400; // range -2000 to +2000
    set((state) => ({
      isLoading: false,
      lastFetch: new Date().toISOString(),
      prices: {
        ...state.prices,
        buyMember: state.prices.buyMember + fluctuation,
        buyNonMember: state.prices.buyNonMember + fluctuation,
        buybackMember: state.prices.buybackMember + fluctuation,
        buybackNonMember: state.prices.buybackNonMember + fluctuation,
        change: fluctuation,
        changePercent: +(fluctuation / state.prices.buyMember * 100).toFixed(2),
        trend: fluctuation > 0 ? "up" : fluctuation < 0 ? "down" : "stable",
        lastUpdate: new Date().toISOString(),
      },
    }));
  },
}));

export type UserRole = "master" | "admin" | "member";
export type TransactionType = "buy" | "sell" | "buyback" | "cicilan" | "Simpanan" | "transfer";
export type TransactionStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";
export type GoldTrend = "up" | "down" | "stable";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  referralCode: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  balance: {
    gold: number;
    rupiah: number;
    savings: number;
  };
}

export interface GoldPrice {
  buyMember: number;
  buyNonMember: number;
  buybackMember: number;
  buybackNonMember: number;
  lastUpdate: string;
  change: number;
  changePercent: number;
  trend: GoldTrend;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  goldGrams: number;
  pricePerGram: number;
  totalAmount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CicilanPlan {
  id: string;
  userId: string;
  goldGrams: number;
  pricePerGram: number;
  totalAmount: number;
  dp: number;
  tenor: number;
  monthlyPayment: number;
  paidInstallments: number;
  status: "active" | "completed" | "late" | "cancelled";
  nextPaymentDate: string;
  createdAt: string;
}

export interface SimpananAccount {
  id: string;
  userId: string;
  goldGrams: number;
  totalDeposited: number;
  currentValue: number;
  roi: number;
  monthlyTarget?: number;
  createdAt: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  discount?: number;
  bonusGold?: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  isActive: boolean;
  type: "cashback" | "bonus" | "referral" | "event";
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
  location?: string;
  category: "seminar" | "gathering" | "shu" | "edukasi" | "lainnya";
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  comment: string;
  goldSaved?: string;
  joinedYear?: number;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalTransactions: number;
  totalGoldSold: number;
  totalRevenue: number;
  pendingApprovals: number;
  monthlyGrowth: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "transaction" | "promo" | "system" | "reminder";
  isRead: boolean;
  createdAt: string;
}


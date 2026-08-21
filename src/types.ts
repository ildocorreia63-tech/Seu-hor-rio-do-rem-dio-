export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro_monthly' | 'pro_yearly' | 'family';
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  maxMeds: number;
  maxMembers: number;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  relation?: string;
  isDefault?: boolean;
}

export interface Medicine {
  id: string;
  userId: string;
  memberId: string;
  name: string;
  dosage: string;
  quantity: number; // Stock count
  unit?: string; // e.g. 'comprimidos', 'gotas', 'ml'
  frequencyType: 'daily' | 'interval' | 'week';
  intervalHours?: number;
  intervalStartTime?: string;
  weekDays?: number[]; // [0,1,2,3,4,5,6] (0=Sunday)
  times: string[]; // ['08:00', '20:00']
  startDate: string;
  durationDays: number; // 0 = continuous
  notes?: string;
  photoUrl?: string;
  doctorName?: string;
  doctorCrm?: string;
  prescriptionDate?: string;
  prescriptionPhotoUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface DoseRecord {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName?: string;
  memberEmoji?: string;
  scheduledTime: string; // "HH:mm"
  scheduledDate: string; // "YYYY-MM-DD"
  status: 'taken' | 'snoozed' | 'skipped' | 'pending';
  takenAt?: string;
  snoozedUntil?: string;
  notes?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  soundType: 'soft' | 'standard' | 'loud' | 'harp' | 'siren';
  vibrateEnabled: boolean;
  voiceEnabled: boolean;
  snoozeMinutes: number;
  snoozeSound: 'none' | 'soft' | 'hard';
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
}

export interface PlanConfig {
  id: 'free' | 'pro_monthly' | 'pro_yearly' | 'family';
  name: string;
  priceFormatted: string;
  interval: 'grátis' | 'mês' | 'ano';
  priceInCents: number;
  stripePriceId?: string;
  features: string[];
  maxMeds: number;
  maxMembers: number;
  badge?: string;
}

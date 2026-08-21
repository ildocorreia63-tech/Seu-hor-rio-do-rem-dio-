import { User, FamilyMember, Medicine, DoseRecord, AppSettings, PlanConfig } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'shdr_auth_token';
const SETTINGS_KEY = 'shdr_settings';

export const defaultSettings: AppSettings = {
  soundEnabled: true,
  soundType: 'standard',
  vibrateEnabled: true,
  voiceEnabled: true,
  snoozeMinutes: 10,
  snoozeSound: 'soft',
  theme: 'light',
  notificationsEnabled: false,
};

class ApiService {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(name: string, email: string, password: string, plan: string = 'free'): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, plan }),
    });
    this.setToken(data.token);
    return data;
  }

  async demoLogin(demoUserId: string = 'user-demo-1'): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ demoUserId }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/me');
    return data.user;
  }

  async updateProfile(name: string, email: string): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });
    return data.user;
  }

  logout() {
    this.setToken(null);
  }

  // --- MEMBERS ---
  async getMembers(): Promise<FamilyMember[]> {
    const data = await this.request<{ members: FamilyMember[] }>('/members');
    return data.members;
  }

  async createMember(member: Partial<FamilyMember>): Promise<FamilyMember> {
    const data = await this.request<{ member: FamilyMember }>('/members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
    return data.member;
  }

  async updateMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const data = await this.request<{ member: FamilyMember }>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.member;
  }

  async deleteMember(id: string): Promise<void> {
    await this.request(`/members/${id}`, { method: 'DELETE' });
  }

  // --- MEDICINES ---
  async getMedicines(memberId?: string): Promise<Medicine[]> {
    const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
    const data = await this.request<{ medicines: Medicine[] }>(`/medicines${query}`);
    return data.medicines;
  }

  async createMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
    const data = await this.request<{ medicine: Medicine }>('/medicines', {
      method: 'POST',
      body: JSON.stringify(medicine),
    });
    return data.medicine;
  }

  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    const data = await this.request<{ medicine: Medicine }>(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.medicine;
  }

  async deleteMedicine(id: string): Promise<void> {
    await this.request(`/medicines/${id}`, { method: 'DELETE' });
  }

  async takeDose(id: string, scheduledTime?: string, scheduledDate?: string, notes?: string): Promise<{ record: DoseRecord; remainingStock: number }> {
    return this.request<{ record: DoseRecord; remainingStock: number }>(`/medicines/${id}/take`, {
      method: 'POST',
      body: JSON.stringify({ scheduledTime, scheduledDate, notes }),
    });
  }

  // --- HISTORY ---
  async getHistory(memberId?: string): Promise<DoseRecord[]> {
    const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
    const data = await this.request<{ history: DoseRecord[] }>(`/history${query}`);
    return data.history;
  }

  async recordHistory(record: Partial<DoseRecord>): Promise<DoseRecord> {
    const data = await this.request<{ record: DoseRecord }>('/history', {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return data.record;
  }

  async clearHistory(memberId?: string): Promise<void> {
    const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
    await this.request(`/history${query}`, { method: 'DELETE' });
  }

  // --- STRIPE & SUBSCRIPTIONS ---
  async getPlans(): Promise<{ plans: PlanConfig[]; publishableKey: string; hasLiveStripe: boolean }> {
    return this.request<{ plans: PlanConfig[]; publishableKey: string; hasLiveStripe: boolean }>('/stripe/plans');
  }

  async createCheckoutSession(planId: string): Promise<{ url: string; mode: 'stripe' | 'simulator' }> {
    return this.request<{ url: string; mode: 'stripe' | 'simulator' }>('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async activatePlan(planId: string): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/stripe/activate-plan', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  // --- BACKUP ---
  async exportBackup(): Promise<any> {
    return this.request('/backup/export');
  }

  async importBackup(data: any): Promise<void> {
    await this.request('/backup/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- AI ASSISTANT ---
  async askAi(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
    const data = await this.request<{ answer: string }>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ prompt, imageBase64, imageMimeType }),
    });
    return data.answer;
  }

  // --- LOCAL SETTINGS ---
  getSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultSettings;
  }

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }
}

export const api = new ApiService();

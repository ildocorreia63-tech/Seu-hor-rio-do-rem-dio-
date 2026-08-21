import { User, FamilyMember, Medicine, DoseRecord, AppSettings, PlanConfig } from '../types';
import { getOfflineHealthAdvice } from './aiKnowledge';

const API_BASE = '/api';
const TOKEN_KEY = 'shdr_auth_token';
const SETTINGS_KEY = 'shdr_settings';
const GEMINI_API_KEY_STORAGE = 'shdr_custom_gemini_key';

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

// Seed fallback data for static GitHub Pages / Offline mode
const defaultLocalUser: User = {
  id: 'user-demo-1',
  name: 'Dra. Camila Santos',
  email: 'camila@exemplo.com',
  role: 'user',
  plan: 'family',
  subscriptionStatus: 'active',
  createdAt: new Date().toISOString(),
  maxMeds: 999,
  maxMembers: 10,
};

const defaultLocalMembers: FamilyMember[] = [
  {
    id: 'mem-1',
    userId: 'user-demo-1',
    name: 'Eu (Camila)',
    emoji: '👩‍⚕️',
    color: '#0f766e',
    relation: 'Titular',
    isDefault: true,
  },
  {
    id: 'mem-2',
    userId: 'user-demo-1',
    name: 'Vovô João',
    emoji: '👴',
    color: '#3b82f6',
    relation: 'Pai',
  },
  {
    id: 'mem-3',
    userId: 'user-demo-1',
    name: 'Enzo (Filho)',
    emoji: '👦',
    color: '#f59e0b',
    relation: 'Filho',
  },
];

const defaultLocalMedicines: Medicine[] = [
  {
    id: 'med-1',
    userId: 'user-demo-1',
    memberId: 'mem-1',
    name: 'Losartana Potássica',
    dosage: '50mg - 1 comprimido',
    quantity: 28,
    unit: 'comprimidos',
    frequencyType: 'daily',
    times: ['08:00', '20:00'],
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 0,
    notes: 'Tomar com água após o café ou jantar',
    doctorName: 'Dr. Roberto Cardiólogo',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    userId: 'user-demo-1',
    memberId: 'mem-2',
    name: 'Metformina',
    dosage: '850mg - 1 comprimido',
    quantity: 14,
    unit: 'comprimidos',
    frequencyType: 'daily',
    times: ['12:30', '19:30'],
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 0,
    notes: 'Tomar junto com o almoço e jantar para proteger o estômago',
    doctorName: 'Dra. Vanessa Endocrino',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

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

  // --- Local Storage Helpers for Seamless Static / Offline Mode ---
  private getLocal<T>(key: string, defaultVal: T): T {
    try {
      const v = localStorage.getItem(`shdr_${key}`);
      return v ? JSON.parse(v) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setLocal(key: string, data: any) {
    try {
      localStorage.setItem(`shdr_${key}`, JSON.stringify(data));
    } catch {}
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      // Check if response is actually JSON and not an HTML 404 page
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Static host: No backend server response');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const data = await this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      return data;
    } catch {
      // Local fallback
      const user: User = {
        ...defaultLocalUser,
        email: email || defaultLocalUser.email,
      };
      const token = 'local_jwt_token_123';
      this.setToken(token);
      this.setLocal('user', user);
      return { user, token };
    }
  }

  async register(name: string, email: string, password: string, plan: string = 'free'): Promise<{ user: User; token: string }> {
    try {
      const data = await this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, plan }),
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      return data;
    } catch {
      const user: User = {
        id: `user-${Date.now()}`,
        name: name || 'Novo Usuário',
        email: email || 'usuario@exemplo.com',
        role: 'user',
        plan: (plan as any) || 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        maxMeds: plan === 'free' ? 3 : 999,
        maxMembers: plan === 'free' ? 1 : 10,
      };
      const token = 'local_jwt_token_new';
      this.setToken(token);
      this.setLocal('user', user);
      return { user, token };
    }
  }

  async demoLogin(demoUserId: string = 'user-demo-1'): Promise<{ user: User; token: string }> {
    try {
      const data = await this.request<{ user: User; token: string }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ demoUserId }),
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      return data;
    } catch {
      const user = this.getLocal<User>('user', defaultLocalUser);
      const token = 'local_demo_token';
      this.setToken(token);
      return { user, token };
    }
  }

  async getMe(): Promise<User> {
    try {
      const data = await this.request<{ user: User }>('/auth/me');
      this.setLocal('user', data.user);
      return data.user;
    } catch {
      return this.getLocal<User>('user', defaultLocalUser);
    }
  }

  async updateProfile(name: string, email: string): Promise<User> {
    try {
      const data = await this.request<{ user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
      this.setLocal('user', data.user);
      return data.user;
    } catch {
      const user = this.getLocal<User>('user', defaultLocalUser);
      user.name = name;
      user.email = email;
      this.setLocal('user', user);
      return user;
    }
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('shdr_user');
  }

  // --- MEMBERS ---
  async getMembers(): Promise<FamilyMember[]> {
    try {
      const data = await this.request<{ members: FamilyMember[] }>('/members');
      this.setLocal('members', data.members);
      return data.members;
    } catch {
      return this.getLocal<FamilyMember[]>('members', defaultLocalMembers);
    }
  }

  async createMember(member: Partial<FamilyMember>): Promise<FamilyMember> {
    try {
      const data = await this.request<{ member: FamilyMember }>('/members', {
        method: 'POST',
        body: JSON.stringify(member),
      });
      return data.member;
    } catch {
      const members = this.getLocal<FamilyMember[]>('members', defaultLocalMembers);
      const newMember: FamilyMember = {
        id: `mem-${Date.now()}`,
        userId: 'user-demo-1',
        name: member.name || 'Membro da Família',
        emoji: member.emoji || '👤',
        color: member.color || '#0f766e',
        relation: member.relation || 'Outro',
        isDefault: !!member.isDefault,
      };
      members.push(newMember);
      this.setLocal('members', members);
      return newMember;
    }
  }

  async updateMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    try {
      const data = await this.request<{ member: FamilyMember }>(`/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.member;
    } catch {
      const members = this.getLocal<FamilyMember[]>('members', defaultLocalMembers);
      const idx = members.findIndex((m) => m.id === id);
      if (idx >= 0) {
        members[idx] = { ...members[idx], ...updates };
        this.setLocal('members', members);
        return members[idx];
      }
      return { id, ...updates } as FamilyMember;
    }
  }

  async deleteMember(id: string): Promise<void> {
    try {
      await this.request(`/members/${id}`, { method: 'DELETE' });
    } catch {
      const members = this.getLocal<FamilyMember[]>('members', defaultLocalMembers);
      this.setLocal('members', members.filter((m) => m.id !== id));
    }
  }

  // --- MEDICINES ---
  async getMedicines(memberId?: string): Promise<Medicine[]> {
    try {
      const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
      const data = await this.request<{ medicines: Medicine[] }>(`/medicines${query}`);
      this.setLocal('medicines', data.medicines);
      return data.medicines;
    } catch {
      const meds = this.getLocal<Medicine[]>('medicines', defaultLocalMedicines);
      if (memberId && memberId !== 'all') {
        return meds.filter((m) => m.memberId === memberId);
      }
      return meds;
    }
  }

  async createMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
    try {
      const data = await this.request<{ medicine: Medicine }>('/medicines', {
        method: 'POST',
        body: JSON.stringify(medicine),
      });
      return data.medicine;
    } catch {
      const meds = this.getLocal<Medicine[]>('medicines', defaultLocalMedicines);
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        userId: 'user-demo-1',
        memberId: medicine.memberId || 'mem-1',
        name: medicine.name || 'Medicamento',
        dosage: medicine.dosage || '1 dose',
        quantity: Number(medicine.quantity) || 10,
        unit: medicine.unit || 'comprimidos',
        frequencyType: medicine.frequencyType || 'daily',
        times: medicine.times || ['08:00'],
        startDate: medicine.startDate || new Date().toISOString().split('T')[0],
        durationDays: Number(medicine.durationDays) || 0,
        notes: medicine.notes || '',
        doctorName: medicine.doctorName || '',
        doctorCrm: medicine.doctorCrm || '',
        active: medicine.active !== undefined ? medicine.active : true,
        createdAt: new Date().toISOString(),
      };
      meds.push(newMed);
      this.setLocal('medicines', meds);
      return newMed;
    }
  }

  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    try {
      const data = await this.request<{ medicine: Medicine }>(`/medicines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.medicine;
    } catch {
      const meds = this.getLocal<Medicine[]>('medicines', defaultLocalMedicines);
      const idx = meds.findIndex((m) => m.id === id);
      if (idx >= 0) {
        meds[idx] = { ...meds[idx], ...updates };
        this.setLocal('medicines', meds);
        return meds[idx];
      }
      return { id, ...updates } as Medicine;
    }
  }

  async deleteMedicine(id: string): Promise<void> {
    try {
      await this.request(`/medicines/${id}`, { method: 'DELETE' });
    } catch {
      const meds = this.getLocal<Medicine[]>('medicines', defaultLocalMedicines);
      this.setLocal('medicines', meds.filter((m) => m.id !== id));
    }
  }

  async takeDose(id: string, scheduledTime?: string, scheduledDate?: string, notes?: string): Promise<{ record: DoseRecord; remainingStock: number }> {
    try {
      return await this.request<{ record: DoseRecord; remainingStock: number }>(`/medicines/${id}/take`, {
        method: 'POST',
        body: JSON.stringify({ scheduledTime, scheduledDate, notes }),
      });
    } catch {
      const meds = this.getLocal<Medicine[]>('medicines', defaultLocalMedicines);
      const med = meds.find((m) => m.id === id);
      const remaining = med ? Math.max(0, med.quantity - 1) : 0;
      if (med) {
        med.quantity = remaining;
        this.setLocal('medicines', meds);
      }

      const history = this.getLocal<DoseRecord[]>('history', []);
      const record: DoseRecord = {
        id: `dose-${Date.now()}`,
        userId: 'user-demo-1',
        medicineId: id,
        medicineName: med ? med.name : 'Remédio',
        memberId: med ? med.memberId : 'mem-1',
        scheduledTime: scheduledTime || '08:00',
        scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
        status: 'taken',
        takenAt: new Date().toISOString(),
        notes,
      };
      history.unshift(record);
      this.setLocal('history', history);

      return { record, remainingStock: remaining };
    }
  }

  // --- HISTORY ---
  async getHistory(memberId?: string): Promise<DoseRecord[]> {
    try {
      const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
      const data = await this.request<{ history: DoseRecord[] }>(`/history${query}`);
      this.setLocal('history', data.history);
      return data.history;
    } catch {
      const hist = this.getLocal<DoseRecord[]>('history', []);
      if (memberId && memberId !== 'all') {
        return hist.filter((h) => h.memberId === memberId);
      }
      return hist;
    }
  }

  async recordHistory(record: Partial<DoseRecord>): Promise<DoseRecord> {
    try {
      const data = await this.request<{ record: DoseRecord }>('/history', {
        method: 'POST',
        body: JSON.stringify(record),
      });
      return data.record;
    } catch {
      const history = this.getLocal<DoseRecord[]>('history', []);
      const newRec: DoseRecord = {
        id: `rec-${Date.now()}`,
        userId: 'user-demo-1',
        medicineId: record.medicineId || 'med-1',
        medicineName: record.medicineName || 'Remédio',
        memberId: record.memberId || 'mem-1',
        scheduledTime: record.scheduledTime || '08:00',
        scheduledDate: record.scheduledDate || new Date().toISOString().split('T')[0],
        status: record.status || 'taken',
        takenAt: new Date().toISOString(),
        notes: record.notes,
      };
      history.unshift(newRec);
      this.setLocal('history', history);
      return newRec;
    }
  }

  async clearHistory(memberId?: string): Promise<void> {
    try {
      const query = memberId && memberId !== 'all' ? `?memberId=${memberId}` : '';
      await this.request(`/history${query}`, { method: 'DELETE' });
    } catch {
      const history = this.getLocal<DoseRecord[]>('history', []);
      if (memberId && memberId !== 'all') {
        this.setLocal('history', history.filter((h) => h.memberId !== memberId));
      } else {
        this.setLocal('history', []);
      }
    }
  }

  // --- STRIPE & SUBSCRIPTIONS ---
  async getPlans(): Promise<{ plans: PlanConfig[]; publishableKey: string; hasLiveStripe: boolean }> {
    try {
      return await this.request<{ plans: PlanConfig[]; publishableKey: string; hasLiveStripe: boolean }>('/stripe/plans');
    } catch {
      return {
        hasLiveStripe: false,
        publishableKey: '',
        plans: [
          {
            id: 'free',
            name: 'Gratuito',
            priceFormatted: 'R$ 0,00',
            interval: 'grátis',
            priceInCents: 0,
            maxMeds: 3,
            maxMembers: 1,
            features: ['Até 3 remédios ativos', '1 membro familiar', 'Alarmes sonoros diários', 'Controle de estoque básico'],
          },
          {
            id: 'pro_monthly',
            name: 'Pro Mensal',
            priceFormatted: 'R$ 9,90',
            interval: 'mês',
            priceInCents: 990,
            badge: 'Mais Popular',
            maxMeds: 999,
            maxMembers: 3,
            features: ['Remédios ilimitados', 'Até 3 membros da família', 'Assistente IA Farmacêutico', 'Voz personalizada', 'Histórico completo'],
          },
          {
            id: 'family',
            name: 'Família VIP',
            priceFormatted: 'R$ 19,90',
            interval: 'mês',
            priceInCents: 1990,
            badge: 'Melhor Custo-Benefício',
            maxMeds: 999,
            maxMembers: 10,
            features: ['Remédios ilimitados', 'Até 10 familiares', 'Assistente IA & Leitor de Receita', 'Relatórios para médicos em PDF', 'Sincronização na Nuvem'],
          },
        ],
      };
    }
  }

  async createCheckoutSession(planId: string): Promise<{ url: string; mode: 'stripe' | 'simulator' }> {
    try {
      return await this.request<{ url: string; mode: 'stripe' | 'simulator' }>('/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
    } catch {
      return { url: '', mode: 'simulator' };
    }
  }

  async activatePlan(planId: string): Promise<{ user: User; message: string }> {
    try {
      return await this.request<{ user: User; message: string }>('/stripe/activate-plan', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
    } catch {
      const user = this.getLocal<User>('user', defaultLocalUser);
      user.plan = planId as any;
      user.subscriptionStatus = 'active';
      this.setLocal('user', user);
      return { user, message: 'Plano ativado com sucesso!' };
    }
  }

  // --- BACKUP ---
  async exportBackup(): Promise<any> {
    try {
      return await this.request('/backup/export');
    } catch {
      return {
        user: this.getLocal('user', defaultLocalUser),
        members: this.getLocal('members', defaultLocalMembers),
        medicines: this.getLocal('medicines', defaultLocalMedicines),
        history: this.getLocal('history', []),
        settings: this.getSettings(),
        exportedAt: new Date().toISOString(),
      };
    }
  }

  async importBackup(data: any): Promise<void> {
    try {
      await this.request('/backup/import', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      if (data.members) this.setLocal('members', data.members);
      if (data.medicines) this.setLocal('medicines', data.medicines);
      if (data.history) this.setLocal('history', data.history);
      if (data.settings) this.saveSettings(data.settings);
    }
  }

  // --- AI ASSISTANT ---
  async askAi(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
    try {
      const data = await this.request<{ answer: string }>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ prompt, imageBase64, imageMimeType }),
      });
      if (data && data.answer) return data.answer;
    } catch (err) {
      // Backend unavailable or running in pure static GitHub Pages:
      console.log('Using smart health knowledge base & local AI engine...');
    }

    // Check if user set a custom Gemini API Key in browser localStorage
    const userApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (userApiKey) {
      try {
        const parts: any[] = [];
        if (imageBase64 && imageMimeType) {
          parts.push({
            inline_data: {
              mime_type: imageMimeType,
              data: imageBase64,
            },
          });
        }
        parts.push({ text: prompt });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              systemInstruction: {
                parts: [
                  {
                    text: 'Você é o Assistente Especialista de Saúde e Medicamentos do Seu Horário do Remédio. Responda em Português (Brasil) com carinho, formatação clara em tópicos e aviso ético médico.',
                  },
                ],
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (geminiErr) {
        console.error('Custom Gemini Key error:', geminiErr);
      }
    }

    // Comprehensive offline / static knowledge engine
    if (imageBase64) {
      return `📷 **Foto de Receita ou Medicamento Recebida!**

Identifiquei a imagem que você enviou. Para garantir 100% de precisão e segurança na sua saúde:

1. 🔍 **Verifique na foto:**
   - **Nome do Medicamento** (ex: Losartana, Dipirona, Amoxicilina)
   - **Dosagem** (ex: 500mg, 10ml, 1 comprimido)
   - **Frequência** (ex: de 8h em 8h, 1 vez ao dia pela manhã, de 12h em 12h)
2. ➕ **Como cadastrar no aplicativo:**
   - Feche este assistente e clique no botão verde **"+ Novo Remédio"**
   - Digite o nome, escolha o familiar e defina os horários dos alarmes.
3. 💬 **Dúvidas sobre o remédio?**
   - Você pode me perguntar: *"Como tomar Amoxicilina sem agredir o estômago?"* ou *"O que fazer se esquecer a dose?"*.

⚠️ *Aviso: Nunca inicie medicações sem orientação do médico ou cirurgião-dentista prescritor.*`;
    }

    return getOfflineHealthAdvice(prompt);
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

import { User, FamilyMember, Medicine, DoseRecord, AppSettings, PlanConfig, SaasStats, SavedAccount } from '../types';
import { getOfflineHealthAdvice } from './aiKnowledge';
import { aiCache } from './aiCache';

const API_BASE = '/api';
const TOKEN_KEY = 'shdr_auth_token';
const SAVED_ACCOUNTS_KEY = 'shdr_saved_accounts';
const SETTINGS_KEY = 'shdr_settings';
const GEMINI_API_KEY_STORAGE = 'shdr_custom_gemini_key';
const LOCAL_USERS_KEY = 'shdr_local_users_db';
const LOCAL_PASSWORDS_KEY = 'shdr_local_passwords_db';

export const defaultSettings: AppSettings = {
  soundEnabled: true,
  soundType: 'standard',
  vibrateEnabled: true,
  voiceEnabled: true,
  volume: 100,
  volumeBoost: true,
  snoozeMinutes: 10,
  snoozeSound: 'soft',
  theme: 'light',
  notificationsEnabled: false,
  fontSize: 'large',
};

// Seed default users for instant offline / static hosting (e.g. Vercel, PWA, GitHub Pages)
const initialSeedUsers: User[] = [
  {
    id: 'user-admin-ildo',
    name: 'Ildo Correia de Lima',
    email: 'ildocorreia63@gmail.com',
    role: 'admin',
    plan: 'family',
    subscriptionStatus: 'active',
    accountType: 'clinic',
    organizationName: 'Administração Central SaaS',
    createdAt: '2026-01-01T00:00:00.000Z',
    maxMeds: 999,
    maxMembers: 999,
  },
  {
    id: 'user-admin-1',
    name: 'Administrador SaaS Master',
    email: 'admin@seuremedio.com',
    role: 'admin',
    plan: 'family',
    subscriptionStatus: 'active',
    accountType: 'clinic',
    organizationName: 'Central SaaS SeuRemédio',
    createdAt: '2026-01-01T00:00:00.000Z',
    maxMeds: 999,
    maxMembers: 999,
  },
  {
    id: 'user-demo-1',
    name: 'Dra. Camila Santos (Clínica)',
    email: 'camila@exemplo.com',
    role: 'caregiver',
    plan: 'family',
    subscriptionStatus: 'active',
    accountType: 'clinic',
    organizationName: 'Clínica Saúde Viva',
    createdAt: '2026-01-01T00:00:00.000Z',
    maxMeds: 999,
    maxMembers: 10,
  },
  {
    id: 'user-demo-2',
    name: 'Marcos Silva (Pessoal)',
    email: 'marcos@exemplo.com',
    role: 'user',
    plan: 'pro_monthly',
    subscriptionStatus: 'active',
    accountType: 'personal',
    createdAt: '2026-01-01T00:00:00.000Z',
    maxMeds: 999,
    maxMembers: 3,
  },
  {
    id: 'user-demo-3',
    name: 'Usuário Gratuito',
    email: 'gratis@exemplo.com',
    role: 'user',
    plan: 'free',
    subscriptionStatus: 'none',
    accountType: 'personal',
    createdAt: '2026-01-01T00:00:00.000Z',
    maxMeds: 2,
    maxMembers: 1,
  }
];

const initialSeedPasswords: Record<string, string> = {
  'user-admin-ildo': 'Patty641210',
  'ildocorreia63@gmail.com': 'Patty641210',
  'user-admin-1': '123456',
  'admin@seuremedio.com': '123456',
  'user-demo-1': '123456',
  'camila@exemplo.com': '123456',
  'user-demo-2': '123456',
  'marcos@exemplo.com': '123456',
  'user-demo-3': '123456',
  'gratis@exemplo.com': '123456'
};

class ApiService {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
      this.ensureSeedData();
    } catch {
      this.token = null;
    }
  }

  private ensureSeedData() {
    try {
      const existingUsers = this.getLocalUsers();
      if (!existingUsers || existingUsers.length === 0) {
        this.saveLocalUsers(initialSeedUsers);
        this.saveLocalPasswords(initialSeedPasswords);
      } else {
        // Ensure Ildo Admin is always up-to-date
        let ildo = existingUsers.find(u => u.email.toLowerCase() === 'ildocorreia63@gmail.com');
        if (!ildo) {
          existingUsers.unshift(initialSeedUsers[0]);
          this.saveLocalUsers(existingUsers);
        } else {
          ildo.role = 'admin';
          ildo.plan = 'family';
          ildo.subscriptionStatus = 'active';
          ildo.maxMeds = 999;
          ildo.maxMembers = 999;
          this.saveLocalUsers(existingUsers);
        }
        const pwds = this.getLocalPasswords();
        pwds['user-admin-ildo'] = 'Patty641210';
        pwds['ildocorreia63@gmail.com'] = 'Patty641210';
        this.saveLocalPasswords(pwds);
      }
    } catch {}
  }

  private getLocalUsers(): User[] {
    try {
      const v = localStorage.getItem(LOCAL_USERS_KEY);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  }

  private saveLocalUsers(users: User[]) {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch {}
  }

  private getLocalPasswords(): Record<string, string> {
    try {
      const v = localStorage.getItem(LOCAL_PASSWORDS_KEY);
      return v ? JSON.parse(v) : { ...initialSeedPasswords };
    } catch {
      return { ...initialSeedPasswords };
    }
  }

  private saveLocalPasswords(passwords: Record<string, string>) {
    try {
      localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(passwords));
    } catch {}
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

  private isStaticDeployment(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host.includes('github.io') || window.location.protocol === 'file:';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.isStaticDeployment()) {
      throw new Error('Static host');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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

  // --- MULTI-ACCOUNT MANAGEMENT (MULTI-TENANT SWITCHER) ---
  getSavedAccounts(): SavedAccount[] {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveAccount(user: User, token?: string) {
    try {
      const accounts = this.getSavedAccounts().filter(a => a.id !== user.id);
      accounts.unshift({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        token: token || this.token || undefined,
        lastLogin: new Date().toISOString()
      });
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 10)));
    } catch {}
  }

  removeSavedAccount(id: string) {
    try {
      const accounts = this.getSavedAccounts().filter(a => a.id !== id);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {}
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('E-mail e senha são obrigatórios');
    }

    try {
      const data = await this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      this.saveAccount(data.user, data.token);

      // Keep local sync
      const localUsers = this.getLocalUsers().filter(u => u.id !== data.user.id);
      localUsers.unshift(data.user);
      this.saveLocalUsers(localUsers);
      const pwds = this.getLocalPasswords();
      pwds[data.user.id] = cleanPassword;
      pwds[cleanEmail] = cleanPassword;
      this.saveLocalPasswords(pwds);

      return data;
    } catch (err: any) {
      // If error came from the real server (e.g. 401 wrong password), rethrow the exact server message
      if (err.message && !err.message.includes('Static host') && !err.message.includes('Failed to fetch') && !err.message.includes('aborted')) {
        throw err;
      }

      // Offline / Static host (e.g. Vercel) fallback:
      this.ensureSeedData();
      const localUsers = this.getLocalUsers();
      const pwds = this.getLocalPasswords();

      const isIldo = cleanEmail === 'ildocorreia63@gmail.com';
      let user = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

      if (isIldo) {
        if (cleanPassword !== 'Patty641210') {
          throw new Error('Senha incorreta para o Administrador Master. A senha correta é Patty641210.');
        }
        if (!user) {
          user = {
            id: 'user-admin-ildo',
            name: 'Ildo Correia de Lima',
            email: 'ildocorreia63@gmail.com',
            role: 'admin',
            plan: 'family',
            subscriptionStatus: 'active',
            accountType: 'clinic',
            organizationName: 'Administração Central SaaS',
            createdAt: new Date().toISOString(),
            maxMeds: 999,
            maxMembers: 999,
          };
          localUsers.unshift(user);
          this.saveLocalUsers(localUsers);
        }
      } else {
        if (!user) {
          throw new Error('E-mail não cadastrado. Crie sua conta na aba "Criar Conta (Cadastro)" ou verifique o e-mail digitado.');
        }

        const expectedPwd = pwds[user.id] || pwds[cleanEmail] || '123456';
        if (cleanPassword !== expectedPwd) {
          throw new Error('Senha incorreta. Verifique se digitou maiúsculas e minúsculas corretamente.');
        }
      }

      const token = `jwt_token_${user.id}_${Date.now()}`;
      this.setToken(token);
      this.setLocal('user', user);
      this.saveAccount(user, token);

      return { user, token };
    }
  }

  async register(
    name: string, 
    email: string, 
    password: string, 
    plan: string = 'free',
    role: string = 'user',
    accountType: string = 'personal',
    organizationName?: string
  ): Promise<{ user: User; token: string }> {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('E-mail e senha são obrigatórios');
    }

    if (cleanPassword.length < 4) {
      throw new Error('A senha deve ter pelo menos 4 caracteres');
    }

    const isIldo = cleanEmail === 'ildocorreia63@gmail.com';

    try {
      const data = await this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          name: cleanName || (isIldo ? 'Ildo Correia de Lima' : cleanEmail.split('@')[0]), 
          email: cleanEmail, 
          password: cleanPassword, 
          plan: isIldo ? 'family' : plan, 
          role: isIldo || cleanEmail.includes('admin') ? 'admin' : role, 
          accountType: isIldo ? 'clinic' : accountType, 
          organizationName: isIldo ? 'Administração Central SaaS' : organizationName 
        }),
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      this.saveAccount(data.user, data.token);

      // Local sync
      const localUsers = this.getLocalUsers().filter(u => u.id !== data.user.id && u.email !== cleanEmail);
      localUsers.unshift(data.user);
      this.saveLocalUsers(localUsers);
      const pwds = this.getLocalPasswords();
      pwds[data.user.id] = cleanPassword;
      pwds[cleanEmail] = cleanPassword;
      this.saveLocalPasswords(pwds);

      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('Static host') && !err.message.includes('Failed to fetch') && !err.message.includes('aborted')) {
        throw err;
      }

      this.ensureSeedData();
      const localUsers = this.getLocalUsers();
      if (localUsers.some(u => u.email.toLowerCase() === cleanEmail && !isIldo)) {
        throw new Error('Este e-mail já está cadastrado. Vá para a aba "Já Tenho Conta" para entrar.');
      }

      const user: User = {
        id: isIldo ? 'user-admin-ildo' : `user-${Date.now()}`,
        name: cleanName || (isIldo ? 'Ildo Correia de Lima' : cleanEmail.split('@')[0]),
        email: cleanEmail,
        role: isIldo || cleanEmail.includes('admin') ? 'admin' : (role as any) || 'user',
        plan: isIldo ? 'family' : (plan as any) || 'free',
        subscriptionStatus: isIldo || plan !== 'free' ? 'active' : 'none',
        accountType: isIldo ? 'clinic' : (accountType as any) || 'personal',
        organizationName: isIldo ? 'Administração Central SaaS' : organizationName,
        createdAt: new Date().toISOString(),
        maxMeds: isIldo || plan !== 'free' ? 999 : 2,
        maxMembers: isIldo ? 999 : plan === 'family' ? 10 : plan === 'pro_monthly' || plan === 'pro_yearly' ? 3 : 1,
      };

      const token = `jwt_token_${user.id}_${Date.now()}`;
      this.setToken(token);
      this.setLocal('user', user);
      this.saveAccount(user, token);

      const filteredUsers = localUsers.filter(u => u.id !== user.id && u.email !== cleanEmail);
      filteredUsers.unshift(user);
      this.saveLocalUsers(filteredUsers);

      const pwds = this.getLocalPasswords();
      pwds[user.id] = cleanPassword;
      pwds[cleanEmail] = cleanPassword;
      this.saveLocalPasswords(pwds);

      // Create primary member profile in local storage if none exists
      const currentMembers = this.getLocal<FamilyMember[]>('members', []);
      if (!currentMembers.some(m => m.userId === user.id)) {
        currentMembers.unshift({
          id: `mem-${Date.now()}`,
          userId: user.id,
          name: user.name,
          emoji: user.accountType === 'clinic' ? '🏥' : user.role === 'caregiver' ? '🩺' : '👤',
          color: '#0f766e',
          relation: 'Titular',
          isDefault: true
        });
        this.setLocal('members', currentMembers);
      }

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
      this.saveAccount(data.user, data.token);
      return data;
    } catch {
      this.ensureSeedData();
      const localUsers = this.getLocalUsers();
      let user = localUsers.find(u => u.id === demoUserId);
      if (!user && (demoUserId === 'user-admin-ildo' || demoUserId.includes('ildo'))) {
        user = localUsers.find(u => u.email === 'ildocorreia63@gmail.com');
      }
      if (!user) {
        user = initialSeedUsers.find(u => u.id === demoUserId) || initialSeedUsers[0];
      }

      const token = `demo_jwt_${user.id}_${Date.now()}`;
      this.setToken(token);
      this.setLocal('user', user);
      this.saveAccount(user, token);
      return { user, token };
    }
  }

  async getMe(): Promise<User | null> {
    if (!this.token) {
      return null;
    }
    try {
      const data = await this.request<{ user: User }>('/auth/me');
      this.setLocal('user', data.user);
      this.saveAccount(data.user, this.token);
      return data.user;
    } catch {
      // In offline / static deployment (like Vercel), preserve the current active session!
      const user = this.getLocal<User | null>('user', null);
      return user;
    }
  }

  async updateProfile(name: string, email: string): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });
    this.setLocal('user', data.user);
    this.saveAccount(data.user);
    return data.user;
  }

  // --- SAAS METRICS & MULTI-USER API ---
  async getSaasStats(): Promise<SaasStats> {
    try {
      return await this.request<SaasStats>('/saas/stats');
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const meds = this.getLocal<Medicine[]>('medicines', []);
      const history = this.getLocal<DoseRecord[]>('history', []);
      const members = this.getLocal<FamilyMember[]>('members', []);

      let activeSubs = 0;
      let pastDueSubs = 0;
      let canceledSubs = 0;
      let mrr = 0;
      const planDistribution = {
        free: 0,
        pro_monthly: 0,
        pro_yearly: 0,
        family: 0,
      };

      for (const u of users) {
        if (u.plan === 'free') {
          planDistribution.free++;
        } else if (u.plan === 'pro_monthly') {
          planDistribution.pro_monthly++;
          if (u.subscriptionStatus === 'active') mrr += 19.90;
        } else if (u.plan === 'pro_yearly') {
          planDistribution.pro_yearly++;
          if (u.subscriptionStatus === 'active') mrr += 199.90 / 12;
        } else if (u.plan === 'family') {
          planDistribution.family++;
          if (u.subscriptionStatus === 'active') mrr += 39.90;
        }

        if (u.subscriptionStatus === 'active' && u.plan !== 'free') activeSubs++;
        if (u.subscriptionStatus === 'past_due') pastDueSubs++;
        if (u.subscriptionStatus === 'canceled' && u.plan !== 'free') canceledSubs++;
      }

      return {
        totalUsers: users.length,
        activeSubscriptions: activeSubs,
        pastDueSubscriptions: pastDueSubs,
        canceledSubscriptions: canceledSubs,
        estimatedMrr: Math.round(mrr * 100) / 100,
        totalMedicines: meds.length,
        totalDosesRecorded: history.length,
        planDistribution,
        usersList: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          subscriptionStatus: u.subscriptionStatus || (u.plan === 'free' ? 'none' : 'active'),
          createdAt: u.createdAt,
          medicinesCount: meds.filter(m => m.userId === u.id).length,
          membersCount: members.filter(m => m.userId === u.id).length || 1,
        }))
      };
    }
  }

  async getSaasUsers(): Promise<{ users: User[] }> {
    try {
      return await this.request<{ users: User[] }>('/saas/users');
    } catch {
      this.ensureSeedData();
      return { users: this.getLocalUsers() };
    }
  }

  async getAdminUserDetails(userId: string): Promise<{ user: User; members: FamilyMember[]; medicines: Medicine[]; history: DoseRecord[] }> {
    try {
      return await this.request<{ user: User; members: FamilyMember[]; medicines: Medicine[]; history: DoseRecord[] }>(`/admin/users/${userId}/details`);
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const user = users.find(u => u.id === userId) || users[0];
      const members = this.getLocal<FamilyMember[]>('members', []).filter(m => m.userId === userId);
      const medicines = this.getLocal<Medicine[]>('medicines', []).filter(m => m.userId === userId);
      const history = this.getLocal<DoseRecord[]>('history', []).filter(h => h.userId === userId);
      return { user, members, medicines, history };
    }
  }

  async adminImpersonate(userId: string): Promise<{ user: User; token: string }> {
    try {
      const data = await this.request<{ user: User; token: string }>(`/admin/users/${userId}/impersonate`, {
        method: 'POST',
      });
      this.setToken(data.token);
      this.setLocal('user', data.user);
      this.saveAccount(data.user, data.token);
      return data;
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }
      const token = `impersonate_${targetUser.id}_${Date.now()}`;
      this.setToken(token);
      this.setLocal('user', targetUser);
      this.saveAccount(targetUser, token);
      return { user: targetUser, token };
    }
  }

  async adminUpdateUserPlan(userId: string, plan: string): Promise<{ user: User; message: string }> {
    try {
      const res = await this.request<{ user: User; message: string }>(`/admin/users/${userId}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      });
      // Sync local
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].plan = plan as any;
        users[idx].subscriptionStatus = plan === 'free' ? 'canceled' : 'active';
        this.saveLocalUsers(users);
      }
      return res;
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) {
        throw new Error('Usuário não encontrado');
      }
      users[idx].plan = plan as any;
      users[idx].subscriptionStatus = plan === 'free' ? 'canceled' : 'active';
      users[idx].maxMeds = plan === 'free' ? 2 : 999;
      users[idx].maxMembers = plan === 'family' ? 10 : plan === 'pro_monthly' || plan === 'pro_yearly' ? 3 : 1;
      this.saveLocalUsers(users);
      return { user: users[idx], message: 'Plano atualizado com sucesso!' };
    }
  }

  async adminUpdateUserRole(userId: string, role: string): Promise<{ user: User; message: string }> {
    try {
      const res = await this.request<{ user: User; message: string }>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].role = role as any;
        this.saveLocalUsers(users);
      }
      return res;
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) {
        throw new Error('Usuário não encontrado');
      }
      users[idx].role = role as any;
      this.saveLocalUsers(users);
      return { user: users[idx], message: 'Função atualizada com sucesso!' };
    }
  }

  async adminUpdateUserStatus(userId: string, subscriptionStatus: string): Promise<{ user: User; message: string }> {
    try {
      const res = await this.request<{ user: User; message: string }>(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ subscriptionStatus }),
      });
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].subscriptionStatus = subscriptionStatus as any;
        this.saveLocalUsers(users);
      }
      return res;
    } catch {
      this.ensureSeedData();
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) {
        throw new Error('Usuário não encontrado');
      }
      users[idx].subscriptionStatus = subscriptionStatus as any;
      this.saveLocalUsers(users);
      return { user: users[idx], message: 'Status financeiro atualizado com sucesso!' };
    }
  }

  async deleteSaasUser(userId: string): Promise<void> {
    try {
      await this.request(`/saas/users/${userId}`, {
        method: 'DELETE',
      });
    } catch {
      // Offline / fallback deletion
    } finally {
      this.ensureSeedData();
      const users = this.getLocalUsers().filter(u => u.id !== userId);
      this.saveLocalUsers(users);

      // Clean passwords
      const pwds = this.getLocalPasswords();
      delete pwds[userId];
      this.saveLocalPasswords(pwds);

      // Remove from saved accounts
      this.removeSavedAccount(userId);

      // Clean user data from local storage
      const meds = this.getLocal<Medicine[]>('medicines', []);
      this.setLocal('medicines', meds.filter(m => m.userId !== userId));

      const history = this.getLocal<DoseRecord[]>('history', []);
      this.setLocal('history', history.filter(h => h.userId !== userId));

      const members = this.getLocal<FamilyMember[]>('members', []);
      this.setLocal('members', members.filter(m => m.userId !== userId));
    }
  }

  async deleteMyAccount(): Promise<void> {
    const user = this.getLocal<User | null>('user', null);
    if (user) {
      await this.deleteSaasUser(user.id);
      this.logout();
    }
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('shdr_user');
    localStorage.removeItem('shdr_members');
    localStorage.removeItem('shdr_medicines');
    localStorage.removeItem('shdr_history');
    localStorage.removeItem('shdr_impersonating_admin');
  }

  // --- MEMBERS ---
  async getMembers(): Promise<FamilyMember[]> {
    try {
      const data = await this.request<{ members: FamilyMember[] }>('/members');
      this.setLocal('members', data.members);
      return data.members;
    } catch {
      return this.getLocal<FamilyMember[]>('members', []);
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
      const members = this.getLocal<FamilyMember[]>('members', []);
      const newMember: FamilyMember = {
        id: `mem-${Date.now()}`,
        userId: 'user-current',
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
      const members = this.getLocal<FamilyMember[]>('members', []);
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
      const members = this.getLocal<FamilyMember[]>('members', []);
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
      const meds = this.getLocal<Medicine[]>('medicines', []);
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
      const meds = this.getLocal<Medicine[]>('medicines', []);
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        userId: 'user-current',
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
      const meds = this.getLocal<Medicine[]>('medicines', []);
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
      const meds = this.getLocal<Medicine[]>('medicines', []);
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
      const meds = this.getLocal<Medicine[]>('medicines', []);
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
      const user = this.getLocal<User | null>('user', null);
      if (user) {
        user.plan = planId as any;
        user.subscriptionStatus = 'active';
        this.setLocal('user', user);
        return { user, message: 'Plano ativado com sucesso!' };
      }
      throw new Error('Usuário não autenticado');
    }
  }

  // --- BACKUP ---
  async exportBackup(): Promise<any> {
    try {
      return await this.request('/backup/export');
    } catch {
      return {
        user: this.getLocal('user', null),
        members: this.getLocal('members', []),
        medicines: this.getLocal('medicines', []),
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
  async askAi(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<{ answer: string; fromCache?: boolean }> {
    // 1. Check Local Cache first (0ms latency, zero token consumption)
    const cached = aiCache.get(prompt, imageBase64);
    if (cached) {
      console.log(`[AI Cache] Hit for prompt (used ${cached.hits} times) - 0ms response`);
      return { answer: cached.answer, fromCache: true };
    }

    let finalAnswer = '';

    try {
      const data = await this.request<{ answer: string }>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ prompt, imageBase64, imageMimeType }),
      });
      if (data && data.answer) {
        finalAnswer = data.answer;
      }
    } catch (err) {
      // Backend unavailable or running in pure static GitHub Pages:
      console.log('Using smart health knowledge base & local AI engine...');
    }

    // Check if user set a custom Gemini API Key in browser localStorage
    if (!finalAnswer) {
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userApiKey}`,
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
            if (text) finalAnswer = text;
          }
        } catch (geminiErr) {
          console.error('Custom Gemini Key error:', geminiErr);
        }
      }
    }

    // Comprehensive offline / static knowledge engine
    if (!finalAnswer) {
      if (imageBase64) {
        finalAnswer = `📷 **Foto de Receita ou Medicamento Recebida!**

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
      } else {
        finalAnswer = getOfflineHealthAdvice(prompt);
      }
    }

    // Save valid response in Local Cache to prevent future token usage
    if (finalAnswer) {
      aiCache.set(prompt, finalAnswer, imageBase64);
    }

    return { answer: finalAnswer, fromCache: false };
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

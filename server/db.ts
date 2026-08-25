import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, FamilyMember, Medicine, DoseRecord } from '../src/types';

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashedPassword
  members: FamilyMember[];
  medicines: Medicine[];
  history: DoseRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'saas_db.json');

// Initial seed data
const initialUsers: User[] = [
  {
    id: 'user-demo-1',
    name: 'Dra. Camila Santos (Clínica)',
    email: 'camila@exemplo.com',
    role: 'caregiver',
    plan: 'family',
    subscriptionStatus: 'active',
    accountType: 'clinic',
    organizationName: 'Clínica & Cuidados Integrados',
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    maxMeds: 2,
    maxMembers: 1,
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
    createdAt: new Date().toISOString(),
    maxMeds: 999,
    maxMembers: 999,
  }
];

const initialMembers: FamilyMember[] = [
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
  {
    id: 'mem-4',
    userId: 'user-demo-2',
    name: 'Eu (Marcos)',
    emoji: '👨',
    color: '#0f766e',
    relation: 'Titular',
    isDefault: true,
  },
  {
    id: 'mem-5',
    userId: 'user-demo-3',
    name: 'Meu Perfil',
    emoji: '👤',
    color: '#0f766e',
    relation: 'Titular',
    isDefault: true,
  }
];

const todayStr = new Date().toISOString().split('T')[0];

const initialMedicines: Medicine[] = [
  {
    id: 'med-1',
    userId: 'user-demo-1',
    memberId: 'mem-1',
    name: 'Losartana Potássica',
    dosage: '50mg - 1 comprimido',
    quantity: 24,
    unit: 'comprimidos',
    frequencyType: 'daily',
    times: ['08:00', '20:00'],
    startDate: todayStr,
    durationDays: 0,
    notes: 'Tomar pela manhã e à noite com bastante água.',
    doctorName: 'Dr. Roberto Mendes',
    doctorCrm: 'CRM/SP 145890',
    prescriptionDate: todayStr,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    userId: 'user-demo-1',
    memberId: 'mem-2',
    name: 'Metformina',
    dosage: '850mg',
    quantity: 12,
    unit: 'comprimidos',
    frequencyType: 'daily',
    times: ['12:30'],
    startDate: todayStr,
    durationDays: 0,
    notes: 'Tomar junto ao almoço para evitar desconforto.',
    doctorName: 'Dra. Alice Ribeiro',
    doctorCrm: 'CRM/SP 98745',
    prescriptionDate: todayStr,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-3',
    userId: 'user-demo-1',
    memberId: 'mem-3',
    name: 'Amoxicilina + Clavulanato',
    dosage: '250mg/5ml - 5ml',
    quantity: 70,
    unit: 'ml',
    frequencyType: 'interval',
    intervalHours: 8,
    intervalStartTime: '07:00',
    times: ['07:00', '15:00', '23:00'],
    startDate: todayStr,
    durationDays: 7,
    notes: 'Agitar bem o frasco antes de dosar.',
    doctorName: 'Dr. Lucas Pediatra',
    doctorCrm: 'CRM/SP 65432',
    prescriptionDate: todayStr,
    active: true,
    createdAt: new Date().toISOString(),
  }
];

const initialHistory: DoseRecord[] = [
  {
    id: 'hist-1',
    userId: 'user-demo-1',
    medicineId: 'med-1',
    medicineName: 'Losartana Potássica',
    memberId: 'mem-1',
    memberName: 'Eu (Camila)',
    memberEmoji: '👩‍⚕️',
    scheduledTime: '08:00',
    scheduledDate: todayStr,
    status: 'taken',
    takenAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: 'Tomado pontualmente com água'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      passwords: {},
      members: [],
      medicines: [],
      history: []
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);

        // Ensure Ildo Correia de Lima is Admin Master
        const ildoPasswordHash = bcrypt.hashSync('Patty641210', 10);
        const existingIldo = this.data.users.find(u => u.email.toLowerCase() === 'ildocorreia63@gmail.com');
        if (existingIldo) {
          existingIldo.name = 'Ildo Correia de Lima';
          existingIldo.role = 'admin';
          existingIldo.plan = 'family';
          existingIldo.subscriptionStatus = 'active';
          existingIldo.maxMeds = 999;
          existingIldo.maxMembers = 999;
          this.data.passwords[existingIldo.id] = ildoPasswordHash;
        } else {
          const ildoId = 'user-admin-ildo';
          const ildoUser: User = {
            id: ildoId,
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
          this.data.users.push(ildoUser);
          this.data.passwords[ildoId] = ildoPasswordHash;
          this.createMember({
            userId: ildoId,
            name: 'Ildo Correia de Lima',
            emoji: '👑',
            color: '#0f766e',
            relation: 'Administrador Geral',
            isDefault: true
          });
        }

        // Ensure default admin user exists even if db file was previously created
        if (!this.data.users.some(u => u.id === 'user-admin-1')) {
          const defaultHash = bcrypt.hashSync('123456', 10);
          const adminUser: User = {
            id: 'user-admin-1',
            name: 'Administrador SaaS Master',
            email: 'admin@seuremedio.com',
            role: 'admin',
            plan: 'family',
            subscriptionStatus: 'active',
            accountType: 'clinic',
            organizationName: 'Central SaaS SeuRemédio',
            createdAt: new Date().toISOString(),
            maxMeds: 999,
            maxMembers: 999,
          };
          this.data.users.push(adminUser);
          this.data.passwords['user-admin-1'] = defaultHash;
          this.createMember({
            userId: 'user-admin-1',
            name: 'Admin Master',
            emoji: '👑',
            color: '#0f766e',
            relation: 'Administrador',
            isDefault: true
          });
        }
        this.save();
      } else {
        const defaultHash = bcrypt.hashSync('123456', 10);
        const ildoHash = bcrypt.hashSync('Patty641210', 10);
        const ildoUser: User = {
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

        this.data = {
          users: [ildoUser, ...initialUsers],
          passwords: {
            'user-admin-ildo': ildoHash,
            'user-demo-1': defaultHash,
            'user-demo-2': defaultHash,
            'user-demo-3': defaultHash,
            'user-admin-1': defaultHash,
          },
          members: [
            {
              id: 'mem-ildo-1',
              userId: 'user-admin-ildo',
              name: 'Ildo Correia de Lima',
              emoji: '👑',
              color: '#0f766e',
              relation: 'Administrador Geral',
              isDefault: true,
            },
            ...initialMembers
          ],
          medicines: initialMedicines,
          history: initialHistory
        };
        this.save();
      }
    } catch (e) {
      console.error('Error initializing database:', e);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // User methods
  getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.trim().toLowerCase() === clean);
  }

  getUserById(id: string): User | undefined {
    if (!id) return undefined;
    return this.data.users.find(u => u.id === id);
  }

  getUserPassword(userIdOrEmail: string): string | undefined {
    if (!userIdOrEmail) return undefined;
    if (this.data.passwords[userIdOrEmail]) {
      return this.data.passwords[userIdOrEmail];
    }
    const clean = userIdOrEmail.trim().toLowerCase();
    const user = this.data.users.find(u => u.id === userIdOrEmail || u.email.trim().toLowerCase() === clean);
    if (user && this.data.passwords[user.id]) {
      return this.data.passwords[user.id];
    }
    return undefined;
  }

  createUser(
    name: string, 
    email: string, 
    passwordHash: string, 
    plan: User['plan'] = 'free',
    role: User['role'] = 'user',
    accountType: User['accountType'] = 'personal',
    organizationName?: string
  ): User {
    const id = 'usr_' + Math.random().toString(36).substring(2, 9);
    const maxMeds = plan === 'free' ? 2 : 999;
    const maxMembers = plan === 'family' ? 10 : plan === 'pro_monthly' || plan === 'pro_yearly' ? 3 : 1;

    const newUser: User = {
      id,
      name,
      email: email.toLowerCase(),
      role: role || (email.toLowerCase().includes('admin') ? 'admin' : 'user'),
      plan,
      subscriptionStatus: plan === 'free' ? 'none' : 'active',
      accountType: accountType || 'personal',
      organizationName: organizationName || undefined,
      createdAt: new Date().toISOString(),
      maxMeds,
      maxMembers
    };

    this.data.users.push(newUser);
    this.data.passwords[id] = passwordHash;

    // Create default primary member profile
    this.createMember({
      userId: id,
      name: name || 'Meu Perfil',
      emoji: accountType === 'clinic' ? '🏥' : role === 'caregiver' ? '🩺' : '👤',
      color: '#0f766e',
      relation: 'Titular',
      isDefault: true
    });

    this.save();
    return newUser;
  }

  getAllUsers(): User[] {
    return this.data.users;
  }

  getSaasStats() {
    const totalUsers = this.data.users.length;
    const activeSubscriptions = this.data.users.filter(u => u.subscriptionStatus === 'active' && u.plan !== 'free').length;
    const pastDueSubscriptions = this.data.users.filter(u => u.subscriptionStatus === 'past_due').length;
    const canceledSubscriptions = this.data.users.filter(u => u.subscriptionStatus === 'canceled' && u.plan !== 'free').length;
    
    // Calculate approximate MRR (R$)
    let estimatedMrr = 0;
    const planDistribution = {
      free: 0,
      pro_monthly: 0,
      pro_yearly: 0,
      family: 0
    };

    for (const u of this.data.users) {
      if (u.plan === 'free') {
        planDistribution.free++;
      } else if (u.plan === 'pro_monthly') {
        planDistribution.pro_monthly++;
        if (u.subscriptionStatus === 'active') estimatedMrr += 19.90;
      } else if (u.plan === 'pro_yearly') {
        planDistribution.pro_yearly++;
        if (u.subscriptionStatus === 'active') estimatedMrr += 199.90 / 12;
      } else if (u.plan === 'family') {
        planDistribution.family++;
        if (u.subscriptionStatus === 'active') estimatedMrr += 39.90;
      }
    }

    const totalMedicines = this.data.medicines.length;
    const totalDosesRecorded = this.data.history.length;

    const usersList = this.data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      subscriptionStatus: u.subscriptionStatus || (u.plan === 'free' ? 'none' : 'active'),
      createdAt: u.createdAt,
      medicinesCount: this.data.medicines.filter(m => m.userId === u.id).length,
      membersCount: this.data.members.filter(m => m.userId === u.id).length
    }));

    return {
      totalUsers,
      activeSubscriptions,
      pastDueSubscriptions,
      canceledSubscriptions,
      estimatedMrr: Math.round(estimatedMrr * 100) / 100,
      totalMedicines,
      totalDosesRecorded,
      planDistribution,
      usersList
    };
  }

  deleteUserAccount(userId: string): boolean {
    const uIndex = this.data.users.findIndex(u => u.id === userId);
    if (uIndex === -1) return false;
    this.data.users.splice(uIndex, 1);
    delete this.data.passwords[userId];
    this.data.members = this.data.members.filter(m => m.userId !== userId);
    this.data.medicines = this.data.medicines.filter(m => m.userId !== userId);
    this.data.history = this.data.history.filter(h => h.userId !== userId);
    this.save();
    return true;
  }

  getUserFullDetails(userId: string) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    const members = this.data.members.filter(m => m.userId === userId);
    const medicines = this.data.medicines.filter(m => m.userId === userId);
    const history = this.data.history
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.takenAt || b.scheduledDate).getTime() - new Date(a.takenAt || a.scheduledDate).getTime());

    return {
      user,
      members,
      medicines,
      history
    };
  }

  updateUserRole(userId: string, role: User['role']): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    user.role = role;
    this.save();
    return user;
  }

  updateUserPlan(userId: string, plan: User['plan'], stripeCustomerId?: string, stripeSubscriptionId?: string): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    user.plan = plan;
    user.subscriptionStatus = plan === 'free' ? 'canceled' : 'active';
    if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) user.stripeSubscriptionId = stripeSubscriptionId;

    user.maxMeds = plan === 'free' ? 2 : 999;
    user.maxMembers = plan === 'family' ? 10 : plan === 'pro_monthly' || plan === 'pro_yearly' ? 3 : 1;

    this.save();
    return user;
  }

  updateUserSubscriptionStatus(userId: string, subscriptionStatus: User['subscriptionStatus']): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    user.subscriptionStatus = subscriptionStatus;
    this.save();
    return user;
  }

  updateUserProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email.toLowerCase();
    this.save();
    return user;
  }

  // Members
  getMembers(userId: string): FamilyMember[] {
    return this.data.members.filter(m => m.userId === userId);
  }

  createMember(data: Omit<FamilyMember, 'id'>): FamilyMember {
    const id = 'mem_' + Math.random().toString(36).substring(2, 9);
    const newMember: FamilyMember = {
      ...data,
      id
    };
    this.data.members.push(newMember);
    this.save();
    return newMember;
  }

  updateMember(id: string, userId: string, updates: Partial<FamilyMember>): FamilyMember | null {
    const member = this.data.members.find(m => m.id === id && m.userId === userId);
    if (!member) return null;
    Object.assign(member, updates);
    this.save();
    return member;
  }

  deleteMember(id: string, userId: string): boolean {
    const idx = this.data.members.findIndex(m => m.id === id && m.userId === userId);
    if (idx === -1) return false;
    this.data.members.splice(idx, 1);
    // Also remove medicines assigned to member or reassign
    this.data.medicines = this.data.medicines.filter(m => m.memberId !== id);
    this.save();
    return true;
  }

  // Medicines
  getMedicines(userId: string, memberId?: string): Medicine[] {
    return this.data.medicines.filter(m => {
      if (m.userId !== userId) return false;
      if (memberId && memberId !== 'all' && m.memberId !== memberId) return false;
      return true;
    });
  }

  getMedicineById(id: string, userId: string): Medicine | undefined {
    return this.data.medicines.find(m => m.id === id && m.userId === userId);
  }

  createMedicine(data: Omit<Medicine, 'id' | 'createdAt'>): Medicine {
    const id = 'med_' + Math.random().toString(36).substring(2, 9);
    const med: Medicine = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.medicines.push(med);
    this.save();
    return med;
  }

  updateMedicine(id: string, userId: string, updates: Partial<Medicine>): Medicine | null {
    const med = this.data.medicines.find(m => m.id === id && m.userId === userId);
    if (!med) return null;
    Object.assign(med, updates);
    this.save();
    return med;
  }

  deleteMedicine(id: string, userId: string): boolean {
    const idx = this.data.medicines.findIndex(m => m.id === id && m.userId === userId);
    if (idx === -1) return false;
    this.data.medicines.splice(idx, 1);
    this.save();
    return true;
  }

  decrementMedicineStock(id: string, userId: string, amount: number = 1): Medicine | null {
    const med = this.data.medicines.find(m => m.id === id && m.userId === userId);
    if (!med) return null;
    if (typeof med.quantity === 'number') {
      med.quantity = Math.max(0, med.quantity - amount);
      this.save();
    }
    return med;
  }

  // History
  getHistory(userId: string, memberId?: string): DoseRecord[] {
    return this.data.history
      .filter(h => {
        if (h.userId !== userId) return false;
        if (memberId && memberId !== 'all' && h.memberId !== memberId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.takenAt || b.scheduledDate).getTime() - new Date(a.takenAt || a.scheduledDate).getTime());
  }

  recordDose(data: Omit<DoseRecord, 'id'>): DoseRecord {
    const id = 'hist_' + Math.random().toString(36).substring(2, 9);
    const record: DoseRecord = {
      ...data,
      id
    };
    this.data.history.unshift(record);

    // If taken, decrement stock
    if (data.status === 'taken') {
      this.decrementMedicineStock(data.medicineId, data.userId, 1);
    }

    this.save();
    return record;
  }

  clearHistory(userId: string, memberId?: string): boolean {
    if (memberId && memberId !== 'all') {
      this.data.history = this.data.history.filter(h => !(h.userId === userId && h.memberId === memberId));
    } else {
      this.data.history = this.data.history.filter(h => h.userId !== userId);
    }
    this.save();
    return true;
  }

  // Backup & Restore
  exportUserData(userId: string) {
    const user = this.getUserById(userId);
    const members = this.getMembers(userId);
    const medicines = this.getMedicines(userId);
    const history = this.getHistory(userId);
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email, plan: user?.plan },
      members,
      medicines,
      history
    };
  }

  importUserData(userId: string, imported: { members?: FamilyMember[]; medicines?: Medicine[]; history?: DoseRecord[] }) {
    if (Array.isArray(imported.members)) {
      imported.members.forEach(m => {
        if (!this.data.members.some(existing => existing.id === m.id)) {
          this.data.members.push({ ...m, userId });
        }
      });
    }
    if (Array.isArray(imported.medicines)) {
      imported.medicines.forEach(m => {
        if (!this.data.medicines.some(existing => existing.id === m.id)) {
          this.data.medicines.push({ ...m, userId });
        }
      });
    }
    if (Array.isArray(imported.history)) {
      imported.history.forEach(h => {
        if (!this.data.history.some(existing => existing.id === h.id)) {
          this.data.history.push({ ...h, userId });
        }
      });
    }
    this.save();
  }
}

export const db = new Database();

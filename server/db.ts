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
    name: 'Dra. Camila Santos',
    email: 'camila@exemplo.com',
    role: 'user',
    plan: 'family',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString(),
    maxMeds: 999,
    maxMembers: 10,
  },
  {
    id: 'user-demo-2',
    name: 'Marcos Silva',
    email: 'marcos@exemplo.com',
    role: 'user',
    plan: 'pro_monthly',
    subscriptionStatus: 'active',
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
    createdAt: new Date().toISOString(),
    maxMeds: 2,
    maxMembers: 1,
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
      } else {
        const defaultHash = bcrypt.hashSync('123456', 10);
        this.data = {
          users: initialUsers,
          passwords: {
            'user-demo-1': defaultHash,
            'user-demo-2': defaultHash,
            'user-demo-3': defaultHash,
          },
          members: initialMembers,
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
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserPassword(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  createUser(name: string, email: string, passwordHash: string, plan: User['plan'] = 'free'): User {
    const id = 'usr_' + Math.random().toString(36).substring(2, 9);
    const maxMeds = plan === 'free' ? 2 : 999;
    const maxMembers = plan === 'family' ? 10 : plan === 'pro_monthly' || plan === 'pro_yearly' ? 3 : 1;

    const newUser: User = {
      id,
      name,
      email: email.toLowerCase(),
      role: 'user',
      plan,
      subscriptionStatus: plan === 'free' ? 'none' : 'active',
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
      emoji: '👤',
      color: '#0f766e',
      relation: 'Titular',
      isDefault: true
    });

    this.save();
    return newUser;
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

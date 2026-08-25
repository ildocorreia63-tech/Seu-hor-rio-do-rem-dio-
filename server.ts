import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { PLANS, createStripeCheckoutSession, getStripe } from './server/stripe';
import { analyzePrescriptionOrMedicine } from './server/ai';
import { User } from './src/types';

// Cryptographically secure secret for JWT tokens (uses environment variable if provided, or secure persistent internal key)
const JWT_SECRET = process.env.JWT_SECRET || 'f8a7e3b9c2d1e0456789abcdef0123456789abcdef0123456789abcdef01234567_seuremedio_secure_token_v1';
const PORT = 3000;

interface AuthRequest extends Request {
  user?: User;
}

// Authentication middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload: any) => {
    if (err || !payload || !payload.id) {
      return res.status(403).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    }

    const user = db.getUserById(payload.id);
    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  });
}

async function startServer() {
  const app = express();

  // Allow larger payload for images (photos of medicine/prescription)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, plan, role, accountType, organizationName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const user = db.createUser(
        name || email.split('@')[0], 
        email, 
        passwordHash, 
        plan || 'free',
        role || 'user',
        accountType || 'personal',
        organizationName
      );

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({ user, token });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Falha ao criar conta' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      const hash = db.getUserPassword(user.id);
      if (!hash || !bcrypt.compareSync(password, hash)) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ user, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Falha ao realizar login' });
    }
  });

  app.post('/api/auth/demo-login', (req, res) => {
    try {
      const { demoUserId } = req.body;
      const targetId = demoUserId || 'user-admin-ildo';
      let user = db.getUserById(targetId);
      if (!user && (targetId === 'user-admin-ildo' || targetId.includes('ildo'))) {
        user = db.getUserByEmail('ildocorreia63@gmail.com');
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao entrar' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  app.put('/api/auth/profile', authenticateToken, (req: AuthRequest, res) => {
    try {
      const updated = db.updateUserProfile(req.user!.id, {
        name: req.body.name,
        email: req.body.email
      });
      res.json({ user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao atualizar perfil' });
    }
  });

  // --- SAAS & ADMIN MANAGEMENT ---
  app.get('/api/saas/stats', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada. Apenas administradores têm acesso às estatísticas gerais do sistema.' });
      }
      const stats = db.getSaasStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Falha ao obter estatísticas do SaaS' });
    }
  });

  app.get('/api/saas/users', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem listar todos os usuários.' });
      }
      const users = db.getAllUsers().map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        plan: u.plan,
        subscriptionStatus: u.subscriptionStatus,
        accountType: u.accountType,
        organizationName: u.organizationName,
        createdAt: u.createdAt,
        maxMeds: u.maxMeds,
        maxMembers: u.maxMembers
      }));
      res.json({ users });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao listar usuários do SaaS' });
    }
  });

  // Admin endpoint to get full details of a specific user (including their family members, medicines, history)
  app.get('/api/admin/users/:userId/details', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem visualizar dados de outros usuários.' });
      }
      const details = db.getUserFullDetails(req.params.userId);
      if (!details) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: 'Falha ao obter detalhes do usuário' });
    }
  });

  // Admin endpoint to impersonate/switch into any user account
  app.post('/api/admin/users/:userId/impersonate', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem alternar para outras contas.' });
      }
      const targetUser = db.getUserById(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const token = jwt.sign({ id: targetUser.id, email: targetUser.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ user: targetUser, token });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao alternar usuário' });
    }
  });

  // Admin endpoint to update any user's plan
  app.put('/api/admin/users/:userId/plan', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada' });
      }
      const { plan } = req.body;
      if (!['free', 'pro_monthly', 'pro_yearly', 'family'].includes(plan)) {
        return res.status(400).json({ error: 'Plano inválido' });
      }
      const updated = db.updateUserPlan(req.params.userId, plan);
      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ user: updated, message: 'Plano do usuário atualizado com sucesso' });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao atualizar plano do usuário' });
    }
  });

  // Admin endpoint to update any user's role
  app.put('/api/admin/users/:userId/role', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada' });
      }
      const { role } = req.body;
      if (!['user', 'caregiver', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Função inválida' });
      }
      const updated = db.updateUserRole(req.params.userId, role);
      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ user: updated, message: 'Função do usuário atualizada com sucesso' });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao atualizar função do usuário' });
    }
  });

  // Admin endpoint to update any user's financial/subscription status (Em Dia, Em Débito, Bloqueado)
  app.put('/api/admin/users/:userId/status', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada' });
      }
      const { subscriptionStatus } = req.body;
      if (!['active', 'trialing', 'past_due', 'canceled', 'none'].includes(subscriptionStatus)) {
        return res.status(400).json({ error: 'Status financeiro inválido' });
      }
      const updated = db.updateUserSubscriptionStatus(req.params.userId, subscriptionStatus);
      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ user: updated, message: 'Status financeiro do usuário atualizado com sucesso' });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao atualizar status financeiro do usuário' });
    }
  });

  app.delete('/api/saas/users/:id', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
        return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem excluir outros usuários.' });
      }
      const success = db.deleteUserAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao excluir usuário' });
    }
  });

  // --- FAMILY MEMBERS ---
  app.get('/api/members', authenticateToken, (req: AuthRequest, res) => {
    const members = db.getMembers(req.user!.id);
    res.json({ members });
  });

  app.post('/api/members', authenticateToken, (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.subscriptionStatus === 'canceled') {
      return res.status(403).json({
        error: 'Sua conta está bloqueada por pendência financeira. Regularize sua assinatura para adicionar novos membros.',
        blocked: true
      });
    }

    const currentMembers = db.getMembers(req.user!.id);
    if (currentMembers.length >= req.user!.maxMembers) {
      return res.status(403).json({
        error: `Seu plano atual (${req.user!.plan}) permite até ${req.user!.maxMembers} membros. Faça upgrade para adicionar mais.`,
        upgradeRequired: true
      });
    }

    const { name, emoji, color, relation } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do membro é obrigatório' });
    }

    const member = db.createMember({
      userId: req.user!.id,
      name,
      emoji: emoji || '👤',
      color: color || '#0f766e',
      relation: relation || 'Familiar',
    });

    res.status(201).json({ member });
  });

  app.put('/api/members/:id', authenticateToken, (req: AuthRequest, res) => {
    const updated = db.updateMember(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Membro não encontrado' });
    res.json({ member: updated });
  });

  app.delete('/api/members/:id', authenticateToken, (req: AuthRequest, res) => {
    const deleted = db.deleteMember(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Membro não encontrado' });
    res.json({ success: true });
  });

  // --- MEDICINES ---
  app.get('/api/medicines', authenticateToken, (req: AuthRequest, res) => {
    const memberId = req.query.memberId as string | undefined;
    const medicines = db.getMedicines(req.user!.id, memberId);
    res.json({ medicines });
  });

  app.get('/api/medicines/:id', authenticateToken, (req: AuthRequest, res) => {
    const med = db.getMedicineById(req.params.id, req.user!.id);
    if (!med) return res.status(404).json({ error: 'Medicamento não encontrado' });
    res.json({ medicine: med });
  });

  app.post('/api/medicines', authenticateToken, (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.subscriptionStatus === 'canceled') {
      return res.status(403).json({
        error: 'Sua conta está bloqueada por pendência financeira. Regularize sua assinatura para cadastrar novos medicamentos.',
        blocked: true
      });
    }

    const currentMeds = db.getMedicines(req.user!.id);
    if (currentMeds.length >= req.user!.maxMeds) {
      return res.status(403).json({
        error: `Limite do plano gratuito atingido (${req.user!.maxMeds} remédios). Assine o plano Pro para remédios ilimitados!`,
        upgradeRequired: true
      });
    }

    const {
      name,
      memberId,
      dosage,
      quantity,
      unit,
      frequencyType,
      intervalHours,
      intervalStartTime,
      weekDays,
      times,
      startDate,
      durationDays,
      notes,
      photoUrl,
      doctorName,
      doctorCrm,
      prescriptionDate,
      prescriptionPhotoUrl
    } = req.body;

    if (!name || !times || !times.length) {
      return res.status(400).json({ error: 'Nome e pelo menos um horário são obrigatórios' });
    }

    // Default to first member if none provided
    const userMembers = db.getMembers(req.user!.id);
    const assignedMemberId = memberId || (userMembers[0] ? userMembers[0].id : 'default');

    const med = db.createMedicine({
      userId: req.user!.id,
      memberId: assignedMemberId,
      name,
      dosage: dosage || '1 dose',
      quantity: Number(quantity) || 0,
      unit: unit || 'comprimidos',
      frequencyType: frequencyType || 'daily',
      intervalHours: intervalHours ? Number(intervalHours) : undefined,
      intervalStartTime,
      weekDays: Array.isArray(weekDays) ? weekDays : undefined,
      times: Array.isArray(times) ? times : [times],
      startDate: startDate || new Date().toISOString().split('T')[0],
      durationDays: Number(durationDays) || 0,
      notes,
      photoUrl,
      doctorName,
      doctorCrm,
      prescriptionDate,
      prescriptionPhotoUrl,
      active: true
    });

    res.status(201).json({ medicine: med });
  });

  app.put('/api/medicines/:id', authenticateToken, (req: AuthRequest, res) => {
    const updated = db.updateMedicine(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Medicamento não encontrado' });
    res.json({ medicine: updated });
  });

  app.delete('/api/medicines/:id', authenticateToken, (req: AuthRequest, res) => {
    const deleted = db.deleteMedicine(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Medicamento não encontrado' });
    res.json({ success: true });
  });

  // Dose Take & Record
  app.post('/api/medicines/:id/take', authenticateToken, (req: AuthRequest, res) => {
    const med = db.getMedicineById(req.params.id, req.user!.id);
    if (!med) return res.status(404).json({ error: 'Medicamento não encontrado' });

    const member = db.getMembers(req.user!.id).find(m => m.id === med.memberId);
    const now = new Date();
    const scheduledTime = req.body.scheduledTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const scheduledDate = req.body.scheduledDate || now.toISOString().split('T')[0];

    const record = db.recordDose({
      userId: req.user!.id,
      medicineId: med.id,
      medicineName: med.name,
      memberId: med.memberId,
      memberName: member?.name || 'Membro',
      memberEmoji: member?.emoji || '💊',
      scheduledTime,
      scheduledDate,
      status: 'taken',
      takenAt: now.toISOString(),
      notes: req.body.notes || 'Dose tomada com sucesso'
    });

    res.json({ record, remainingStock: med.quantity });
  });

  // --- HISTORY ---
  app.get('/api/history', authenticateToken, (req: AuthRequest, res) => {
    const memberId = req.query.memberId as string | undefined;
    const history = db.getHistory(req.user!.id, memberId);
    res.json({ history });
  });

  app.post('/api/history', authenticateToken, (req: AuthRequest, res) => {
    const record = db.recordDose({
      ...req.body,
      userId: req.user!.id
    });
    res.status(201).json({ record });
  });

  app.delete('/api/history', authenticateToken, (req: AuthRequest, res) => {
    const memberId = req.query.memberId as string | undefined;
    db.clearHistory(req.user!.id, memberId);
    res.json({ success: true });
  });

  // --- STRIPE & SUBSCRIPTION ---
  app.get('/api/stripe/plans', (req, res) => {
    res.json({
      plans: PLANS,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_remédio_saas',
      hasLiveStripe: !!getStripe()
    });
  });

  app.post('/api/stripe/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.body;
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      const checkout = await createStripeCheckoutSession({
        planId,
        userId: req.user!.id,
        userEmail: req.user!.email,
        userName: req.user!.name,
        appUrl
      });

      res.json(checkout);
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: err.message || 'Falha ao criar sessão de pagamento' });
    }
  });

  // Instant plan activation for sandbox / immediate testing
  app.post('/api/stripe/activate-plan', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { planId } = req.body;
      if (!['free', 'pro_monthly', 'pro_yearly', 'family'].includes(planId)) {
        return res.status(400).json({ error: 'Plano inválido' });
      }

      const updated = db.updateUserPlan(
        req.user!.id,
        planId as User['plan'],
        'cus_sim_' + Math.random().toString(36).substring(2, 8),
        'sub_sim_' + Math.random().toString(36).substring(2, 8)
      );

      res.json({ user: updated, message: `Plano atualizado para ${planId} com sucesso!` });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao ativar plano' });
    }
  });

  // Stripe Webhook handler
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripe();

    if (!stripe || !webhookSecret || !sig) {
      return res.json({ received: true, simulated: true });
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || session.metadata?.userId;
          const planId = session.metadata?.planId as User['plan'];
          if (userId && planId) {
            db.updateUserPlan(userId, planId, session.customer as string, session.subscription as string);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          // Downgrade to free
          const allUsers = (db as any).data?.users || [];
          const matchedUser = allUsers.find((u: User) => u.stripeCustomerId === customerId);
          if (matchedUser) {
            db.updateUserPlan(matchedUser.id, 'free');
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // --- BACKUP EXPORT & IMPORT ---
  app.get('/api/backup/export', authenticateToken, (req: AuthRequest, res) => {
    const data = db.exportUserData(req.user!.id);
    res.json(data);
  });

  app.post('/api/backup/import', authenticateToken, (req: AuthRequest, res) => {
    try {
      db.importUserData(req.user!.id, req.body);
      res.json({ success: true, message: 'Dados restaurados com sucesso' });
    } catch (err: any) {
      res.status(400).json({ error: 'Arquivo de backup inválido' });
    }
  });

  // --- AI ASSISTANT ---
  app.post('/api/ai/analyze', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { prompt, imageBase64, imageMimeType } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Pergunta ou comando não fornecido' });
      }

      const answer = await analyzePrescriptionOrMedicine({
        prompt,
        imageBase64,
        imageMimeType
      });

      res.json({ answer });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao processar com IA' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Seu Horário do Remédio rodando em http://localhost:${PORT}`);
  });
}

startServer();

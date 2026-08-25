import React, { useState, useEffect } from 'react';
import { SaasStats, User, Medicine, FamilyMember, DoseRecord } from '../types';
import { api } from '../services/api';
import { 
  X, BarChart3, Users, DollarSign, Pill, CheckCircle2, 
  Trash2, RefreshCw, ShieldCheck, Crown, Zap, Building2, 
  TrendingUp, Activity, UserPlus, Search, Eye, ArrowRightLeft,
  Clock, Calendar, UserCheck, ChevronRight, Edit3, ShieldAlert, AlertTriangle,
  Table as TableIcon, LayoutGrid, Ban, Unlock
} from 'lucide-react';

interface SaasMetricsModalProps {
  user: User | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onImpersonateUser?: (targetUserId: string) => Promise<void>;
  onReloadUserData?: () => void;
}

export const SaasMetricsModal: React.FC<SaasMetricsModalProps> = ({
  user,
  onClose,
  onOpenAuth,
  onImpersonateUser,
  onReloadUserData,
}) => {
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string; medicinesCount?: number; membersCount?: number } | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Detailed User Inspection View
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [inspectedDetails, setInspectedDetails] = useState<{
    user: User;
    members: FamilyMember[];
    medicines: Medicine[];
    history: DoseRecord[];
  } | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Edit Plan / Role state
  const [editingPlanUserId, setEditingPlanUserId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<'free' | 'pro_monthly' | 'pro_yearly' | 'family'>('free');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSaasStats();
      setStats(data);
    } catch (err: any) {
      setError('Falha ao carregar dados do SaaS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleInspectUser = async (targetUserId: string) => {
    setInspectedUserId(targetUserId);
    setInspectLoading(true);
    try {
      const details = await api.getAdminUserDetails(targetUserId);
      setInspectedDetails(details);
    } catch (err: any) {
      alert('Não foi possível carregar os detalhes do usuário.');
      setInspectedUserId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleImpersonate = async (targetUserId: string) => {
    setImpersonatingId(targetUserId);
    try {
      if (onImpersonateUser) {
        await onImpersonateUser(targetUserId);
      } else {
        await api.adminImpersonate(targetUserId);
        if (onReloadUserData) onReloadUserData();
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar para o usuário selecionado.');
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleUpdatePlan = async (targetUserId: string, plan: string) => {
    try {
      await api.adminUpdateUserPlan(targetUserId, plan);
      setEditingPlanUserId(null);
      await loadStats();
      if (inspectedUserId === targetUserId) {
        handleInspectUser(targetUserId);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar o plano.');
    }
  };

  const handleUpdateStatus = async (targetUserId: string, status: string) => {
    try {
      await api.adminUpdateUserStatus(targetUserId, status);
      await loadStats();
      if (inspectedUserId === targetUserId) {
        handleInspectUser(targetUserId);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status financeiro.');
    }
  };

  const handleToggleBlock = async (targetUserId: string, currentStatus: string) => {
    const isCurrentlyBlocked = currentStatus === 'canceled';
    const newStatus = isCurrentlyBlocked ? 'active' : 'canceled';
    const actionLabel = isCurrentlyBlocked ? 'desbloquear e liberar' : 'bloquear por falta de pagamento';
    
    if (confirm(`Deseja realmente ${actionLabel} esta conta?`)) {
      await handleUpdateStatus(targetUserId, newStatus);
    }
  };

  const promptDeleteUser = (u: { id: string; name: string; email: string; medicinesCount?: number; membersCount?: number }) => {
    setUserToDelete(u);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    try {
      await api.deleteSaasUser(userToDelete.id);
      if (inspectedUserId === userToDelete.id) {
        setInspectedUserId(null);
        setInspectedDetails(null);
      }
      setDeleteSuccessMsg(`A conta de "${userToDelete.name}" (${userToDelete.email}) foi excluída permanentemente com todos os remédios e registros.`);
      setUserToDelete(null);
      await loadStats();
      if (onReloadUserData) onReloadUserData();
      setTimeout(() => setDeleteSuccessMsg(null), 4500);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    } finally {
      setDeletingId(null);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'family':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 flex items-center gap-1"><Crown className="w-3 h-3" /> Família VIP</span>;
      case 'pro_monthly':
      case 'pro_yearly':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1"><Zap className="w-3 h-3" /> Pro</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Grátis</span>;
    }
  };

  const getStatusBadge = (status: string, plan: string, role?: string) => {
    if (role === 'admin') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
          👑 ADMIN ISENTO
        </span>
      );
    }

    if (status === 'past_due') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-400 dark:border-amber-700 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> EM DÉBITO
        </span>
      );
    }

    if (status === 'canceled' && plan !== 'free') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-400 dark:border-red-800 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-red-600" /> BLOQUEADO
        </span>
      );
    }

    if (status === 'active' && plan !== 'free') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAGO / EM DIA
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        GRATUITO
      </span>
    );
  };

  // Filter users
  const filteredUsers = (stats?.usersList || []).filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = filterPlan === 'all' || u.plan === filterPlan;
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = u.subscriptionStatus === 'active' && u.plan !== 'free';
    } else if (filterStatus === 'past_due') {
      matchesStatus = u.subscriptionStatus === 'past_due';
    } else if (filterStatus === 'canceled') {
      matchesStatus = u.subscriptionStatus === 'canceled' && u.plan !== 'free';
    } else if (filterStatus === 'free') {
      matchesStatus = u.plan === 'free' || u.subscriptionStatus === 'none';
    }

    return matchesSearch && matchesPlan && matchesRole && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg">
                  Painel de Gestão & Contas do Sistema
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/25 border border-amber-400/50 text-amber-300 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                  👑 ADMIN MASTER
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Logado como: <strong>{user?.name || 'Ildo Correia de Lima'}</strong> ({user?.email || 'ildocorreia63@gmail.com'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-slate-800 transition text-slate-400 hover:text-white"
              title="Recarregar dados do banco"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 transition text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 relative">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {deleteSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{deleteSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setDeleteSuccessMsg(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SaaS Key Metrics Overview */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="text-[10px] font-bold uppercase">Total Contas</span>
                  <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.totalUsers}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {stats.usersList?.length || 0} registradas
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-0.5">
                  <span className="text-[10px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Em Dia (Pagos)
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                  {stats.activeSubscriptions}
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                  Assinantes adimplentes
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 mb-0.5">
                  <span className="text-[10px] font-black uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" /> Em Débito
                  </span>
                </div>
                <div className="text-xl font-black text-amber-900 dark:text-amber-200">
                  {stats.pastDueSubscriptions || 0}
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  Pagamento pendente
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80">
                <div className="flex items-center justify-between text-red-700 dark:text-red-300 mb-0.5">
                  <span className="text-[10px] font-black uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-600" /> Bloqueados
                  </span>
                </div>
                <div className="text-xl font-black text-red-900 dark:text-red-200">
                  {stats.canceledSubscriptions || 0}
                </div>
                <span className="text-[10px] text-red-700 dark:text-red-400 font-bold">
                  Acesso suspenso
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/40 border border-teal-300 dark:border-teal-800">
                <div className="flex items-center justify-between text-teal-800 dark:text-teal-300 mb-0.5">
                  <span className="text-[10px] font-black uppercase">MRR Mensal</span>
                  <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <div className="text-xl font-black text-teal-900 dark:text-teal-100">
                  R$ {stats.estimatedMrr.toFixed(2)}
                </div>
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> Recorrente
                </span>
              </div>
            </div>
          )}

          {/* Search, Filter & Quick Add User Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome ou e-mail de qualquer usuário..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Financial Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="all">💳 Status Financeiro (Todos)</option>
                  <option value="active">🟢 Em Dia (Pagos)</option>
                  <option value="past_due">🟡 Em Débito (Pendentes)</option>
                  <option value="canceled">🔴 Bloqueados (Inadimplentes)</option>
                  <option value="free">⚪ Gratuitos</option>
                </select>

                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="family">Família VIP</option>
                  <option value="pro_monthly">Pro Mensal</option>
                  <option value="free">Gratuito</option>
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="all">Todas Funções</option>
                  <option value="admin">Administradores</option>
                  <option value="caregiver">Cuidadores / Clínicas</option>
                  <option value="user">Usuários Pessoais</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      viewMode === 'table'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Visualizar em Tabela Simples"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabela</span>
                  </button>

                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      viewMode === 'cards'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Visualizar em Modo Cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Criar Conta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inspected User Detail View (Drawer / Sub-card) */}
          {inspectedUserId && (
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-500/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                    🔍 Detalhes e Remédios da Conta Inspecionada
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectedDetails?.user.name}</span>
                    {inspectedDetails?.user.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        ADMIN
                      </span>
                    ) : (
                      getPlanBadge(inspectedDetails?.user.plan || 'free')
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {inspectedDetails?.user.email} • Cadastro em {new Date(inspectedDetails?.user.createdAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleImpersonate(inspectedUserId)}
                    disabled={impersonatingId === inspectedUserId}
                    className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Acessar Painel desta Conta</span>
                  </button>
                  <button
                    onClick={() => {
                      setInspectedUserId(null);
                      setInspectedDetails(null);
                    }}
                    className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {inspectLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Carregando lista de remédios e histórico...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Medicines list */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        Medicamentos Cadastrados ({inspectedDetails?.medicines.length || 0})
                      </span>
                    </h4>
                    {inspectedDetails?.medicines && inspectedDetails.medicines.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {inspectedDetails.medicines.map((m) => (
                          <div key={m.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900 dark:text-white block font-bold">
                                {m.name}
                              </strong>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {m.dosage} • {m.times.join(', ')}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 font-semibold text-teal-800 dark:text-teal-300">
                              Estoque: {m.quantity} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        Nenhum remédio cadastrado por este usuário ainda.
                      </p>
                    )}
                  </div>

                  {/* Family Members list */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      Perfis Familiares / Pacientes ({inspectedDetails?.members.length || 0})
                    </h4>
                    {inspectedDetails?.members && inspectedDetails.members.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {inspectedDetails.members.map((mem) => (
                          <div key={mem.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{mem.emoji || '👤'}</span>
                              <span className="font-bold text-slate-900 dark:text-white">{mem.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {mem.relation || 'Membro'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        Nenhum membro familiar cadastrado.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users List (Table or Cards View) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Tabela de Visualização de Assinaturas ({filteredUsers.length} Usuários)</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Altere o status ou clique em <strong>Bloquear</strong> para suspender o acesso instantaneamente.
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Carregando base de usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                Nenhum usuário encontrado com os filtros aplicados.
              </div>
            ) : viewMode === 'table' ? (
              /* TABULAR VIEW - requested by user */
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-black border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-4">Usuário</th>
                        <th className="py-3 px-3">Plano</th>
                        <th className="py-3 px-3">Status da Assinatura</th>
                        <th className="py-3 px-3 text-center">Uso</th>
                        <th className="py-3 px-3 text-center">Ação Rápida (Bloqueio)</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.map((u) => {
                        const isBlocked = u.subscriptionStatus === 'canceled';
                        const isPastDue = u.subscriptionStatus === 'past_due';
                        const isActive = u.subscriptionStatus === 'active';

                        return (
                          <tr 
                            key={u.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                              u.id === user?.id ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                            } ${isBlocked ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}
                          >
                            {/* User column */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                  u.role === 'admin' 
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {u.role === 'admin' ? '👑' : u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <strong className="font-bold text-slate-900 dark:text-white truncate block max-w-[180px]">
                                      {u.name}
                                    </strong>
                                    {u.id === user?.id && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                                        VOCÊ
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Plan column */}
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1 items-start">
                                {getPlanBadge(u.plan)}
                                {u.role !== 'admin' && (
                                  <select
                                    value={u.plan}
                                    onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer outline-none"
                                    title="Alterar plano"
                                  >
                                    <option value="free">Grátis</option>
                                    <option value="pro_monthly">Pro Mensal</option>
                                    <option value="family">Família VIP</option>
                                  </select>
                                )}
                              </div>
                            </td>

                            {/* Subscription Status column */}
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1 items-start">
                                {getStatusBadge(u.subscriptionStatus, u.plan, u.role)}
                                
                                {u.role !== 'admin' && (
                                  <select
                                    value={u.subscriptionStatus || (u.plan === 'free' ? 'none' : 'active')}
                                    onChange={(e) => handleUpdateStatus(u.id, e.target.value)}
                                    className={`text-[10px] font-black px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                                      isBlocked
                                        ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800'
                                        : isPastDue
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                                        : isActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <option value="active">🟢 Ativo (Em Dia)</option>
                                    <option value="past_due">🟡 Vencido (Em Débito)</option>
                                    <option value="canceled">🔴 Cancelado (Bloqueado)</option>
                                    <option value="none">⚪ Gratuito</option>
                                  </select>
                                )}
                              </div>
                            </td>

                            {/* Usage column */}
                            <td className="py-3 px-3 text-center text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              <div className="font-semibold">
                                {u.medicinesCount} {u.medicinesCount === 1 ? 'remédio' : 'remédios'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {u.membersCount} {u.membersCount === 1 ? 'membro' : 'membros'}
                              </div>
                            </td>

                            {/* Fast 1-Click Block / Unblock Button Column */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {u.id !== user?.id && u.role !== 'admin' ? (
                                <button
                                  onClick={() => handleToggleBlock(u.id, u.subscriptionStatus)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 ${
                                    isBlocked
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                  }`}
                                  title={isBlocked ? 'Desbloquear acesso do usuário' : 'Bloquear usuário e restringir recursos'}
                                >
                                  {isBlocked ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>Desbloquear</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Bloquear</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Isento</span>
                              )}
                            </td>

                            {/* Action Tools */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleInspectUser(u.id)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                                  title="Inspecionar medicamentos desta conta"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {u.id !== user?.id && (
                                  <button
                                    onClick={() => handleImpersonate(u.id)}
                                    disabled={impersonatingId === u.id}
                                    className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 transition border border-teal-200 dark:border-teal-800 cursor-pointer"
                                    title="Acessar conta temporariamente"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {u.id !== user?.id && u.role !== 'admin' && (
                                  <button
                                    onClick={() => promptDeleteUser({ id: u.id, name: u.name, email: u.email, medicinesCount: u.medicinesCount, membersCount: u.membersCount })}
                                    disabled={deletingId === u.id}
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                                    title={`Excluir conta de ${u.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARD VIEW */
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <div 
                    key={u.id}
                    className={`p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition ${
                      u.id === user?.id ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                    } ${u.subscriptionStatus === 'canceled' ? 'bg-red-50/20 dark:bg-red-950/20' : ''}`}
                  >
                    {/* User Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                        u.role === 'admin' 
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {u.role === 'admin' ? '👑' : u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {u.name}
                          </span>
                          {u.id === user?.id && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                              VOCÊ
                            </span>
                          )}
                          {u.role === 'admin' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              ADMIN
                            </span>
                          ) : (
                            <>
                              {getPlanBadge(u.plan)}
                              {getStatusBadge(u.subscriptionStatus, u.plan, u.role)}
                            </>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                          {u.email}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          <span>{u.medicinesCount} remédios</span>
                          <span>•</span>
                          <span>{u.membersCount} membros</span>
                          <span>•</span>
                          <span className="capitalize">{u.role === 'caregiver' ? 'Clínica' : 'Pessoal'}</span>
                          <span>•</span>
                          <span>Criado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions per user */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                      <button
                        onClick={() => handleInspectUser(u.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 text-xs font-bold flex items-center gap-1 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Ver remédios e histórico desta conta"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver Remédios</span>
                      </button>

                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleImpersonate(u.id)}
                          disabled={impersonatingId === u.id}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-1 transition border border-teal-200 dark:border-teal-800 cursor-pointer"
                          title="Entrar temporariamente nesta conta para suporte"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Acessar</span>
                        </button>
                      )}

                      {/* Edit Financial Status Dropdown */}
                      {u.role !== 'admin' && (
                        <div className="relative">
                          <select
                            value={u.subscriptionStatus || (u.plan === 'free' ? 'none' : 'active')}
                            onChange={(e) => handleUpdateStatus(u.id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1.5 rounded-xl border outline-none cursor-pointer transition ${
                              u.subscriptionStatus === 'canceled'
                                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                                : u.subscriptionStatus === 'past_due'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : u.subscriptionStatus === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Alterar status de pagamento/bloqueio"
                          >
                            <option value="active">🟢 Em Dia (Pago)</option>
                            <option value="past_due">🟡 Em Débito (Pendente)</option>
                            <option value="canceled">🔴 Cancelado (Bloquear)</option>
                            <option value="none">⚪ Gratuito</option>
                          </select>
                        </div>
                      )}

                      {/* Quick Block / Unblock 1-Click Button */}
                      {u.id !== user?.id && u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBlock(u.id, u.subscriptionStatus)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition shadow-sm cursor-pointer ${
                            u.subscriptionStatus === 'canceled'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title={u.subscriptionStatus === 'canceled' ? 'Desbloquear acesso do usuário' : 'Bloquear usuário por inadimplência'}
                        >
                          {u.subscriptionStatus === 'canceled' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete button */}
                      {u.id !== user?.id && u.role !== 'admin' && (
                        <button
                          onClick={() => promptDeleteUser({ id: u.id, name: u.name, email: u.email, medicinesCount: u.medicinesCount, membersCount: u.membersCount })}
                          disabled={deletingId === u.id}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition active:scale-95 group cursor-pointer"
                          title={`Excluir permanentemente a conta de ${u.name}`}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {userToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/60 p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Excluir Conta do Assinante
                  </h4>
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Esta ação é irreversível
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{userToDelete.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{userToDelete.email}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Dados associados:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {userToDelete.medicinesCount ?? 0} remédios • {userToDelete.membersCount ?? 0} perfis
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ao confirmar, todos os medicamentos, horários, receitas anexadas e o histórico de doses desta conta serão <strong>permanentemente eliminados</strong> do banco de dados.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {deletingId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sim, Excluir Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Privilégios de Administrador Master Ativos</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};

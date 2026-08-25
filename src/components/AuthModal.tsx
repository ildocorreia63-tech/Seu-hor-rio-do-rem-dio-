import React, { useState, useEffect } from 'react';
import { User, SavedAccount } from '../types';
import { api } from '../services/api';
import { 
  X, User as UserIcon, Lock, Mail, LogIn, UserPlus, LogOut, CheckCircle2, 
  Zap, Eye, EyeOff, Users, Building2, ShieldCheck, ArrowRightLeft, 
  Sparkles, Crown, Trash2, Plus
} from 'lucide-react';

interface AuthModalProps {
  user: User | null;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string, plan?: string, role?: string, accountType?: string, orgName?: string) => Promise<void>;
  onDemoLogin: (demoId: string) => Promise<void>;
  onUpdateProfile: (name: string, email: string) => Promise<void>;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  onClose,
  onLogin,
  onRegister,
  onDemoLogin,
  onUpdateProfile,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'switch' | 'profile'>(user ? 'switch' : 'register');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'family' | 'clinic'>('personal');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro_monthly' | 'family'>('free');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    setSavedAccounts(api.getSavedAccounts());
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (tab === 'register') {
      if (!name.trim()) {
        setErrorMsg('Nome é obrigatório.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem. Verifique e tente novamente.');
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        await onLogin(email.trim().toLowerCase(), password.trim());
        onClose();
      } else if (tab === 'register') {
        if (!name.trim()) throw new Error('Nome é obrigatório');
        const role = accountType === 'clinic' ? 'caregiver' : 'user';
        await onRegister(
          name.trim(), 
          email.trim().toLowerCase(), 
          password.trim(), 
          selectedPlan, 
          role, 
          accountType, 
          accountType === 'clinic' ? organizationName : undefined
        );
        onClose();
      } else if (tab === 'profile') {
        await onUpdateProfile(name.trim(), email.trim().toLowerCase());
        setSuccessMsg('Perfil atualizado com sucesso!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro na operação');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (demoId: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await onDemoLogin(demoId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao entrar como demonstração');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    api.removeSavedAccount(id);
    setSavedAccounts(api.getSavedAccounts());
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-700/90 border border-teal-500/50 flex items-center justify-center text-xl shadow-md shrink-0">
              💊
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2 leading-tight">
                <span className="truncate">Seu Horário do Remédio</span>
                <span className="text-[10px] px-2 py-0.5 bg-teal-700/80 border border-teal-500/40 rounded-full uppercase tracking-wider font-extrabold text-teal-200 shrink-0">
                  Micro-SaaS
                </span>
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-[11px] text-teal-200 truncate">
                  {user ? (
                    <span>
                      Conectado: <strong className="text-white font-bold">{user.name}</strong>
                    </span>
                  ) : (
                    'Acesse sua conta ou cadastre-se no sistema'
                  )}
                </p>
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setTab('login');
                    }}
                    className="text-[10px] px-2 py-0.5 bg-red-500/30 hover:bg-red-500/50 border border-red-400/50 text-red-100 rounded-lg font-bold transition flex items-center gap-1 shrink-0"
                    title="Desconectar da conta atual"
                  >
                    <LogOut className="w-2.5 h-2.5" />
                    <span>Desconectar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch Navigation */}
        <div className={`grid ${user ? 'grid-cols-3' : 'grid-cols-2'} bg-slate-100 dark:bg-slate-800/80 p-1.5 border-b border-slate-200 dark:border-slate-700 text-xs font-bold`}>
          {user && (
            <button
              onClick={() => setTab('switch')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                tab === 'switch' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Minha Conta</span>
            </button>
          )}

          <button
            onClick={() => setTab('register')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'register' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta (Cadastro)</span>
          </button>
          
          <button
            onClick={() => setTab('login')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'login' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Já Tenho Conta (Entrar)</span>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MULTI-TENANT SWITCHER */}
          {tab === 'switch' && (
            <div className="space-y-4">
              {user && (
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                        Conta Atual em Uso
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {user.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                      {user.organizationName && (
                        <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mt-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{user.organizationName}</span>
                        </p>
                      )}
                    </div>
                    <div>{getPlanBadge(user.plan)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-teal-100 dark:border-teal-800/60 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tipo de Perfil:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {user.role === 'admin' ? 'Administrador Master' : user.role === 'caregiver' ? 'Cuidador / Profissional' : 'Usuário / Paciente'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Limite de Perfis:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Até {user.maxMembers} membros
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setTab('login');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar desta Conta</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Saved accounts on this device */}
              {savedAccounts.filter(acc => acc.id !== user?.id).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Outras Contas Salvas neste Dispositivo
                  </h4>
                  <div className="space-y-2">
                    {savedAccounts.filter(acc => acc.id !== user?.id).map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => {
                          if (acc.id === user?.id) return;
                          handleDemo(acc.id);
                        }}
                        className="p-3 rounded-xl border flex items-center justify-between transition cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {acc.name}
                              </span>
                              {getPlanBadge(acc.plan)}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              {acc.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSavedAccount(acc.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition group"
                            title="Remover esta conta da memória deste dispositivo"
                            aria-label={`Remover ${acc.name} deste dispositivo`}
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Isolation & Privacy Certificate Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                      <span>Privacidade & Isolamento Total de Dados</span>
                    </h5>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      Cada assinante possui um ambiente digital 100% isolado. Seus remédios, horários, fotos de receitas e históricos de saúde <strong>são estritamente privados e inacessíveis para qualquer outro assinante</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-600" />
                      Privilégio de Administrador Master
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-black">
                      ACESSO GERAL
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-300">
                    Como Administrador Geral (Ildo Correia de Lima), você gerencia todas as contas e métricas do sistema com visão consolidada.
                  </p>
                </div>
              )}

              {user && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => setTab('register')}
                    className="flex-1 py-2.5 rounded-xl border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Nova Conta</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 3: FORM LOGIN / REGISTER */}
          {(tab === 'login' || tab === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'register' && (
                <>
                  {/* Account Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tipo de Conta Micro-SaaS
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('personal')}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          accountType === 'personal'
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <UserIcon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-[11px] block">Pessoal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('family')}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          accountType === 'family'
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Users className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-[11px] block">Família</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('clinic')}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          accountType === 'clinic'
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-[11px] block">Clínica/Cuidador</span>
                      </button>
                    </div>
                  </div>

                  {accountType === 'clinic' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome da Clínica / Consultório
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Ex: Clínica Saúde Viva"
                          className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Responsável
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo"
                        className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  {tab === 'register' && (
                    <span className="text-[10px] text-slate-400">
                      Mínimo 6 caracteres
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === 'register' ? 'Crie sua senha' : 'Sua senha'}
                    className="w-full pl-9.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua senha"
                      className="w-full pl-9.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {tab === 'login' && user && user.email !== 'ildocorreia63@gmail.com' && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        Conectado atualmente:
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold text-xs truncate block">
                        {user.name}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setTab('login');
                    }}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-red-200 dark:border-red-800 shrink-0"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Desconectar</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {tab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? 'Criando Conta SaaS...' : 'Criar Conta no Micro-SaaS'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

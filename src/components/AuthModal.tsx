import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Lock, Mail, LogIn, UserPlus, LogOut, CheckCircle2, Zap, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  user: User | null;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string) => Promise<void>;
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
  const [tab, setTab] = useState<'login' | 'register' | 'profile'>(user ? 'profile' : 'login');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (tab === 'register') {
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
        await onLogin(email, password);
        onClose();
      } else if (tab === 'register') {
        if (!name.trim()) throw new Error('Nome é obrigatório');
        await onRegister(name, email, password);
        onClose();
      } else if (tab === 'profile') {
        await onUpdateProfile(name, email);
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
    try {
      await onDemoLogin(demoId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao entrar como demonstração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <h2 className="font-bold text-lg">
              {user ? 'Minha Conta' : tab === 'login' ? 'Entrar no Micro-SaaS' : 'Criar Nova Conta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch for guests */}
        {!user && (
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1.5 border-b border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setTab('login')}
              className={`py-2 rounded-xl transition ${
                tab === 'login' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-500'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab('register')}
              className={`py-2 rounded-xl transition ${
                tab === 'register' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-500'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

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

          <form onSubmit={handleSubmit} className="space-y-3">
            {(tab === 'register' || tab === 'profile') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            {tab !== 'profile' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Senha
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {tab === 'register' ? 'Mínimo 6 dígitos' : ''}
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === 'register' ? 'Crie uma senha segura' : 'Sua senha'}
                      className="w-full pl-9.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title={showPassword ? 'Ocultar senha' : 'Ver senha'}
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
                        placeholder="Repita a senha"
                        className="w-full pl-9.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                )}
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
                  <span>{loading ? 'Entrando...' : 'Entrar na Conta'}</span>
                </>
              ) : tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Criando conta...' : 'Criar Conta Grátis'}</span>
                </>
              ) : (
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          {!user && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Ou teste instantâneo (Contas Demo):
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={() => handleDemo('user-demo-1')}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between hover:bg-amber-100 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👩‍⚕️</span>
                    <span>Dra. Camila (Plano Família VIP)</span>
                  </span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </button>

                <button
                  onClick={() => handleDemo('user-demo-2')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between hover:bg-emerald-100 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👨</span>
                    <span>Marcos Silva (Plano Pro Mensal)</span>
                  </span>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                </button>

                <button
                  onClick={() => handleDemo('user-demo-3')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Novo Usuário (Plano Gratuito)</span>
                  </span>
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* User logout button */}
          {user && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

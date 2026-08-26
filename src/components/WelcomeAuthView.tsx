import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
import { 
  Pill, 
  Sparkles, 
  Bell, 
  Users, 
  Smartphone, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Crown,
  HeartHandshake,
  Volume2
} from 'lucide-react';

interface WelcomeAuthViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (
    name: string, 
    email: string, 
    pass: string, 
    plan?: string, 
    role?: string, 
    accountType?: string, 
    orgName?: string
  ) => Promise<void>;
  onDemoLogin?: (demoId: string) => Promise<void>;
  onOpenPricing?: () => void;
}

export const WelcomeAuthView: React.FC<WelcomeAuthViewProps> = ({
  onLogin,
  onRegister,
  onDemoLogin,
  onOpenPricing,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'family' | 'clinic'>('personal');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (tab === 'register') {
      if (!name.trim()) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Por favor, informe seu e-mail.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMsg('Preencha seu e-mail e senha.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'register') {
        const role = accountType === 'clinic' ? 'caregiver' : 'user';
        await onRegister(
          name.trim(), 
          email.trim().toLowerCase(), 
          password.trim(), 
          'free', 
          role, 
          accountType
        );
      } else {
        await onLogin(email.trim().toLowerCase(), password.trim());
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (tab === 'register' && (msg.toLowerCase().includes('já cadastrado') || msg.toLowerCase().includes('already exists') || email.trim().toLowerCase() === 'ildocorreia63@gmail.com')) {
        setTab('login');
        setInfoMsg('Essa conta já existe! Digite sua senha para entrar.');
      } else {
        setErrorMsg(msg || 'Erro ao processar. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Hero Presentation Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 text-white p-6 sm:p-8 shadow-2xl border border-teal-700/50">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <AppLogo size="xl" className="shadow-2xl hover:scale-105 transition-transform" />
          
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Aplicativo Oficial de Saúde
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Seu Horário do Remédio
            </h2>
            <p className="text-sm text-teal-100/90 max-w-md mx-auto mt-2 leading-relaxed">
              O aplicativo inteligente que avisa a hora exata de tomar seus remédios com alarme em tela cheia, som alto e voz em português!
            </p>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Authentication & Registration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
        
        {/* Tab Selector */}
        <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 border-b border-slate-200 dark:border-slate-700 text-sm font-black">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`py-3 rounded-2xl transition flex items-center justify-center gap-2 ${
              tab === 'register'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Criar Minha Conta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-3 rounded-2xl transition flex items-center justify-center gap-2 ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Já Tenho Conta (Entrar)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria da Silva"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Profile Type Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Como você vai usar o aplicativo?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('personal')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      accountType === 'personal'
                        ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      👤 Pessoal / Familiar
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Para mim, meus pais, filhos e familiares
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('clinic')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      accountType === 'clinic'
                        ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      🩺 Cuidador / Clínica
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Para pacientes, asilos ou clínica médica
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Seu E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Senha {tab === 'register' && <span className="text-slate-400 text-[10px] font-normal">(mínimo 6 dígitos)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-base shadow-xl shadow-teal-700/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : tab === 'register' ? (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Criar Minha Conta Grátis 🚀</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar no Aplicativo 🔐</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2">
            <Volume2 className="w-5 h-5" />
          </div>
          <strong className="text-xs font-black block text-slate-900 dark:text-white">Alarme com Voz</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Som alto e síntese de voz em português</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Smartphone className="w-5 h-5" />
          </div>
          <strong className="text-xs font-black block text-slate-900 dark:text-white">Instale no Celular</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Funciona como aplicativo nativo</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <strong className="text-xs font-black block text-slate-900 dark:text-white">Leitor IA de Receitas</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Tire foto da receita e cadastre automático</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5" />
          </div>
          <strong className="text-xs font-black block text-slate-900 dark:text-white">Toda a Família</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Perfis para pais, filhos e idosos</span>
        </div>
      </div>

    </div>
  );
};

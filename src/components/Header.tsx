import React, { useState, useRef, useEffect } from 'react';
import { User, FamilyMember } from '../types';
import { audio } from '../services/audio';
import { 
  Sparkles, 
  Settings, 
  Smartphone, 
  Stethoscope, 
  User as UserIcon, 
  Crown, 
  Share2, 
  LogOut, 
  ChevronDown,
  X,
  CreditCard,
  Type,
  Volume2,
  ArrowRightLeft,
  BarChart3,
  Users
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  onOpenApk: () => void;
  onOpenAi: () => void;
  onOpenShareLanding?: () => void;
  onOpenSaasMetrics?: () => void;
  onLogout?: () => void;
  fontSize?: 'normal' | 'large' | 'extra-large';
  onToggleFontSize?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  members,
  selectedMemberId,
  onSelectMember,
  onOpenSettings,
  onOpenPricing,
  onOpenAuth,
  onOpenApk,
  onOpenAi,
  onOpenShareLanding,
  onOpenSaasMetrics,
  onLogout,
  fontSize = 'large',
  onToggleFontSize,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const getPlanBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') {
      return (
        <button
          onClick={onOpenSaasMetrics || onOpenPricing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/30 text-amber-300 border border-amber-400/70 rounded-full text-xs font-black hover:bg-amber-400/40 transition shadow-sm shrink-0"
          title="Administrador Master do SaaS"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>ADMIN MASTER</span>
        </button>
      );
    }
    switch (user.plan) {
      case 'family':
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/25 text-amber-300 border border-amber-400/60 rounded-full text-xs font-black hover:bg-amber-400/35 transition shadow-sm shrink-0"
            title="Plano Família VIP Ativo"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>FAMÍLIA</span>
          </button>
        );
      case 'pro_monthly':
      case 'pro_yearly':
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/25 text-emerald-300 border border-emerald-400/60 rounded-full text-xs font-black hover:bg-emerald-400/35 transition shadow-sm shrink-0"
            title="Plano Pro Ativo"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>PRO</span>
          </button>
        );
      default:
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/80 text-slate-200 border border-slate-600 rounded-full text-xs font-bold hover:bg-slate-700 transition shrink-0"
            title="Clique para assinar o Pro"
          >
            <span>GRÁTIS</span>
            <span className="text-teal-300 font-extrabold ml-0.5 hidden xs:inline">Upgrade</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-lg border-b border-teal-950/60">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left">
          <button
            type="button"
            onClick={onOpenShareLanding}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer group focus:outline-none"
            title="Clique para abrir o Painel de Logomarca e Divulgação"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-0.5 border border-teal-200/40 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 group-active:scale-95 transition-transform overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Seu Horário do Remédio" 
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-lg tracking-tight leading-tight whitespace-nowrap group-hover:text-teal-200 transition-colors">
                Seu Horário
              </h1>
              <p className="text-xs sm:text-sm text-teal-200 font-semibold truncate leading-tight mt-0.5">
                {user ? `Olá, ${user.name.split(' ')[0]}` : 'Lembrete Inteligente'}
              </p>
            </div>
          </button>

          {getPlanBadge()}
        </div>

        {/* Action icons & User Menu */}
        <div className="flex items-center gap-2 shrink-0" ref={menuRef}>
          {/* Quick Font Size Zoom Button for Seniors */}
          {onToggleFontSize && (
            <button
              onClick={onToggleFontSize}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-800/90 hover:bg-teal-700 text-teal-100 transition border border-teal-600/70 flex items-center gap-1 text-xs sm:text-sm font-extrabold active:scale-95 shadow-sm"
              title="Aumentar / Ajustar tamanho da letra para idosos"
              aria-label="Tamanho da Letra"
            >
              <Type className="w-4 h-4 text-teal-300" />
              <span className="hidden sm:inline">
                {fontSize === 'extra-large' ? 'Letra G+' : fontSize === 'large' ? 'Letra G' : 'Letra M'}
              </span>
            </button>
          )}

          {/* Share & Landing Page Button */}
          {onOpenShareLanding && (
            <button
              onClick={onOpenShareLanding}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition border border-emerald-400/50 flex items-center gap-1.5 text-xs sm:text-sm font-black shadow-sm active:scale-95"
              title="Divulgar App no WhatsApp & Landing Page"
              aria-label="Divulgar App"
            >
              <Share2 className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">Divulgar</span>
            </button>
          )}

          {/* AI Helper button */}
          <button
            onClick={onOpenAi}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-teal-800/90 hover:bg-teal-700 text-teal-100 transition border border-teal-600/70 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold active:scale-95 shadow-sm"
            title="Assistente IA de Receitas e Bulas"
            aria-label="Assistente IA"
          >
            <Stethoscope className="w-4 h-4 text-teal-300" />
            <span className="hidden sm:inline">IA Saúde</span>
          </button>

          {/* Quick User Avatar / Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 border active:scale-95 ${
                menuOpen
                  ? 'bg-teal-700 text-white border-teal-400 ring-2 ring-teal-400/40'
                  : 'bg-teal-800/90 hover:bg-teal-700 text-teal-100 border-teal-600/70'
              }`}
              title="Menu do Usuário e Opções"
              aria-label="Menu do Usuário"
            >
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs font-black text-white uppercase shadow-inner">
                {user ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <ChevronDown className={`w-4 h-4 text-teal-300 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover with Large Fonts */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-teal-600/40 overflow-hidden z-50 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white border-b border-teal-950/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow">
                      {user ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-sm block font-extrabold truncate">
                        {user ? user.name : 'Visitante'}
                      </strong>
                      <span className="text-xs text-teal-200 block truncate">
                        {user ? user.email : 'Sem login'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items with Large, Clear Touch Targets */}
                <div className="p-2.5 space-y-1 text-sm">
                  {onOpenShareLanding && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenShareLanding();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-left bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-black flex items-center justify-between transition text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/70"
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Painel de Logomarca & Divulgação</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-extrabold uppercase">
                        MARCA
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 font-bold flex items-center justify-between transition text-teal-900 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <span>Trocar Usuário / Login</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 font-extrabold uppercase">
                      SaaS
                    </span>
                  </button>

                  {user?.role === 'admin' && onOpenSaasMetrics && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSaasMetrics();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-left bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold flex items-center justify-between transition text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <span>Ver & Gerenciar Todas as Contas</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-extrabold uppercase">
                        ADMIN
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-3 transition"
                  >
                    <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span>Minha Conta & Perfil</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span>Planos & Assinatura</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 font-black uppercase">
                      {user?.plan === 'family' ? 'Família' : user?.plan?.includes('pro') ? 'Pro' : 'Grátis'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenApk();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-3 transition"
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Instalar no Celular / APK</span>
                  </button>

                  <button
                    onClick={() => {
                      audio.unlockAudio();
                      audio.testSound('standard', 100, true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-between transition"
                    title="Tocar som de alarme alto para testar seu celular ou computador"
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <span>Testar Som do Alarme</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 font-black text-teal-700 dark:text-teal-300">
                      TOCAR 🔊
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-3 transition"
                  >
                    <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span>Ajustes & Tamanho da Letra</span>
                  </button>

                  {user && onLogout && (
                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3.5 py-2.5 rounded-2xl text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-black flex items-center gap-3 transition"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


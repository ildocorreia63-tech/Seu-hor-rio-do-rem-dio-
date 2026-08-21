import React, { useState, useRef, useEffect } from 'react';
import { User, FamilyMember } from '../types';
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
  CreditCard
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
  onLogout?: () => void;
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
  onLogout,
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
    switch (user.plan) {
      case 'family':
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/50 rounded-full text-[10px] sm:text-xs font-black hover:bg-amber-400/30 transition shadow-sm shrink-0"
            title="Plano Família VIP Ativo"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>FAMÍLIA</span>
          </button>
        );
      case 'pro_monthly':
      case 'pro_yearly':
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 rounded-full text-[10px] sm:text-xs font-black hover:bg-emerald-400/30 transition shadow-sm shrink-0"
            title="Plano Pro Ativo"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>PRO</span>
          </button>
        );
      default:
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-slate-700/60 text-slate-300 border border-slate-600 rounded-full text-[10px] sm:text-xs font-medium hover:bg-slate-700 transition shrink-0"
            title="Clique para assinar o Pro"
          >
            <span>GRÁTIS</span>
            <span className="text-teal-400 font-bold ml-0.5 hidden xs:inline">Upgrade</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-md border-b border-teal-950/50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 border border-teal-300/30 flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0">
            💊
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h1 className="font-black text-sm sm:text-base tracking-tight leading-tight whitespace-nowrap">
                Seu Horário
              </h1>
              {getPlanBadge()}
            </div>
            <p className="text-[11px] text-teal-200/90 truncate leading-tight mt-0.5">
              {user ? `Olá, ${user.name.split(' ')[0]}` : 'Lembrete Inteligente'}
            </p>
          </div>
        </div>

        {/* Action icons & User Menu */}
        <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
          {/* Share & Landing Page Button */}
          {onOpenShareLanding && (
            <button
              onClick={onOpenShareLanding}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition border border-emerald-400/40 flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
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
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-100 transition border border-teal-600/60 flex items-center gap-1.5 text-xs font-bold active:scale-95"
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
              className={`p-2 rounded-xl transition flex items-center gap-1 border active:scale-95 ${
                menuOpen
                  ? 'bg-teal-700 text-white border-teal-400 ring-2 ring-teal-400/30'
                  : 'bg-teal-800/80 hover:bg-teal-700 text-teal-100 border-teal-600/60'
              }`}
              title="Menu do Usuário e Opções"
              aria-label="Menu do Usuário"
            >
              <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner">
                {user ? user.name.charAt(0) : <UserIcon className="w-3 h-3" />}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-teal-300 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Elegant Dropdown Popover */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-3.5 bg-gradient-to-r from-teal-800 to-teal-900 text-white border-b border-teal-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
                        {user ? user.name.charAt(0).toUpperCase() : '👤'}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs block font-bold truncate">
                          {user ? user.name : 'Visitante'}
                        </strong>
                        <span className="text-[10px] text-teal-200 block truncate">
                          {user ? user.email : 'Sem login'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-2.5 transition"
                  >
                    <UserIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Minha Conta & Senha</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Planos & Assinatura</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 font-bold uppercase">
                      {user?.plan === 'family' ? 'Família' : user?.plan?.includes('pro') ? 'Pro' : 'Grátis'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenApk();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-2.5 transition"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Instalar no Celular / Gerar APK</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-2.5 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Ajustes do Aplicativo</span>
                  </button>

                  {user && onLogout && (
                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold flex items-center gap-2.5 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta (Voltar ao Login)</span>
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


import React from 'react';
import { User, FamilyMember } from '../types';
import { Sparkles, Settings, Smartphone, Stethoscope, User as UserIcon, Crown, Share2, LogOut } from 'lucide-react';

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
  const getPlanBadge = () => {
    if (!user) return null;
    switch (user.plan) {
      case 'family':
        return (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-semibold hover:bg-amber-500/30 transition shadow-sm"
            title="Plano Família VIP"
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
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold hover:bg-emerald-500/30 transition shadow-sm"
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
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-700/60 text-slate-300 border border-slate-600 rounded-full text-xs font-medium hover:bg-slate-700 transition"
            title="Clique para assinar o Pro"
          >
            <span>GRÁTIS</span>
            <span className="text-teal-400 font-bold ml-0.5">Upgrade</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-teal-800 text-white shadow-md border-b border-teal-900/40">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-600/80 border border-teal-400/40 flex items-center justify-center text-xl shadow-inner shrink-0">
            💊
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base tracking-tight truncate leading-tight">
                Seu Horário do Remédio
              </h1>
              {getPlanBadge()}
            </div>
            <p className="text-[11px] text-teal-200/80 truncate">
              {user ? `Olá, ${user.name.split(' ')[0]}` : 'Lembrete Inteligente'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Share & Landing Page Button */}
          {onOpenShareLanding && (
            <button
              onClick={onOpenShareLanding}
              className="p-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition border border-emerald-500/50 flex items-center gap-1 text-xs font-bold shadow-sm"
              title="Divulgar App no WhatsApp & Landing Page"
              aria-label="Divulgar App"
            >
              <Share2 className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">Divulgar</span>
            </button>
          )}

          {/* AI Helper button */}
          <button
            onClick={onOpenAi}
            className="p-2 rounded-lg bg-teal-700/60 hover:bg-teal-700 text-teal-100 transition border border-teal-600/50 flex items-center gap-1 text-xs font-medium"
            title="Assistente IA de Receitas e Bulas"
            aria-label="Assistente IA"
          >
            <Stethoscope className="w-4 h-4 text-teal-300" />
            <span className="hidden sm:inline">IA Saúde</span>
          </button>

          {/* APK / PWA download button */}
          <button
            onClick={onOpenApk}
            className="p-2 rounded-lg bg-teal-700/60 hover:bg-teal-700 text-teal-100 transition border border-teal-600/50 flex items-center gap-1 text-xs font-medium"
            title="Instalar no Celular / Gerar APK"
            aria-label="Gerar APK"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">APK</span>
          </button>

          {/* User / Profile button */}
          <button
            onClick={onOpenAuth}
            className="p-2 rounded-lg bg-teal-700/60 hover:bg-teal-700 text-teal-100 transition border border-teal-600/50"
            title="Conta & Usuários"
            aria-label="Minha Conta"
          >
            <UserIcon className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-teal-700/60 hover:bg-teal-700 text-teal-100 transition border border-teal-600/50"
            title="Configurações"
            aria-label="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout button */}
          {user && onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-200 transition border border-red-700/50"
              title="Sair da Conta"
              aria-label="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

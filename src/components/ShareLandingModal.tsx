import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Smartphone, 
  MessageCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Users, 
  Volume2, 
  Download, 
  HeartHandshake,
  Star,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareLandingModalProps {
  onClose: () => void;
  onOpenApk: () => void;
  onOpenPricing: () => void;
}

export const ShareLandingModal: React.FC<ShareLandingModalProps> = ({
  onClose,
  onOpenApk,
  onOpenPricing,
}) => {
  const [copied, setCopied] = useState(false);
  const [customMsgType, setCustomMsgType] = useState<'app' | 'apk' | 'family'>('app');

  // Generate dynamic share link based on current window location
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seuremedio.app';

  const shareTemplates = {
    app: {
      title: '💊 Divulgação Geral do App',
      text: `💊 *Seu Horário do Remédio* - O Aplicativo Completo para Nunca Mais Esquecer seus Medicamentos!\n\n✅ Alarme inteligente em tela cheia com áudio e voz em Português\n✅ Controle de doses, estoque e histórico completo\n✅ Leitor de receitas médicas por Inteligência Artificial\n✅ Suporte para toda a família (idosos, filhos e dependentes)\n\n📲 *Acesse e teste grátis agora mesmo:* \n${appUrl}`,
    },
    apk: {
      title: '📲 Baixar Aplicativo Android (.APK)',
      text: `📱 *Instale o App Seu Horário do Remédio no seu Celular!*\n\nTransforme em aplicativo nativo no seu Android ou iPhone com alarmes offline e ícone na tela inicial!\n\n👇 *Toque no link abaixo para baixar e instalar direto:* \n${appUrl}`,
    },
    family: {
      title: '👨‍👩‍👧‍👦 Cuidado Familiar & Idosos',
      text: `❤️ *Cuidado com quem você ama!*\n\nCom o *Seu Horário do Remédio*, você gerencia os medicamentos dos seus pais, filhos e familiares em um único lugar, com relatórios para consultas médicas.\n\nExperimente grátis: \n${appUrl}`,
    },
  };

  const currentTemplate = shareTemplates[customMsgType];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentTemplate.text);
      setCopied(true);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  };

  const handleShareWhatsapp = () => {
    const encoded = encodeURIComponent(currentTemplate.text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        
        {/* Header Hero */}
        <div className="px-6 py-5 bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-black uppercase tracking-wider mb-2">
              <Share2 className="w-3.5 h-3.5" /> Landing Page & Divulgação
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              Divulgue o App & Ofereça o APK
            </h2>
            <p className="text-xs text-teal-200/90 mt-1">
              Envie convites prontos pelo WhatsApp ou redes sociais para amigos, pacientes e familiares.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-teal-200 hover:text-white relative z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Mini Landing Page Preview Cards */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Destaques do Aplicativo (Pronto para Clientes)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-center">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                  <Bell className="w-4 h-4" />
                </div>
                <strong className="text-xs block text-slate-800 dark:text-slate-100">Alarme c/ Som & Voz</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Tela cheia e síntese PT-BR</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                  <Smartphone className="w-4 h-4" />
                </div>
                <strong className="text-xs block text-slate-800 dark:text-slate-100">App APK & PWA</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Instalação direta no celular</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-center">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <strong className="text-xs block text-slate-800 dark:text-slate-100">IA Lê Receitas</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Fotos de bulas e horários</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-center">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                  <Users className="w-4 h-4" />
                </div>
                <strong className="text-xs block text-slate-800 dark:text-slate-100">Modo Família</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Idosos, filhos e pets</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Share Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Enviar Mensagem de Divulgação pelo WhatsApp
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Escolha o modelo de texto pronto e compartilhe em 1 toque
                  </p>
                </div>
              </div>
            </div>

            {/* Template selector buttons */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                onClick={() => setCustomMsgType('app')}
                className={`py-2 px-2 rounded-xl transition ${
                  customMsgType === 'app'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                💊 Geral do App
              </button>
              <button
                onClick={() => setCustomMsgType('apk')}
                className={`py-2 px-2 rounded-xl transition ${
                  customMsgType === 'apk'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                📲 Oferecer APK
              </button>
              <button
                onClick={() => setCustomMsgType('family')}
                className={`py-2 px-2 rounded-xl transition ${
                  customMsgType === 'family'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                👨‍👩‍👧 Familiar/Idosos
              </button>
            </div>

            {/* Message preview area */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
              {currentTemplate.text}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleShareWhatsapp}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Mensagem Copiada! ✓' : 'Copiar Texto Completo'}</span>
              </button>
            </div>
          </div>

          {/* Quick shortcuts for user navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenApk();
              }}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  Gerador de APK (.apk)
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compilar e baixar arquivo para Android
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Página de Planos & Preços
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ver valores Pro e Família VIP no Stripe
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

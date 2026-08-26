import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
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
  ExternalLink,
  QrCode,
  LogOut,
  Layers,
  Award,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareLandingModalProps {
  onClose: () => void;
  onOpenApk: () => void;
  onOpenPricing: () => void;
  onLogout?: () => void;
}

export const ShareLandingModal: React.FC<ShareLandingModalProps> = ({
  onClose,
  onOpenApk,
  onOpenPricing,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customMsgType, setCustomMsgType] = useState<'app' | 'apk' | 'family'>('app');
  const [activeTab, setActiveTab] = useState<'brand' | 'whatsapp' | 'qrcode'>('brand');

  // Dynamic share link with ?landing=1 so anyone opening it sees the landing presentation
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seuremedio.app';
  const landingUrl = `${origin}/?landing=1`;

  const shareTemplates = {
    app: {
      title: '💊 Divulgação Geral do App',
      text: `💊 *Seu Horário do Remédio* - O Aplicativo Completo para Nunca Mais Esquecer seus Medicamentos!\n\n✅ Alarme inteligente em tela cheia com áudio e voz em Português\n✅ Controle de doses, estoque e histórico completo\n✅ Leitor de receitas médicas por Inteligência Artificial\n✅ Suporte para toda a família (idosos, filhos e dependentes)\n\n📲 *Acesse e teste grátis agora mesmo:* \n${landingUrl}`,
    },
    apk: {
      title: '📲 Baixar Aplicativo Android (.APK)',
      text: `📱 *Instale o App Seu Horário do Remédio no seu Celular!*\n\nTransforme em aplicativo nativo no seu Android ou iPhone com alarmes offline e ícone na tela inicial!\n\n👇 *Toque no link abaixo para baixar e instalar direto:* \n${landingUrl}`,
    },
    family: {
      title: '👨‍👩‍👧‍👦 Cuidado Familiar & Idosos',
      text: `❤️ *Cuidado com quem você ama!*\n\nCom o *Seu Horário do Remédio*, você gerencia os medicamentos dos seus pais, filhos e familiares em um único lugar, com relatórios para consultas médicas.\n\nExperimente grátis: \n${landingUrl}`,
    },
  };

  const currentTemplate = shareTemplates[customMsgType];

  const handleCopyLinkOnly = async () => {
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopiedLink(true);
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      } catch {}
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      alert('Link copiado: ' + landingUrl);
    }
  };

  const handleCopyFullText = async () => {
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

  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(landingUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col max-h-[92vh]">
        
        {/* Header Hero */}
        <div className="px-6 py-5 bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" /> Painel de Logomarca & Divulgação
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-tight flex items-center gap-2">
              <span>Seu Horário do Remédio</span>
            </h2>
            <p className="text-xs text-teal-200/90 mt-1">
              Painel oficial com identidade visual, links de compartilhamento e QR Code.
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 pt-2 gap-2 text-xs font-black shrink-0">
          <button
            onClick={() => setActiveTab('brand')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'brand'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Identidade & Logomarca</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'whatsapp'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartilhar WhatsApp</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'qrcode'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code Celular</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: IDENTIDADE E LOGOMARCA */}
          {activeTab === 'brand' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Brand Showcase Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <AppLogo size="xl" className="border-2 border-white/60 shadow-2xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider inline-block">
                    Marca Oficial do Aplicativo
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Seu Horário do Remédio
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed">
                    A plataforma inteligente para controle de medicamentos, alarmes com voz em português e saúde da família.
                  </p>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 block">
                  Link de Acesso para Novos Usuários & Celulares:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={landingUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  />
                  <button
                    onClick={handleCopyLinkOnly}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow transition active:scale-95 shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Recursos em Destaque da Apresentação
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-center">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                      <Bell className="w-4 h-4" />
                    </div>
                    <strong className="text-xs block text-slate-800 dark:text-slate-100">Alarme c/ Voz</strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Tela cheia e som alto</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <strong className="text-xs block text-slate-800 dark:text-slate-100">App APK & PWA</strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Direto no celular</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-center">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <strong className="text-xs block text-slate-800 dark:text-slate-100">IA Lê Receitas</strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Bulas e dosagens</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-center">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <strong className="text-xs block text-slate-800 dark:text-slate-100">Família & Idosos</strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Controle unificado</span>
                  </div>
                </div>
              </div>

              {/* Action: Test visitor mode */}
              {onLogout && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <strong className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-amber-600" />
                      Testar Tela de Boas-Vindas Inicial (Modo Visitante)
                    </strong>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Desconecta a sessão atual neste aparelho para ver como um novo paciente ou cliente visualiza a tela inicial.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 shadow-sm transition active:scale-95"
                  >
                    Ver Como Visitante
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHATSAPP SHARING */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Mensagem de Divulgação Pronta para o WhatsApp
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selecione o estilo da mensagem e compartilhe com contatos ou grupos.
                  </p>
                </div>
              </div>

              {/* Template selector buttons */}
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setCustomMsgType('app')}
                  className={`py-2 px-2 rounded-xl transition ${
                    customMsgType === 'app'
                      ? 'bg-teal-600 text-white shadow-sm font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  💊 Geral do App
                </button>
                <button
                  onClick={() => setCustomMsgType('apk')}
                  className={`py-2 px-2 rounded-xl transition ${
                    customMsgType === 'apk'
                      ? 'bg-teal-600 text-white shadow-sm font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📲 Oferecer APK
                </button>
                <button
                  onClick={() => setCustomMsgType('family')}
                  className={`py-2 px-2 rounded-xl transition ${
                    customMsgType === 'family'
                      ? 'bg-teal-600 text-white shadow-sm font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  👨‍👩‍👧 Familiar/Idosos
                </button>
              </div>

              {/* Message preview area */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto shadow-inner">
                {currentTemplate.text}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleShareWhatsapp}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Abrir WhatsApp & Enviar</span>
                </button>

                <button
                  onClick={handleCopyFullText}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Mensagem Copiada! ✓' : 'Copiar Texto Completo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE PARA TESTAR NO CELULAR */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 text-center animate-in fade-in duration-150 py-2">
              <div className="max-w-sm mx-auto p-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-teal-500/30 shadow-xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Aponte a Câmera do Outro Celular
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Abra o aplicativo em qualquer celular sem precisar digitar o link.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl inline-block shadow-md border border-slate-200">
                  <img
                    src={qrCodeImgUrl}
                    alt="QR Code de Divulgação"
                    className="w-48 h-48 mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all px-2">
                  {landingUrl}
                </div>
              </div>
            </div>
          )}

          {/* Quick shortcuts for user navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenApk();
              }}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition flex items-center justify-between cursor-pointer"
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
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition flex items-center justify-between cursor-pointer"
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
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleShareWhatsapp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartilhar WhatsApp</span>
          </button>

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


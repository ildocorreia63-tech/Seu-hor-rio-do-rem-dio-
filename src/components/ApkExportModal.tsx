import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, CheckCircle, ExternalLink, ShieldCheck, Play, Layers } from 'lucide-react';

interface ApkExportModalProps {
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'pwabuilder' | 'capacitor'>('pwa');

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar no Android/iOS: toque no botão de Compartilhar/Menu do navegador (⋮) e selecione "Instalar Aplicativo" ou "Adicionar à Tela Inicial".');
    }
  };

  const handleDownloadManifest = () => {
    const manifest = {
      name: "Seu Horário do Remédio - Micro SaaS",
      short_name: "Meu Remédio",
      description: "Lembrete inteligente de medicamentos com alarme em tela cheia e controle familiar",
      start_url: "/",
      display: "standalone",
      background_color: "#0f766e",
      theme_color: "#0f766e",
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-lg">Instalação & Geração de APK</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1.5 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'pwa' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-500'
            }`}
          >
            📲 Instalação Direta
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'pwabuilder' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-500'
            }`}
          >
            ⚡ Gerador APK (1-Click)
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'capacitor' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300' : 'text-slate-500'
            }`}
          >
            🛠️ Capacitor / Play Store
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-teal-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Seu Horário do Remédio" 
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-teal-950 dark:text-teal-100">
                    Instalar como App Nativo no Celular
                  </h3>
                  <p className="text-xs text-teal-800/80 dark:text-teal-300">
                    Funciona 100% como um aplicativo instalado com ícone na tela inicial, alarmes e modo offline.
                  </p>
                </div>
              </div>

              <button
                onClick={handleInstallPwa}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalled ? '✓ Aplicativo Já Instalado' : 'Instalar Aplicativo no Dispositivo'}</span>
              </button>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <strong className="block text-slate-800 dark:text-slate-200">
                  Como instalar manualmente:
                </strong>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>Android (Chrome):</strong> Toque nos 3 pontinhos (⋮) no canto superior direito e selecione <em>&quot;Instalar aplicativo&quot;</em> ou <em>&quot;Adicionar à tela inicial&quot;</em>.
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>iPhone (Safari):</strong> Toque no botão Compartilhar (quadrado com seta para cima) e escolha <em>&quot;Adicionar à Tela de Início&quot;</em>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-200">
                <strong>Gerador Automático de APK (Microsoft PWABuilder):</strong>
                <p className="mt-1">
                  O jeito mais rápido e gratuito de gerar um arquivo <code>.APK</code> para distribuição ou publicação na Google Play Store.
                </p>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 font-medium">
                <li>
                  Acesse o site oficial:{' '}
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 font-bold underline inline-flex items-center gap-0.5"
                  >
                    pwabuilder.com <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>Cole o link desta aplicação no campo de URL e clique em <strong>Start</strong>.</li>
                <li>Clique no botão <strong>Package for Stores</strong> e selecione <strong>Android (APK / AAB)</strong>.</li>
                <li>O site compilará e baixará o arquivo <code>.apk</code> pronto para ser instalado em qualquer smartphone Android!</li>
              </ol>

              <button
                onClick={handleDownloadManifest}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar manifest.json de Configuração</span>
              </button>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Para empacotar nativamente usando <strong>Capacitor</strong> ou <strong>Cordova</strong>:
              </p>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
                <p># 1. Instalar Capacitor</p>
                <p>npm i @capacitor/core @capacitor/cli @capacitor/android</p>
                <p># 2. Inicializar</p>
                <p>npx cap init &quot;Seu Horário do Remédio&quot; &quot;com.remedio.saas&quot;</p>
                <p># 3. Gerar build e sincronizar</p>
                <p>npm run build</p>
                <p>npx cap add android</p>
                <p>npx cap open android # Abre o Android Studio para compilar o .APK</p>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Pronto para publicação na Google Play Store com assinatura digital SHA-256.</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

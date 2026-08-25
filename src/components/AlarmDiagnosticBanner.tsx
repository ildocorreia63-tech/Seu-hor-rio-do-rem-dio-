import React, { useState, useEffect } from 'react';
import { 
  Bell, Volume2, ShieldCheck, AlertTriangle, Play, 
  Smartphone, CheckCircle2, RefreshCw, X, ChevronDown, ChevronUp, Zap, Sparkles 
} from 'lucide-react';
import { audio } from '../services/audio';
import { alarmManager } from '../services/alarmManager';

interface AlarmDiagnosticBannerProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export const AlarmDiagnosticBanner: React.FC<AlarmDiagnosticBannerProps> = ({
  onDismiss,
  compact = false,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swActive, setSwActive] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [testing, setTesting] = useState(false);

  const checkStatus = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwActive(!!reg && !!reg.active);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não possui suporte a notificações.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        alarmManager.sendSystemNotification({
          medicine: {
            id: 'test',
            userId: 'user',
            memberId: 'member',
            name: 'Notificações Ativadas com Sucesso!',
            dosage: 'Lembretes configurados',
            quantity: 1,
            unit: '',
            frequencyType: 'daily',
            times: ['Agora'],
            startDate: new Date().toISOString(),
            durationDays: 0,
            active: true,
            createdAt: ''
          },
          scheduledTime: 'Agora',
          isSnoozed: false
        });
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  const handleTestSound = () => {
    audio.unlockAudio();
    audio.testSound('standard', 100, true);
    setSoundTested(true);
  };

  const handleTestFullAlarm = () => {
    setTesting(true);
    audio.unlockAudio();
    alarmManager.testFullAlarm(() => {
      setTesting(false);
    });
  };

  const isAllReady = permission === 'granted' && swActive;

  return (
    <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-teal-500/40 shadow-xl overflow-hidden relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isAllReady 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {isAllReady ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Status dos Alarmes & Alertas em 2º Plano
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                isAllReady 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isAllReady ? '100% OPERACIONAL' : 'AÇÃO RECOMENDADA'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Garante que você receba o aviso visual e sonoro mesmo com o celular bloqueado ou o app fechado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition"
            title={expanded ? 'Recolher' : 'Expandir'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          
          {/* Status checklist badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* 1. Permissão de Notificação */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className={`w-4 h-4 ${permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div>
                  <span className="text-[11px] font-bold block text-slate-200">Notificações Push</span>
                  <span className={`text-[10px] font-extrabold uppercase ${
                    permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {permission === 'granted' ? '✓ Permitido' : permission === 'denied' ? '✗ Bloqueado' : '! Pendente'}
                  </span>
                </div>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition active:scale-95 shadow-sm"
                >
                  Ativar
                </button>
              )}
            </div>

            {/* 2. Som e Áudio */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-teal-400" />
                <div>
                  <span className="text-[11px] font-bold block text-slate-200">Som & Reforço</span>
                  <span className="text-[10px] font-bold text-teal-300">
                    Volume 100% (Alto)
                  </span>
                </div>
              </div>

              <button
                onClick={handleTestSound}
                className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Ouvir</span>
              </button>
            </div>

            {/* 3. Service Worker em Segundo Plano */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-[11px] font-bold block text-slate-200">2º Plano / Bloqueado</span>
                  <span className="text-[10px] font-bold text-purple-300">
                    {swActive ? '✓ Service Worker Ativo' : 'Sincronizando'}
                  </span>
                </div>
              </div>

              <button
                onClick={checkStatus}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                title="Atualizar diagnóstico"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Test Alarm Master Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-950 via-slate-800 to-teal-950 rounded-2xl border border-teal-500/30">
            <div className="text-xs text-slate-300 text-center sm:text-left">
              <strong className="text-white block font-bold">Deseja simular o alarme agora?</strong>
              <span>Dispara a sirene/chime alto, vibração e o aviso em tela cheia instantaneamente.</span>
            </div>

            <button
              onClick={handleTestFullAlarm}
              disabled={testing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>🚀 Testar Alarme Imediato</span>
            </button>
          </div>

          {/* Device Specific Guidelines for 100% Background Delivery */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>Instruções para receber com o Celular Bloqueado ou App Fechado:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
              <li>
                <strong>Android (Chrome ou APK):</strong> Toque em <em>"Instalar / APK"</em> no menu para ter o app nativo no celular. Nas configurações do celular, desative a <em>Economia de Bateria</em> para o app e certifique-se de que o <em>Volume de Mídia</em> não está no silencioso.
              </li>
              <li>
                <strong>iPhone (iOS):</strong> No Safari, toque no ícone de <em>Compartilhar (quadrado com seta)</em> &rarr; <em>"Adicionar à Tela de Início"</em>. Abra pelo ícone na tela inicial e toque em <em>"Ativar Notificações"</em>.
              </li>
              <li>
                <strong>Computador / Notebook:</strong> Se o navegador bloquear alertas, clique no ícone de <em>Cadeado</em> ao lado da barra de endereços e altere <em>Notificações</em> e <em>Som</em> para <em>"Permitir"</em>.
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};

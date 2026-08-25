import React, { useRef, useState } from 'react';
import { AppSettings, FamilyMember, User } from '../types';
import { audio } from '../services/audio';
import { alarmManager } from '../services/alarmManager';
import { aiCache } from '../services/aiCache';
import { 
  Volume2, Bell, Smartphone, Users, Download, Upload, Trash2, Crown, 
  Sparkles, Shield, Play, Globe, Share2, LogOut, Zap, RefreshCw, 
  CheckCircle2, AlertTriangle, X 
} from 'lucide-react';
import { AlarmDiagnosticBanner } from './AlarmDiagnosticBanner';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  members: FamilyMember[];
  user: User | null;
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  onOpenPricing: () => void;
  onOpenApk: () => void;
  onOpenShareLanding?: () => void;
  onLogout?: () => void;
  onExportBackup: () => void;
  onImportBackup: (data: any) => void;
  onClearAllData: () => void;
  onDeleteAccount?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  members,
  user,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onOpenPricing,
  onOpenApk,
  onOpenShareLanding,
  onLogout,
  onExportBackup,
  onImportBackup,
  onClearAllData,
  onDeleteAccount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cacheStats, setCacheStats] = useState(() => aiCache.getStats());
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClearAiCache = () => {
    aiCache.clear();
    setCacheStats(aiCache.getStats());
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await alarmManager.sendSystemNotification({
          medicine: {
            id: 'test',
            userId: 'user',
            memberId: 'member',
            name: '🔔 Notificações Ativadas com Sucesso!',
            dosage: 'Lembretes configurados para todos os seus medicamentos',
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
        onUpdateSettings({ ...settings, notificationsEnabled: true });
      } else {
        alert('As notificações foram bloqueadas nas configurações do navegador. Clique no ícone de cadeado na barra de endereços para permitir.');
      }
    } catch (e) {
      console.warn('Erro ao solicitar permissão:', e);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        onImportBackup(json);
      } catch {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
          Preferências do Aplicativo
        </span>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Configurações & SaaS
        </h2>
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-teal-700/60 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
                Assinatura Micro-SaaS
              </span>
              <h3 className="font-extrabold text-lg text-white">
                {user?.plan === 'family'
                  ? 'Plano Família VIP'
                  : user?.plan === 'pro_monthly'
                  ? 'Plano Pro Mensal'
                  : user?.plan === 'pro_yearly'
                  ? 'Plano Pro Anual'
                  : 'Plano Gratuito'}
              </h3>
            </div>
          </div>

          <button
            onClick={onOpenPricing}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition active:scale-95"
          >
            {user?.plan === 'free' ? 'Fazer Upgrade 🚀' : 'Gerenciar Plano'}
          </button>
        </div>

        <p className="text-xs text-teal-200/80 mt-3 pt-3 border-t border-white/10">
          Status:{' '}
          <strong className="text-emerald-300 capitalize font-bold">
            {user?.subscriptionStatus || 'Ativo'}
          </strong>{' '}
          • Limite: {user?.maxMeds === 999 ? 'Ilimitado' : `${user?.maxMeds} remédios`} • {user?.maxMembers} perfil(s)
        </p>
      </div>

      {/* Share Landing & APK Promoter Card */}
      {onOpenShareLanding && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 text-xl shadow-inner">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">
                Divulgar no WhatsApp & Oferecer APK
              </h4>
              <p className="text-xs text-emerald-100">
                Página de divulgação com mensagens prontas para enviar pelo WhatsApp e redes sociais.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenShareLanding}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-black rounded-xl text-xs shrink-0 shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            <span>Divulgar</span>
          </button>
        </div>
      )}

      {/* APK & PWA Generator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Instalar Aplicativo & Gerar APK
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transforme este sistema em um aplicativo nativo Android (.APK) ou PWA offline.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApk}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-md transition active:scale-95 flex items-center gap-1.5"
        >
          <span>Instalar / APK</span>
        </button>
      </div>

      {/* Alarm Diagnostics & Background Execution Status */}
      <AlarmDiagnosticBanner />

      {/* Alarm and Sound Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-teal-600" />
            <span>Alarme & Avisos Sonoros (Celular e Notebook)</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
            Alta Definição
          </span>
        </div>

        {/* Alarm Sound Switch */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Som do alarme</strong>
            <span className="text-[11px] text-slate-400">Toca em tela cheia na hora exata do medicamento</span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        {/* Volume Level Slider */}
        {settings.soundEnabled && (
          <div className="py-2 px-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Volume do Alarme</span>
              </strong>
              <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                {settings.volume ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={settings.volume ?? 100}
              onChange={(e) =>
                onUpdateSettings({ ...settings, volume: Number(e.target.value) })
              }
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>Baixo</span>
              <span>Médio</span>
              <span className="text-teal-600 font-bold">Máximo (100%)</span>
            </div>
          </div>
        )}

        {/* Volume Boost for Mobile / Laptop Speakers */}
        {settings.soundEnabled && (
          <div className="flex items-center justify-between py-1">
            <div>
              <strong className="text-xs block text-slate-800 dark:text-slate-200">
                Reforço de Volume (Idosos & Alto-falantes) 🔊
              </strong>
              <span className="text-[11px] text-slate-400">
                Amplifica frequências audíveis para celulares e notebooks
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.volumeBoost !== false}
              onChange={(e) =>
                onUpdateSettings({ ...settings, volumeBoost: e.target.checked })
              }
              className="w-5 h-5 accent-teal-600 cursor-pointer"
            />
          </div>
        )}

        {/* Alarm Tone Type Picker */}
        {settings.soundEnabled && (
          <div className="flex items-center justify-between py-1">
            <div>
              <strong className="text-xs block text-slate-800 dark:text-slate-200">Tipo de toque</strong>
              <span className="text-[11px] text-slate-400">Harmônicos de alta penetração acústica</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={settings.soundType}
                onChange={(e) => onUpdateSettings({ ...settings, soundType: e.target.value as any })}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs font-semibold outline-none"
              >
                <option value="standard">Padrão Médico (Chime Alto)</option>
                <option value="loud">Alto (Buzzer Intenso)</option>
                <option value="siren">Sirene de Alerta</option>
                <option value="soft">Campainha Suave</option>
                <option value="harp">Harpa Harmônica</option>
              </select>
              <button
                onClick={() => {
                  audio.unlockAudio();
                  audio.testSound(
                    settings.soundType,
                    settings.volume ?? 100,
                    settings.volumeBoost !== false
                  );
                }}
                className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm active:scale-95"
                title="Tocar som de teste agora"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ouvir</span>
              </button>
            </div>
          </div>
        )}

        {/* Voice Announcer in Portuguese */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Voz Falada (Português)</strong>
            <span className="text-[11px] text-slate-400">Fala o nome e dosagem do remédio no alarme</span>
          </div>
          <div className="flex items-center gap-2">
            {settings.voiceEnabled && (
              <button
                onClick={() => {
                  audio.unlockAudio();
                  audio.speak(
                    'Atenção! É hora de tomar Losartana Potássica, 50 miligramas.',
                    settings.volume ?? 100
                  );
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold text-[11px] transition active:scale-95"
                title="Testar fala do assistente"
              >
                Testar Voz
              </button>
            )}
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, voiceEnabled: e.target.checked })}
              className="w-5 h-5 accent-teal-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Vibration Switch */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Vibração no celular</strong>
            <span className="text-[11px] text-slate-400">Vibra com padrão contínuo ao disparar</span>
          </div>
          <div className="flex items-center gap-2">
            {settings.vibrateEnabled && (
              <button
                onClick={() => audio.vibrate()}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold text-[11px] transition active:scale-95"
                title="Testar vibração no aparelho"
              >
                Vibrar
              </button>
            )}
            <input
              type="checkbox"
              checked={settings.vibrateEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, vibrateEnabled: e.target.checked })}
              className="w-5 h-5 accent-teal-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Browser Notification Permission */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Notificações push</strong>
            <span className="text-[11px] text-slate-400">Avisos na barra de notificações do sistema</span>
          </div>
          <button
            onClick={handleTestNotification}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-teal-600 transition"
          >
            Testar / Ativar
          </button>
        </div>

        {/* Snooze Duration */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Duração da soneca</strong>
            <span className="text-[11px] text-slate-400">Tempo para repetir o lembrete</span>
          </div>
          <select
            value={settings.snoozeMinutes}
            onChange={(e) => onUpdateSettings({ ...settings, snoozeMinutes: Number(e.target.value) })}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs font-semibold outline-none"
          >
            <option value="5">5 minutos</option>
            <option value="10">10 minutos</option>
            <option value="15">15 minutos</option>
            <option value="20">20 minutos</option>
          </select>
        </div>

        {/* Helpful audio diagnostics & tip box for mobile & notebook */}
        <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/60 rounded-2xl text-xs space-y-1.5 text-teal-950 dark:text-teal-200">
          <div className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
            <span>💡 Como garantir que o som toque sempre:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <li>
              <strong>No Celular (Android / iPhone):</strong> Desative o botão de modo silencioso e aumente o <em>Volume de Mídia</em> nas configurações do aparelho.
            </li>
            <li>
              <strong>No Notebook / Computador:</strong> Mantenha esta aba aberta e certifique-se de que os alto-falantes estão ligados.
            </li>
            <li>
              <strong>Desbloqueio do Navegador:</strong> Ao tocar em qualquer botão da tela pela primeira vez, o navegador libera a reprodução automática de alarmes.
            </li>
          </ul>
        </div>
      </div>

      {/* Family Members Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Membros da Família</span>
          </h3>
          <button
            onClick={onAddMember}
            className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition"
          >
            + Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{m.emoji}</span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">{m.name}</strong>
                  <span className="text-[10px] text-slate-400">{m.relation || 'Familiar'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditMember(m)}
                  className="px-2.5 py-1 text-slate-500 hover:text-teal-600 font-bold"
                >
                  Editar
                </button>
                {members.length > 1 && (
                  <button
                    onClick={() => onDeleteMember(m.id)}
                    className="px-2.5 py-1 text-red-500 font-bold"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Performance & Local Cache Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Desempenho & Cache da IA</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            Ativo (0ms)
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Memoriza respostas médicas e farmacêuticas localmente para responder instantaneamente e economizar o consumo de tokens da API.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Consultas em Cache</span>
            <strong className="text-base text-slate-800 dark:text-slate-200 font-extrabold">
              {cacheStats.totalEntries} {cacheStats.totalEntries === 1 ? 'item' : 'itens'}
            </strong>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Tokens Economizados</span>
            <strong className="text-base text-emerald-600 dark:text-emerald-400 font-extrabold">
              ~{cacheStats.estimatedTokensSaved.toLocaleString()}
            </strong>
          </div>
        </div>

        {cacheStats.totalEntries > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Liberar memória do cache</span>
            <button
              onClick={handleClearAiCache}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Limpar Cache da IA</span>
            </button>
          </div>
        )}
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>Backup & Dados</span>
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onExportBackup}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Exportar Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition"
          >
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Importar Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-red-600 dark:text-red-400 font-bold block">
              Limpar dados e registros
            </span>
            <span className="text-[11px] text-slate-400">
              Apaga remédios e histórico, mantendo seu login
            </span>
          </div>
          <button
            onClick={() => setShowClearDataModal(true)}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Dados</span>
          </button>
        </div>
      </div>

      {/* Account / Logout & Account Deletion Card */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Sessão Ativa
              </span>
              <strong className="text-sm block text-slate-800 dark:text-slate-200">
                {user.name}
              </strong>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 border border-slate-200 dark:border-slate-700 self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar (Sair)</span>
              </button>
            )}
          </div>

          {/* Delete Account Danger Zone */}
          {onDeleteAccount && user.role !== 'admin' && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-red-600 dark:text-red-400 font-bold block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Exclusão Definitiva de Conta</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exclui permanentemente seu cadastro, plano e todos os dados associados
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 self-start sm:self-auto shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Minha Conta</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/60 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Limpar Todos os Medicamentos?
                </h4>
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                  Esta ação apagará medicamentos e históricos
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Todos os seus medicamentos cadastrados e o histórico de doses serão apagados. A sua conta de assinante continuará ativa para novos cadastros.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDataModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearDataModal(false);
                  onClearAllData();
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && onDeleteAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-300 dark:border-red-900 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Excluir Permanentemente Minha Conta
                </h4>
                <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                  Ação Irreversível
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 leading-relaxed">
              Você está prestes a excluir a conta de <strong>{user?.name}</strong> ({user?.email}).
              <ul className="list-disc pl-4 mt-2 space-y-1 text-[11px]">
                <li>Todos os seus remédios e fotos de receitas serão eliminados.</li>
                <li>Seus perfis familiares e histórico de adesão serão apagados.</li>
                <li>Sua sessão será encerrada imediatamente.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancelar e Manter Conta
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteAccount();
                    setShowDeleteAccountModal(false);
                  } catch {
                    alert('Erro ao excluir conta.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo Conta...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About & Medical Disclaimer */}
      <div className="bg-slate-100 dark:bg-slate-900/60 rounded-3xl p-5 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Seu Horário do Remédio SaaS • Versão 1.0.0
        </p>
        <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
          ⚠️ <strong>Aviso Importante:</strong> Este aplicativo é uma ferramenta de auxílio e organização pessoal. Não substitui a prescrição, diagnóstico ou acompanhamento de profissionais de saúde.
        </p>
      </div>
    </div>
  );
};

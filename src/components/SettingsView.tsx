import React, { useRef } from 'react';
import { AppSettings, FamilyMember, User } from '../types';
import { audio } from '../services/audio';
import { Volume2, Bell, Smartphone, Users, Download, Upload, Trash2, Crown, Sparkles, Shield, Play, Globe, Share2, LogOut } from 'lucide-react';

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('🔔 Notificações Ativadas!', {
        body: 'Você receberá alertas pontuais para todos os seus medicamentos.',
        icon: '/icons/icon-192.png',
      });
      onUpdateSettings({ ...settings, notificationsEnabled: true });
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

      {/* Alarm and Sound Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-teal-600" />
          <span>Alarme e Notificações</span>
        </h3>

        {/* Alarm Sound Switch */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Som do alarme</strong>
            <span className="text-[11px] text-slate-400">Toca em tela cheia na hora do medicamento</span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        {/* Alarm Tone Type Picker */}
        {settings.soundEnabled && (
          <div className="flex items-center justify-between py-1">
            <div>
              <strong className="text-xs block text-slate-800 dark:text-slate-200">Tipo de toque</strong>
              <span className="text-[11px] text-slate-400">Sons sintetizados em alta definição</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={settings.soundType}
                onChange={(e) => onUpdateSettings({ ...settings, soundType: e.target.value as any })}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs font-semibold outline-none"
              >
                <option value="standard">Padrão Médico</option>
                <option value="soft">Suave (Campainha)</option>
                <option value="harp">Harpa Relaxante</option>
                <option value="loud">Alto (Buzzer)</option>
                <option value="siren">Sirene de Alerta</option>
              </select>
              <button
                onClick={() => audio.testSound(settings.soundType)}
                className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 hover:bg-teal-100 transition"
                title="Ouvir teste de som"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Voice Announcer in Portuguese */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Voz Falada (Português)</strong>
            <span className="text-[11px] text-slate-400">Fala o nome do remédio no alarme</span>
          </div>
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, voiceEnabled: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        {/* Vibration Switch */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Vibração no celular</strong>
            <span className="text-[11px] text-slate-400">Vibra ao disparar o alarme</span>
          </div>
          <input
            type="checkbox"
            checked={settings.vibrateEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, vibrateEnabled: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        {/* Browser Notification Permission */}
        <div className="flex items-center justify-between py-1">
          <div>
            <strong className="text-xs block text-slate-800 dark:text-slate-200">Notificações push</strong>
            <span className="text-[11px] text-slate-400">Permissão do navegador / sistema</span>
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
          <span className="text-xs text-red-500 font-semibold">Apagar todos os dados</span>
          <button
            onClick={onClearAllData}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition"
          >
            Limpar Banco
          </button>
        </div>
      </div>

      {/* Account / Logout & Return to Login Card */}
      {user && onLogout && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-sm block text-slate-800 dark:text-slate-200">
                Conta Conectada: {user.name}
              </strong>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 border border-red-200 dark:border-red-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta (Voltar ao Login)</span>
            </button>
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

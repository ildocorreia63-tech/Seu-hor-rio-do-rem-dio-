import React, { useState, useEffect, useCallback } from 'react';
import { User, FamilyMember, Medicine, DoseRecord, AppSettings } from './types';
import { api, defaultSettings } from './services/api';
import { alarmManager, ActiveAlarm } from './services/alarmManager';
import { Header } from './components/Header';
import { MemberBar } from './components/MemberBar';
import { HomeView } from './components/HomeView';
import { MedicinesView } from './components/MedicinesView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AlarmOverlay } from './components/AlarmOverlay';
import { MedicineFormModal } from './components/MedicineFormModal';
import { MedicineDetailModal } from './components/MedicineDetailModal';
import { MemberModal } from './components/MemberModal';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { ApkExportModal } from './components/ApkExportModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ShareLandingModal } from './components/ShareLandingModal';
import { SaasMetricsModal } from './components/SaasMetricsModal';
import { WelcomeAuthView } from './components/WelcomeAuthView';
import { Home, Pill, Plus, ClipboardList, Settings as SettingsIcon, AlertTriangle, Lock, ShieldAlert, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [history, setHistory] = useState<DoseRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [activeView, setActiveView] = useState<'home' | 'medicines' | 'history' | 'settings'>('home');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

  // Active ringing alarm
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  // Modals
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [detailMedicine, setDetailMedicine] = useState<Medicine | null>(null);

  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShareLandingModal, setShowShareLandingModal] = useState(false);
  const [showSaasMetricsModal, setShowSaasMetricsModal] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [impersonatingAdmin, setImpersonatingAdmin] = useState<User | null>(() => {
    const saved = localStorage.getItem('shdr_impersonating_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const handleReturnToAdmin = async () => {
    try {
      localStorage.removeItem('shdr_impersonating_admin');
      setImpersonatingAdmin(null);
      // Login back as Ildo Correia de Lima admin
      const res = await api.demoLogin('user-admin-ildo');
      setUser(res.user);
      showToast('Retornado com sucesso para a conta de Administrador Master (Ildo Correia de Lima)!');
      await loadUserData();
    } catch (err: any) {
      showToast('Erro ao retornar para a conta de Administrador.');
    }
  };

  const handleImpersonateUser = async (targetUserId: string) => {
    try {
      if (user && user.role === 'admin') {
        localStorage.setItem('shdr_impersonating_admin', JSON.stringify(user));
        setImpersonatingAdmin(user);
      }
      const data = await api.adminImpersonate(targetUserId);
      setUser(data.user);
      showToast(`Acessando a conta de ${data.user.name} em modo de suporte.`);
      await loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao acessar conta.');
    }
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      let currentUser: User | null = null;
      try {
        currentUser = await api.getMe();
      } catch {
        // If no active session, check if there's any saved account or default to admin if first time
        currentUser = null;
      }
      setUser(currentUser);

      if (currentUser) {
        const [loadedMembers, loadedMeds, loadedHistory] = await Promise.all([
          api.getMembers(),
          api.getMedicines(),
          api.getHistory(),
        ]);

        setMembers(loadedMembers);
        setMedicines(loadedMeds);
        setHistory(loadedHistory);
      } else {
        setMembers([]);
        setMedicines([]);
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, []);

  // Initialization
  useEffect(() => {
    const loadedSettings = api.getSettings();
    setSettings(loadedSettings);

    // Apply dark theme if requested
    if (
      loadedSettings.theme === 'dark' ||
      (loadedSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size class for senior accessibility
    document.documentElement.classList.remove('font-size-large', 'font-size-extra-large');
    if (loadedSettings.fontSize === 'large') {
      document.documentElement.classList.add('font-size-large');
    } else if (loadedSettings.fontSize === 'extra-large') {
      document.documentElement.classList.add('font-size-extra-large');
    }

    loadUserData();

    // Check URL query parameters for special views or actions
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if user requested logout via URL
    if (urlParams.get('logout') === '1' || urlParams.get('sair') === '1') {
      localStorage.removeItem('shdr_impersonating_admin');
      api.logout();
      setUser(null);
      setMembers([]);
      setMedicines([]);
      setHistory([]);
      showToast('Sessão encerrada com sucesso.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (
      urlParams.get('landing') === '1' || 
      urlParams.get('landing') === 'true' || 
      urlParams.get('share') === '1' || 
      urlParams.get('divulgar') === '1' || 
      urlParams.get('logomarca') === '1' || 
      urlParams.get('logo') === '1' ||
      urlParams.get('apresentacao') === '1'
    ) {
      setShowShareLandingModal(true);
    }

    // Check URL for Stripe return status
    if (urlParams.get('checkout_success') === 'true') {
      const plan = urlParams.get('plan') || 'pro_monthly';
      api.activatePlan(plan).then(() => {
        showToast('🎉 Pagamento confirmado com sucesso! Seu plano foi atualizado.');
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
        loadUserData();
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    // Init Alarm Manager
    alarmManager.init((alarm) => {
      setActiveAlarm(alarm);
    });
  }, [loadUserData]);

  // Sync data to AlarmManager on change and check for alarm URL query param
  useEffect(() => {
    alarmManager.updateData(medicines, members, settings);

    if (medicines.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const alarmMedId = urlParams.get('alarmMedId');
      const timeParam = urlParams.get('time');
      const isSnoozed = urlParams.get('snoozed') === '1';

      if (alarmMedId) {
        const med = medicines.find(m => m.id === alarmMedId);
        if (med) {
          const member = members.find(m => m.id === med.memberId);
          setActiveAlarm({
            medicine: med,
            member,
            scheduledTime: timeParam || 'Agora',
            isSnoozed
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [medicines, members, settings]);

  // Listen to Service Worker messages for actions taken from system notifications
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (!event.data) return;
        if (event.data.type === 'NOTIFICATION_TAKE_DOSE' && event.data.data?.medicineId) {
          const med = medicines.find(m => m.id === event.data.data.medicineId);
          if (med) {
            handleTakeDose(med, event.data.data.scheduledTime || 'Agora');
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [medicines]);

  // --- MEDICINE HANDLERS ---
  const handleSaveMedicine = async (medData: Partial<Medicine>) => {
    if (editingMedicine) {
      const updated = await api.updateMedicine(editingMedicine.id, medData);
      setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast('Medicamento atualizado com sucesso!');
    } else {
      const created = await api.createMedicine(medData);
      setMedicines((prev) => [...prev, created]);
      showToast('Medicamento cadastrado com sucesso!');
    }
    loadUserData();
  };

  const handleDeleteMedicine = async (id: string) => {
    if (confirm('Deseja realmente excluir este medicamento?')) {
      await api.deleteMedicine(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      if (detailMedicine?.id === id) setDetailMedicine(null);
      showToast('Medicamento removido.');
    }
  };

  const handleTakeDose = async (med: Medicine, time: string) => {
    try {
      const result = await api.takeDose(med.id, time);
      setHistory((prev) => [result.record, ...prev]);
      setMedicines((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, quantity: result.remainingStock } : m))
      );
      showToast(`✓ Dose de ${med.name} registrada!`);
    } catch (err: any) {
      showToast(`Erro ao registrar dose: ${err.message}`);
    }
  };

  const handleUpdateStock = async (id: string, newQty: number) => {
    const updated = await api.updateMedicine(id, { quantity: newQty });
    setMedicines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    if (detailMedicine?.id === id) setDetailMedicine(updated);
    showToast('Estoque atualizado com sucesso!');
  };

  // --- ALARM OVERLAY HANDLERS ---
  const handleAlarmTake = async (alarm: ActiveAlarm) => {
    await handleTakeDose(alarm.medicine, alarm.scheduledTime);
    setActiveAlarm(null);
  };

  const handleAlarmSnooze = (alarm: ActiveAlarm, minutes: number) => {
    alarmManager.snooze(alarm.medicine.id, alarm.scheduledTime, minutes);
    setActiveAlarm(null);
    showToast(`Soneca ativada para daqui a ${minutes} minutos.`);
  };

  // --- MEMBER HANDLERS ---
  const handleSaveMember = async (memberData: Partial<FamilyMember>) => {
    if (editingMember) {
      const updated = await api.updateMember(editingMember.id, memberData);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast('Membro atualizado!');
    } else {
      const created = await api.createMember(memberData);
      setMembers((prev) => [...prev, created]);
      showToast('Familiar adicionado com sucesso!');
    }
    loadUserData();
  };

  const handleDeleteMember = async (id: string) => {
    await api.deleteMember(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMemberId === id) setSelectedMemberId('all');
    showToast('Membro removido.');
    loadUserData();
  };

  // --- SETTINGS HANDLERS ---
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    api.saveSettings(newSettings);
    if (
      newSettings.theme === 'dark' ||
      (newSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size class
    document.documentElement.classList.remove('font-size-large', 'font-size-extra-large');
    if (newSettings.fontSize === 'large') {
      document.documentElement.classList.add('font-size-large');
    } else if (newSettings.fontSize === 'extra-large') {
      document.documentElement.classList.add('font-size-extra-large');
    }
  };

  const handleToggleFontSize = () => {
    const nextSize: 'normal' | 'large' | 'extra-large' = 
      settings.fontSize === 'normal' ? 'large' : settings.fontSize === 'large' ? 'extra-large' : 'normal';
    const updated = { ...settings, fontSize: nextSize };
    handleUpdateSettings(updated);
    showToast(`Tamanho da letra: ${nextSize === 'extra-large' ? 'Muito Grande (Idoso)' : nextSize === 'large' ? 'Grande' : 'Padrão'}`);
  };

  // --- STRIPE CHECKOUT ---
  const handleCheckoutStripe = async (planId: string) => {
    const session = await api.createCheckoutSession(planId);
    if (session.url) {
      window.location.href = session.url;
    }
  };

  const handleActivatePlan = async (planId: string) => {
    const res = await api.activatePlan(planId);
    setUser(res.user);
    showToast(res.message);
    loadUserData();
  };

  // --- BACKUP ---
  const handleExportBackup = async () => {
    const data = await api.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-remedios-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup exportado com sucesso!');
  };

  const handleImportBackup = async (data: any) => {
    await api.importBackup(data);
    showToast('Backup restaurado com sucesso!');
    loadUserData();
  };

  const handleClearAllData = async () => {
    if (confirm('ATENÇÃO: Deseja apagar todos os medicamentos e históricos?')) {
      await api.clearHistory('all');
      for (const m of medicines) {
        await api.deleteMedicine(m.id);
      }
      showToast('Dados apagados.');
      loadUserData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Impersonation Mode Banner */}
      {impersonatingAdmin && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white px-3 py-2 text-xs font-bold shadow-md flex items-center justify-between gap-2 z-40 border-b border-amber-500">
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">👑</span>
            <span className="truncate">
              Modo Admin: Você está visualizando a conta de <strong>{user?.name}</strong> ({user?.email})
            </span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="px-3 py-1 bg-white text-amber-900 rounded-xl font-extrabold text-[11px] hover:bg-amber-100 shadow transition shrink-0"
          >
            Voltar para Ildo Correia de Lima (Admin)
          </button>
        </div>
      )}

      {/* Top App Header */}
      <Header
        user={user}
        members={members}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        onOpenSettings={() => setActiveView('settings')}
        onOpenPricing={() => setShowPricingModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenApk={() => setShowApkModal(true)}
        onOpenAi={() => setShowAiModal(true)}
        onOpenShareLanding={() => setShowShareLandingModal(true)}
        onOpenSaasMetrics={() => setShowSaasMetricsModal(true)}
        fontSize={settings.fontSize}
        onToggleFontSize={handleToggleFontSize}
        onLogout={() => {
          localStorage.removeItem('shdr_impersonating_admin');
          setImpersonatingAdmin(null);
          api.logout();
          setUser(null);
          showToast('Você saiu da sua conta.');
          setShowAuthModal(false);
          loadUserData();
        }}
      />

      {/* Family Member Filter Bar - only when user is logged in */}
      {user && (
        <MemberBar
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
          onAddMember={() => {
            setEditingMember(null);
            setShowMemberModal(true);
          }}
        />
      )}

      {/* Financial Status Alerts / Block Notices */}
      {user && user.role !== 'admin' && user.subscriptionStatus === 'canceled' && (
        <div className="max-w-3xl w-full mx-auto px-4 pt-3">
          <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border-2 border-red-500/40 text-red-900 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-red-950 dark:text-red-100 flex items-center gap-1.5">
                  <span>Acesso Suspenso por Falta de Pagamento</span>
                </h4>
                <p className="text-xs text-red-800 dark:text-red-300 mt-0.5 leading-relaxed">
                  Consta uma pendência financeira na sua conta. Seus alarmes sonoros e recursos premium foram temporariamente bloqueados. Regularize para reativar imediatamente.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shrink-0 flex items-center gap-1.5 shadow transition active:scale-95 self-end sm:self-center"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Regularizar Agora</span>
            </button>
          </div>
        </div>
      )}

      {user && user.role !== 'admin' && user.subscriptionStatus === 'past_due' && (
        <div className="max-w-3xl w-full mx-auto px-4 pt-3">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-extrabold text-xs text-amber-950 dark:text-amber-100">
                  Aviso: Pagamento Pendente em Aberto
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  A renovação da sua assinatura está pendente. Regularize o pagamento para evitar o bloqueio da conta.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 flex items-center gap-1 shadow transition active:scale-95 self-end sm:self-center"
            >
              <CreditCard className="w-3 h-3" />
              <span>Pagar Fatura</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-5 mb-16">
        {!user ? (
          <WelcomeAuthView
            onLogin={async (email, pass) => {
              const res = await api.login(email, pass);
              setUser(res.user);
              showToast(`Bem-vindo(a), ${res.user.name}!`);
              await loadUserData();
            }}
            onRegister={async (n, email, pass, plan, role, accountType, orgName) => {
              const res = await api.register(n, email, pass, plan || 'free', role || 'user', accountType || 'personal', orgName);
              setUser(res.user);
              showToast(`Conta criada com sucesso, ${res.user.name}!`);
              await loadUserData();
            }}
            onDemoLogin={async (demoId) => {
              const res = await api.demoLogin(demoId);
              setUser(res.user);
              showToast(`Entrou como ${res.user.name}!`);
              await loadUserData();
            }}
            onOpenPricing={() => setShowPricingModal(true)}
          />
        ) : (
          <>
            {activeView === 'home' && (
              <HomeView
                user={user}
                medicines={medicines}
                members={members}
                history={history}
                selectedMemberId={selectedMemberId}
                onAddMedicine={() => {
                  setEditingMedicine(null);
                  setShowMedicineForm(true);
                }}
                onSelectMedicine={(med) => setDetailMedicine(med)}
                onTakeDose={handleTakeDose}
                onOpenPricing={() => setShowPricingModal(true)}
                onOpenShareLanding={() => setShowShareLandingModal(true)}
                onOpenApk={() => setShowApkModal(true)}
                onLogout={() => {
                  localStorage.removeItem('shdr_impersonating_admin');
                  setImpersonatingAdmin(null);
                  api.logout();
                  setUser(null);
                  showToast('Você saiu da sua conta.');
                  setShowAuthModal(false);
                  loadUserData();
                }}
              />
            )}

            {activeView === 'medicines' && (
              <MedicinesView
                user={user}
                medicines={medicines}
                members={members}
                selectedMemberId={selectedMemberId}
                onAddMedicine={() => {
                  setEditingMedicine(null);
                  setShowMedicineForm(true);
                }}
                onSelectMedicine={(med) => setDetailMedicine(med)}
                onEditMedicine={(med) => {
                  setEditingMedicine(med);
                  setShowMedicineForm(true);
                }}
                onDeleteMedicine={handleDeleteMedicine}
              />
            )}

            {activeView === 'history' && (
              <HistoryView
                history={history}
                members={members}
                selectedMemberId={selectedMemberId}
                onClearHistory={async () => {
                  if (confirm('Deseja limpar todo o histórico de doses?')) {
                    await api.clearHistory(selectedMemberId);
                    showToast('Histórico limpo com sucesso.');
                    loadUserData();
                  }
                }}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                members={members}
                user={user}
                onAddMember={() => {
                  setEditingMember(null);
                  setShowMemberModal(true);
                }}
                onEditMember={(m) => {
                  setEditingMember(m);
                  setShowMemberModal(true);
                }}
                onDeleteMember={handleDeleteMember}
                onOpenPricing={() => setShowPricingModal(true)}
                onOpenApk={() => setShowApkModal(true)}
                onOpenShareLanding={() => setShowShareLandingModal(true)}
                onLogout={() => {
                  api.logout();
                  setUser(null);
                  showToast('Você saiu da sua conta.');
                  setShowAuthModal(true);
                  loadUserData();
                }}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onClearAllData={handleClearAllData}
                onDeleteAccount={async () => {
                  await api.deleteMyAccount();
                  setUser(null);
                  showToast('Sua conta e dados foram excluídos com sucesso.');
                  setShowAuthModal(true);
                  loadUserData();
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation - only when user is logged in */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-between">
            <button
              onClick={() => setActiveView('home')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition ${
                activeView === 'home'
                  ? 'text-teal-700 dark:text-teal-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Início</span>
            </button>

            <button
              onClick={() => setActiveView('medicines')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition ${
                activeView === 'medicines'
                  ? 'text-teal-700 dark:text-teal-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span className="text-[10px]">Remédios</span>
            </button>

            {/* Central Add Button */}
            <button
              onClick={() => {
                setEditingMedicine(null);
                setShowMedicineForm(true);
              }}
              className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-teal-700/40 ring-4 ring-white dark:ring-slate-900 transition active:scale-90"
              title="Cadastrar Novo Medicamento"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition ${
                activeView === 'history'
                  ? 'text-teal-700 dark:text-teal-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[10px]">Histórico</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition ${
                activeView === 'settings'
                  ? 'text-teal-700 dark:text-teal-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-[10px]">Ajustes</span>
            </button>
          </div>
        </nav>
      )}

      {/* Fullscreen Alarm Overlay */}
      {activeAlarm && (
        <AlarmOverlay
          alarm={activeAlarm}
          onTake={handleAlarmTake}
          onSnooze={handleAlarmSnooze}
          snoozeMinutes={settings.snoozeMinutes}
        />
      )}

      {/* Medicine Add / Edit Modal */}
      {showMedicineForm && (
        <MedicineFormModal
          initialData={editingMedicine}
          members={members}
          selectedMemberId={selectedMemberId}
          onSave={handleSaveMedicine}
          onClose={() => {
            setShowMedicineForm(false);
            setEditingMedicine(null);
          }}
          onOpenAiHelper={() => setShowAiModal(true)}
        />
      )}

      {/* Medicine Details Modal */}
      {detailMedicine && (
        <MedicineDetailModal
          medicine={detailMedicine}
          member={members.find((m) => m.id === detailMedicine.memberId)}
          history={history}
          onClose={() => setDetailMedicine(null)}
          onEdit={(med) => {
            setDetailMedicine(null);
            setEditingMedicine(med);
            setShowMedicineForm(true);
          }}
          onDelete={handleDeleteMedicine}
          onTakeDose={handleTakeDose}
          onUpdateStock={handleUpdateStock}
        />
      )}

      {/* Family Member Add / Edit Modal */}
      {showMemberModal && (
        <MemberModal
          initialData={editingMember}
          onClose={() => {
            setShowMemberModal(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          onDelete={editingMember ? handleDeleteMember : undefined}
        />
      )}

      {/* Micro-SaaS Stripe Pricing Modal */}
      {showPricingModal && (
        <PricingModal
          user={user}
          onClose={() => setShowPricingModal(false)}
          onCheckoutStripe={handleCheckoutStripe}
          onActivatePlan={handleActivatePlan}
        />
      )}

      {/* Multi-User Auth Modal */}
      {showAuthModal && (
        <AuthModal
          user={user}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, pass) => {
            const res = await api.login(email, pass);
            setUser(res.user);
            showToast(`Bem-vindo(a), ${res.user.name}!`);
            loadUserData();
          }}
          onRegister={async (n, email, pass, plan, role, accountType, orgName) => {
            const res = await api.register(n, email, pass, plan || 'free', role || 'user', accountType || 'personal', orgName);
            setUser(res.user);
            showToast(`Conta SaaS criada com sucesso, ${res.user.name}!`);
            loadUserData();
          }}
          onDemoLogin={async (demoId) => {
            const res = await api.demoLogin(demoId);
            setUser(res.user);
            showToast(`Entrou como ${res.user.name}!`);
            loadUserData();
          }}
          onUpdateProfile={async (n, email) => {
            const updated = await api.updateProfile(n, email);
            setUser(updated);
            showToast('Perfil atualizado!');
          }}
          onLogout={() => {
            api.logout();
            setUser(null);
            showToast('Você saiu da sua conta.');
            loadUserData();
          }}
        />
      )}

      {/* Micro-SaaS Metrics Modal (Admin / Overview) */}
      {showSaasMetricsModal && (
        <SaasMetricsModal
          user={user}
          onClose={() => setShowSaasMetricsModal(false)}
          onOpenAuth={() => setShowAuthModal(true)}
          onImpersonateUser={handleImpersonateUser}
          onReloadUserData={loadUserData}
        />
      )}

      {/* APK & PWA Export Modal */}
      {showApkModal && <ApkExportModal onClose={() => setShowApkModal(false)} />}

      {/* Gemini AI Assistant Modal */}
      {showAiModal && <AiAssistantModal onClose={() => setShowAiModal(false)} />}

      {/* Share & Landing Page Promoter Modal */}
      {showShareLandingModal && (
        <ShareLandingModal
          onClose={() => setShowShareLandingModal(false)}
          onOpenApk={() => {
            setShowShareLandingModal(false);
            setShowApkModal(true);
          }}
          onOpenPricing={() => {
            setShowShareLandingModal(false);
            setShowPricingModal(true);
          }}
          onLogout={() => {
            setShowShareLandingModal(false);
            localStorage.removeItem('shdr_impersonating_admin');
            setImpersonatingAdmin(null);
            api.logout();
            setUser(null);
            showToast('Você saiu da sua conta para testar o modo visitante.');
            loadUserData();
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-teal-500/40 text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <span>💊</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

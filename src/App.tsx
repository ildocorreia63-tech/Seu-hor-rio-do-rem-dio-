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
import { Home, Pill, Plus, ClipboardList, Settings as SettingsIcon } from 'lucide-react';
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      let currentUser: User | null = null;
      try {
        currentUser = await api.getMe();
      } catch {
        // If no active session, auto-login with default demo user
        const demo = await api.demoLogin('user-demo-1');
        currentUser = demo.user;
      }
      setUser(currentUser);

      const [loadedMembers, loadedMeds, loadedHistory] = await Promise.all([
        api.getMembers(),
        api.getMedicines(),
        api.getHistory(),
      ]);

      setMembers(loadedMembers);
      setMedicines(loadedMeds);
      setHistory(loadedHistory);
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

    loadUserData();

    // Check URL for Stripe return status
    const urlParams = new URLSearchParams(window.location.search);
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

  // Sync data to AlarmManager on change
  useEffect(() => {
    alarmManager.updateData(medicines, members, settings);
  }, [medicines, members, settings]);

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
        onLogout={() => {
          api.logout();
          setUser(null);
          showToast('Você saiu da sua conta.');
          setShowAuthModal(true);
          loadUserData();
        }}
      />

      {/* Family Member Filter Bar */}
      <MemberBar
        members={members}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        onAddMember={() => {
          setEditingMember(null);
          setShowMemberModal(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-5 mb-16">
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
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
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
          onRegister={async (n, email, pass) => {
            const res = await api.register(n, email, pass, 'free');
            setUser(res.user);
            showToast(`Conta criada com sucesso, ${res.user.name}!`);
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

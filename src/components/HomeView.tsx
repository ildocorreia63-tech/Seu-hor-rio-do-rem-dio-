import React, { useState, useEffect } from 'react';
import { Medicine, FamilyMember, DoseRecord, User } from '../types';
import { Clock, Check, Plus, AlertTriangle, Sparkles, ChevronRight, ShieldCheck, Pill, Share2, Smartphone, LogOut, Award, QrCode } from 'lucide-react';
import { AlarmDiagnosticBanner } from './AlarmDiagnosticBanner';

interface HomeViewProps {
  user: User | null;
  medicines: Medicine[];
  members: FamilyMember[];
  history: DoseRecord[];
  selectedMemberId: string;
  onAddMedicine: () => void;
  onSelectMedicine: (med: Medicine) => void;
  onTakeDose: (med: Medicine, time: string) => void;
  onOpenPricing: () => void;
  onOpenShareLanding?: () => void;
  onOpenApk?: () => void;
  onLogout?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  medicines,
  members,
  history,
  selectedMemberId,
  onAddMedicine,
  onSelectMedicine,
  onTakeDose,
  onOpenPricing,
  onOpenShareLanding,
  onOpenApk,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];
  const currentHourMin = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

  // Filter medicines by member
  const filteredMeds = medicines.filter(m => {
    if (!m.active) return false;
    if (selectedMemberId !== 'all' && m.memberId !== selectedMemberId) return false;
    return true;
  });

  // Calculate today's dose schedule
  const todayDoses: Array<{
    medicine: Medicine;
    member?: FamilyMember;
    time: string;
    isTaken: boolean;
    takenRecord?: DoseRecord;
  }> = [];

  const dayOfWeek = currentTime.getDay();

  filteredMeds.forEach(med => {
    if (med.frequencyType === 'week' && med.weekDays && !med.weekDays.includes(dayOfWeek)) {
      return;
    }

    const member = members.find(m => m.id === med.memberId);

    (med.times || []).forEach(t => {
      const takenRecord = history.find(h =>
        h.medicineId === med.id &&
        h.scheduledDate === todayStr &&
        h.scheduledTime === t &&
        h.status === 'taken'
      );

      todayDoses.push({
        medicine: med,
        member,
        time: t,
        isTaken: !!takenRecord,
        takenRecord,
      });
    });
  });

  // Sort today's doses chronologically
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));

  // Find next upcoming dose
  const nextDose = todayDoses.find(d => !d.isTaken && d.time >= currentHourMin) ||
    todayDoses.find(d => !d.isTaken);

  // Formatted date string in PT-BR
  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Visão Geral Diária
          </span>
          <h2 className="text-xl sm:text-2xl font-black capitalize text-slate-900 dark:text-slate-100">
            {formattedDate}
          </h2>
        </div>

        <button
          onClick={onAddMedicine}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-sm font-black shadow-md shadow-teal-600/30 transition active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ Remédio</span>
        </button>
      </div>

      {/* Account Suspended / Blocked Alert */}
      {user?.subscriptionStatus === 'canceled' && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-800 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-red-800 dark:text-red-200">
              Conta com Acesso Restrito / Bloqueado
            </h4>
            <p className="text-xs text-red-700 dark:text-red-300">
              Sua assinatura está suspensa ou foi bloqueada pela administração. A criação de novos remédios e membros está pausada.
            </p>
            <button
              onClick={onOpenPricing}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
            >
              Regularizar Assinatura
            </button>
          </div>
        </div>
      )}

      {/* Alarm & Background Delivery Diagnostics Bar */}
      <AlarmDiagnosticBanner />

      {/* Hero Next Dose Card - Super Prominent for Seniors */}
      {nextDose ? (
        <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border-2 border-teal-500/50 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs sm:text-sm font-black text-teal-100 tracking-wider uppercase">
              <Clock className="w-4 h-4 text-amber-300" />
              PRÓXIMA DOSE DE HOJE
            </span>
            <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-wider">
              {nextDose.time}
            </span>
          </div>

          <div className="flex items-center gap-4 my-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {nextDose.medicine.photoUrl ? (
                <img
                  src={nextDose.medicine.photoUrl}
                  alt={nextDose.medicine.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-4xl">💊</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold truncate text-white leading-tight">
                {nextDose.medicine.name}
              </h3>
              <p className="text-base sm:text-lg text-teal-100 font-bold mt-1">
                {nextDose.medicine.dosage || '1 dose prescrita'}
                {nextDose.member && (
                  <span className="ml-2 px-2.5 py-1 rounded-full bg-teal-950/70 text-xs sm:text-sm font-extrabold text-teal-200 inline-flex items-center gap-1 border border-teal-700/60">
                    {nextDose.member.emoji} {nextDose.member.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-sm sm:text-base text-teal-200 font-semibold">
              Estoque restante: <strong className="text-white font-black">{nextDose.medicine.quantity} {nextDose.medicine.unit || 'unidades'}</strong>
            </div>

            <button
              onClick={() => onTakeDose(nextDose.medicine, nextDose.time)}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-teal-950 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Tomei Agora</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-6 shadow-md border-2 border-teal-700/60 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-700/70 flex items-center justify-center text-3xl shrink-0">
            🎉
          </div>
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl">Tudo em dia para hoje!</h3>
            <p className="text-sm text-teal-200 font-medium">
              Nenhuma dose pendente para o horário atual. Parabéns por cuidar da sua saúde!
            </p>
          </div>
        </div>
      )}

      {/* Free Plan Upgrade Teaser if on free */}
      {user && user.plan === 'free' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                Você está no Plano Gratuito ({filteredMeds.length}/{user.maxMeds} remédios)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Desbloqueie remédios ilimitados, fotos de receitas e múltiplos membros.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPricing}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shrink-0 shadow-sm transition active:scale-95"
          >
            Ver Planos
          </button>
        </div>
      )}

      {/* Painel de Logomarca & Divulgação Quick Action Banner */}
      {onOpenShareLanding && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-900/90 via-slate-900 to-emerald-950 text-white border-2 border-teal-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              💊
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  Divulgação & Marca
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                Painel de Logomarca Oficial
              </h4>
              <p className="text-xs text-teal-200/90 line-clamp-1">
                Compartilhe pelo WhatsApp, gere QR Code e envie para outros celulares.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenShareLanding}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Abrir Painel</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-teal-100 rounded-2xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
                title="Desconectar e ver a tela de apresentação inicial para visitantes"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sair / Trocar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Today's Schedule Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Horários de Hoje</span>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
              {todayDoses.filter(d => d.isTaken).length}/{todayDoses.length} tomados
            </span>
          </h3>
        </div>

        {todayDoses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-slate-600 dark:text-slate-400 text-base font-medium">
            Nenhum medicamento programado para hoje.
          </div>
        ) : (
          <div className="space-y-3">
            {todayDoses.map((dose, idx) => (
              <div
                key={`${dose.medicine.id}-${dose.time}-${idx}`}
                className={`p-4 rounded-3xl border-2 transition flex items-center justify-between gap-3 ${
                  dose.isTaken
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex flex-col items-center justify-center w-14 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 font-black text-sm text-teal-800 dark:text-teal-300">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-0.5" />
                    <span>{dose.time}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-extrabold text-base sm:text-lg truncate ${dose.isTaken ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {dose.medicine.name}
                      </h4>
                      {dose.member && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {dose.member.emoji} {dose.member.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold truncate">
                      {dose.medicine.dosage || '1 dose prescrita'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {dose.isTaken ? (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3.5 py-1.5 rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tomado</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onTakeDose(dose.medicine, dose.time)}
                      className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tomar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Medicines Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Meus Medicamentos</span>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
              {filteredMeds.length}
            </span>
          </h3>
        </div>

        {filteredMeds.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-4xl">
              💊
            </div>
            <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Nenhum medicamento cadastrado
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
              Cadastre seu primeiro medicamento para criar lembretes automáticos com alarme e controle de estoque.
            </p>
            <button
              onClick={onAddMedicine}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm shadow-md transition active:scale-95 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Cadastrar Medicamento</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredMeds.map((med) => {
              const isLowStock = med.quantity <= 3;
              const member = members.find(m => m.id === med.memberId);

              return (
                <div
                  key={med.id}
                  onClick={() => onSelectMedicine(med)}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 hover:border-teal-500 dark:hover:border-teal-500 transition cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          {med.photoUrl ? (
                            <img
                              src={med.photoUrl}
                              alt={med.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-2xl">💊</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
                            {med.name}
                          </h4>
                          <p className="text-sm text-teal-700 dark:text-teal-400 font-bold truncate">
                            {med.dosage || '1 dose'}
                          </p>
                        </div>
                      </div>

                      {member && (
                        <span className="text-xs sm:text-sm font-extrabold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
                          {member.emoji}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-2.5">
                      {(med.times || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-black"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm mt-2">
                    <span className={`font-bold ${isLowStock ? 'text-red-500 font-extrabold flex items-center gap-1' : 'text-slate-600 dark:text-slate-400'}`}>
                      {isLowStock && <AlertTriangle className="w-4 h-4" />}
                      Estoque: {med.quantity} {med.unit || 'unid.'}
                    </span>

                    <span className="text-teal-700 dark:text-teal-400 font-black flex items-center gap-1 hover:underline">
                      Ver Detalhes <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

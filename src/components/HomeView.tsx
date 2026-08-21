import React, { useState, useEffect } from 'react';
import { Medicine, FamilyMember, DoseRecord, User } from '../types';
import { Clock, Check, Plus, AlertTriangle, Sparkles, ChevronRight, ShieldCheck, Pill } from 'lucide-react';

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
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Visão Geral Diária
          </span>
          <h2 className="text-xl font-extrabold capitalize text-slate-800 dark:text-slate-100">
            {formattedDate}
          </h2>
        </div>

        <button
          onClick={onAddMedicine}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Remédio</span>
        </button>
      </div>

      {/* Hero Next Dose Card */}
      {nextDose ? (
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 text-white rounded-3xl p-5 shadow-xl shadow-teal-950/20 border border-teal-600/40 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-teal-100 tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              PRÓXIMA DOSE DE HOJE
            </span>
            <span className="text-2xl font-black text-amber-300 tracking-wider">
              {nextDose.time}
            </span>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {nextDose.medicine.photoUrl ? (
                <img
                  src={nextDose.medicine.photoUrl}
                  alt={nextDose.medicine.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl">💊</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold truncate text-white">
                {nextDose.medicine.name}
              </h3>
              <p className="text-sm text-teal-100 font-medium">
                {nextDose.medicine.dosage || '1 dose'}
                {nextDose.member && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-950/50 text-[11px] font-semibold text-teal-200">
                    {nextDose.member.emoji} {nextDose.member.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-3">
            <div className="text-xs text-teal-200">
              Estoque: <strong>{nextDose.medicine.quantity} {nextDose.medicine.unit || 'unidades'}</strong>
            </div>

            <button
              onClick={() => onTakeDose(nextDose.medicine, nextDose.time)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-teal-950 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Tomei Agora</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-5 shadow-md border border-teal-700/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-700/60 flex items-center justify-center text-2xl shrink-0">
            🎉
          </div>
          <div>
            <h3 className="font-bold text-base">Tudo em dia para hoje!</h3>
            <p className="text-xs text-teal-200">
              Nenhuma dose pendente para o horário atual. Parabéns por cuidar da sua saúde!
            </p>
          </div>
        </div>
      )}

      {/* Free Plan Upgrade Teaser if on free */}
      {user && user.plan === 'free' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Você está no Plano Gratuito ({filteredMeds.length}/{user.maxMeds} remédios)
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Desbloqueie remédios ilimitados, fotos de receitas e múltiplos membros.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPricing}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shrink-0 shadow-sm transition active:scale-95"
          >
            Ver Planos
          </button>
        </div>
      )}

      {/* Today's Schedule Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Hoje</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
              {todayDoses.filter(d => d.isTaken).length}/{todayDoses.length} tomados
            </span>
          </h3>
        </div>

        {todayDoses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            Nenhum medicamento programado para hoje.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayDoses.map((dose, idx) => (
              <div
                key={`${dose.medicine.id}-${dose.time}-${idx}`}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  dose.isTaken
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center w-12 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 font-bold text-xs">
                    <Clock className="w-3 h-3 text-slate-400 mb-0.5" />
                    <span>{dose.time}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-bold text-sm truncate ${dose.isTaken ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                        {dose.medicine.name}
                      </h4>
                      {dose.member && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          ({dose.member.emoji} {dose.member.name.split(' ')[0]})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {dose.medicine.dosage || '1 dose'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {dose.isTaken ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tomado</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onTakeDose(dose.medicine, dose.time)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
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
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Meus Medicamentos</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
              {filteredMeds.length}
            </span>
          </h3>
        </div>

        {filteredMeds.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-3xl">
              💊
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
              Nenhum medicamento cadastrado
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Cadastre seu primeiro medicamento para criar lembretes automáticos com alarme e controle de estoque.
            </p>
            <button
              onClick={onAddMedicine}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cadastrar Medicamento</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMeds.map((med) => {
              const isLowStock = med.quantity <= 3;
              const member = members.find(m => m.id === med.memberId);

              return (
                <div
                  key={med.id}
                  onClick={() => onSelectMedicine(med)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-teal-500 dark:hover:border-teal-500 transition cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {med.photoUrl ? (
                            <img
                              src={med.photoUrl}
                              alt={med.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xl">💊</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {med.name}
                          </h4>
                          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate">
                            {med.dosage || '1 dose'}
                          </p>
                        </div>
                      </div>

                      {member && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
                          {member.emoji}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 my-2">
                      {(med.times || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mt-2">
                    <span className={`font-medium ${isLowStock ? 'text-red-500 font-bold flex items-center gap-1' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                      Estoque: {med.quantity} {med.unit || 'unid.'}
                    </span>

                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-0.5 hover:underline">
                      Detalhes <ChevronRight className="w-3.5 h-3.5" />
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

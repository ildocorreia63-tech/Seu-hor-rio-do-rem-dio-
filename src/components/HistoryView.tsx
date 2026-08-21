import React, { useState } from 'react';
import { DoseRecord, FamilyMember } from '../types';
import { CheckCircle2, Clock, Calendar, Download, Trash2, Award, TrendingUp, Filter } from 'lucide-react';

interface HistoryViewProps {
  history: DoseRecord[];
  members: FamilyMember[];
  selectedMemberId: string;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  members,
  selectedMemberId,
  onClearHistory,
}) => {
  const [filterMember, setFilterMember] = useState(selectedMemberId);

  const filtered = history.filter((h) => {
    if (filterMember !== 'all' && h.memberId !== filterMember) return false;
    return true;
  });

  const takenCount = filtered.filter((h) => h.status === 'taken').length;
  const totalCount = filtered.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Print/export medical report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Print Action */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Acompanhamento Clínico
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Histórico & Adesão
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            title="Imprimir Relatório para o Médico"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Relatório</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition"
              title="Limpar Histórico"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Adherence Rate */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-100 uppercase">Taxa de Adesão</span>
            <TrendingUp className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black">{adherenceRate}%</span>
          </div>
          <span className="text-[10px] text-teal-100">Meta recomendada: 90%+</span>
        </div>

        {/* Taken Doses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Doses Tomadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{takenCount}</span>
          </div>
          <span className="text-[10px] text-slate-400">Total registrado</span>
        </div>

        {/* Streak / Consistency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Consistência</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">🔥 Excelente</span>
          </div>
          <span className="text-[10px] text-slate-400">Tratamento regular</span>
        </div>
      </div>

      {/* Member Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
          <Filter className="w-3.5 h-3.5" />
          Filtrar:
        </span>
        <button
          onClick={() => setFilterMember('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
            filterMember === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Todos ({history.length})
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1 ${
              filterMember === m.id
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2">
          <div className="text-3xl">📋</div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Nenhum histórico registrado
          </h4>
          <p className="text-xs text-slate-400">
            As doses tomadas e confirmadas aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {item.medicineName}
                    </h4>
                    {item.memberName && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                        ({item.memberEmoji} {item.memberName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.scheduledTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full">
                  ✓ Tomado
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

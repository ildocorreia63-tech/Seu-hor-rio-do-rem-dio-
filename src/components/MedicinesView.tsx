import React, { useState } from 'react';
import { Medicine, FamilyMember, User } from '../types';
import { Search, Plus, FileText, ChevronRight, AlertCircle, Edit, Trash2 } from 'lucide-react';

interface MedicinesViewProps {
  user: User | null;
  medicines: Medicine[];
  members: FamilyMember[];
  selectedMemberId: string;
  onAddMedicine: () => void;
  onSelectMedicine: (med: Medicine) => void;
  onEditMedicine: (med: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
}

export const MedicinesView: React.FC<MedicinesViewProps> = ({
  user,
  medicines,
  members,
  selectedMemberId,
  onAddMedicine,
  onSelectMedicine,
  onEditMedicine,
  onDeleteMedicine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = medicines.filter((m) => {
    if (selectedMemberId !== 'all' && m.memberId !== selectedMemberId) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.dosage && m.dosage.toLowerCase().includes(q)) ||
        (m.doctorName && m.doctorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Top Search & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar medicamento ou médico..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        <button
          onClick={onAddMedicine}
          className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-600/20 transition active:scale-95 flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* List count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Exibindo <strong>{filtered.length}</strong> de {medicines.length} medicamentos
        </span>
      </div>

      {/* Medicines list */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
            Nenhum medicamento encontrado
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tente buscar com outro termo ou cadastre um novo medicamento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((med) => {
            const member = members.find((m) => m.id === med.memberId);
            const isLowStock = med.quantity <= 3;

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition relative group"
              >
                <div className="flex items-start gap-3">
                  {/* Photo / Icon */}
                  <div
                    onClick={() => onSelectMedicine(med)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer shadow-inner"
                  >
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

                  {/* Info */}
                  <div
                    onClick={() => onSelectMedicine(med)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                        {med.name}
                      </h3>
                      {member && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                          {member.emoji} {member.name.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                      {med.dosage || '1 dose'}
                    </p>

                    {/* Schedule times chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(med.times || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold"
                        >
                          ⏰ {t}
                        </span>
                      ))}

                      {med.frequencyType === 'interval' && med.intervalHours && (
                        <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded text-[11px]">
                          A cada {med.intervalHours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => onEditMedicine(med)}
                      className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                      title="Editar Medicamento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMedicine(med.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                      title="Excluir Medicamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={isLowStock ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                      Estoque: <strong>{med.quantity} {med.unit || 'unid.'}</strong>
                    </span>

                    {med.doctorName && (
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        Dr(a): {med.doctorName}
                      </span>
                    )}
                  </div>

                  {med.prescriptionPhotoUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                      <FileText className="w-3 h-3" />
                      Receita Anexa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

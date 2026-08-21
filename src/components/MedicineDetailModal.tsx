import React, { useState } from 'react';
import { Medicine, FamilyMember, DoseRecord } from '../types';
import { X, Clock, Edit, Trash2, Plus, AlertCircle, FileText, CheckCircle2, Maximize2 } from 'lucide-react';

interface MedicineDetailModalProps {
  medicine: Medicine | null;
  member?: FamilyMember;
  history: DoseRecord[];
  onClose: () => void;
  onEdit: (med: Medicine) => void;
  onDelete: (id: string) => void;
  onTakeDose: (med: Medicine, time: string) => void;
  onUpdateStock: (id: string, newQty: number) => Promise<void>;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  member,
  history,
  onClose,
  onEdit,
  onDelete,
  onTakeDose,
  onUpdateStock,
}) => {
  const [zoomRx, setZoomRx] = useState(false);
  const [isReplenishing, setIsReplenishing] = useState(false);
  const [addQty, setAddQty] = useState(30);

  if (!medicine) return null;

  const medHistory = history.filter((h) => h.medicineId === medicine.id);
  const isLowStock = medicine.quantity <= 3;

  const handleReplenish = async () => {
    await onUpdateStock(medicine.id, medicine.quantity + Number(addQty));
    setIsReplenishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Top Header */}
        <div className="bg-teal-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-teal-700 text-teal-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {medicine.photoUrl ? (
                <img
                  src={medicine.photoUrl}
                  alt={medicine.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl">💊</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                {member ? `${member.emoji} ${member.name}` : 'Medicamento'}
              </span>
              <h2 className="text-xl font-bold truncate leading-tight">{medicine.name}</h2>
              <p className="text-xs text-teal-100 font-semibold mt-0.5">{medicine.dosage}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Stock banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            isLowStock
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <div>
              <span className="text-xs block">Estoque Disponível</span>
              <strong className="text-base font-extrabold">
                {medicine.quantity} {medicine.unit || 'unidades'}
              </strong>
              {isLowStock && <span className="text-[11px] block text-red-500 font-bold">⚠️ Estoque crítico!</span>}
            </div>

            <button
              onClick={() => setIsReplenishing(!isReplenishing)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              + Reabastecer
            </button>
          </div>

          {/* Quick Replenish Box */}
          {isReplenishing && (
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-3.5 flex items-center gap-2">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Adicionar:</span>
              <input
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(Number(e.target.value))}
                className="w-16 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold"
              />
              <button
                onClick={handleReplenish}
                className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700"
              >
                Salvar Estoque
              </button>
            </div>
          )}

          {/* Schedule times */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Horários de Tomada
            </h4>
            <div className="flex flex-wrap gap-2">
              {(medicine.times || []).map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex-1 min-w-[120px]"
                >
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    ⏰ {t}
                  </span>
                  <button
                    onClick={() => onTakeDose(medicine, t)}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    Tomar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions / Notes */}
          {medicine.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Instruções do Médico:</strong>
                <p className="mt-0.5">{medicine.notes}</p>
              </div>
            </div>
          )}

          {/* Doctor & Prescription Details */}
          {(medicine.doctorName || medicine.prescriptionPhotoUrl) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
                <FileText className="w-4 h-4" />
                <span>Receita Médica Prescrita</span>
              </div>

              {medicine.doctorName && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Médico: <strong>{medicine.doctorName}</strong> {medicine.doctorCrm && `(${medicine.doctorCrm})`}
                </div>
              )}

              {medicine.prescriptionPhotoUrl && (
                <div>
                  <div
                    onClick={() => setZoomRx(true)}
                    className="relative w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer group shadow-sm"
                  >
                    <img
                      src={medicine.prescriptionPhotoUrl}
                      alt="Receita Médica"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>Ampliar Receita</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medicine History */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Últimas Doses Registradas
            </h4>
            {medHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma dose registrada ainda.</p>
            ) : (
              <div className="space-y-1.5">
                {medHistory.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {h.scheduledDate} às {h.scheduledTime}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tomado
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onDelete(medicine.id);
              }}
              className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(medicine);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Zoom Modal */}
      {zoomRx && medicine.prescriptionPhotoUrl && (
        <div
          onClick={() => setZoomRx(false)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={medicine.prescriptionPhotoUrl}
            alt="Receita Médica Ampliada"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};

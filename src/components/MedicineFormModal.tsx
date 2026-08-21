import React, { useState, useRef } from 'react';
import { Medicine, FamilyMember } from '../types';
import { Camera, X, Plus, Trash2, ChevronDown, FileText, Sparkles } from 'lucide-react';

interface MedicineFormModalProps {
  initialData?: Medicine | null;
  members: FamilyMember[];
  selectedMemberId: string;
  onSave: (data: Partial<Medicine>) => Promise<void>;
  onClose: () => void;
  onOpenAiHelper?: () => void;
}

export const MedicineFormModal: React.FC<MedicineFormModalProps> = ({
  initialData,
  members,
  selectedMemberId,
  onSave,
  onClose,
  onOpenAiHelper,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [memberId, setMemberId] = useState(
    initialData?.memberId || (selectedMemberId !== 'all' ? selectedMemberId : members[0]?.id || '')
  );
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [quantity, setQuantity] = useState<number | string>(initialData?.quantity ?? 30);
  const [unit, setUnit] = useState(initialData?.unit || 'comprimidos');

  const [frequencyType, setFrequencyType] = useState<'daily' | 'interval' | 'week'>(
    initialData?.frequencyType || 'daily'
  );
  const [intervalHours, setIntervalHours] = useState(initialData?.intervalHours || 8);
  const [intervalStartTime, setIntervalStartTime] = useState(initialData?.intervalStartTime || '08:00');
  const [weekDays, setWeekDays] = useState<number[]>(initialData?.weekDays || [0, 1, 2, 3, 4, 5, 6]);

  const [times, setTimes] = useState<string[]>(initialData?.times || ['08:00']);
  const [startDate, setStartDate] = useState(
    initialData?.startDate || new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState(initialData?.durationDays ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');

  // Prescription section
  const [showRx, setShowRx] = useState(
    !!(initialData?.doctorName || initialData?.doctorCrm || initialData?.prescriptionPhotoUrl)
  );
  const [doctorName, setDoctorName] = useState(initialData?.doctorName || '');
  const [doctorCrm, setDoctorCrm] = useState(initialData?.doctorCrm || '');
  const [prescriptionDate, setPrescriptionDate] = useState(initialData?.prescriptionDate || '');
  const [prescriptionPhotoUrl, setPrescriptionPhotoUrl] = useState(initialData?.prescriptionPhotoUrl || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const rxPhotoInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isRx: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (isRx) {
        setPrescriptionPhotoUrl(base64);
      } else {
        setPhotoUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Recalculate times when interval changes
  const updateIntervalTimes = (hrs: number, start: string) => {
    setIntervalHours(hrs);
    setIntervalStartTime(start);
    const [startH, startM] = start.split(':').map(Number);
    const newTimes: string[] = [];
    const count = Math.floor(24 / hrs);
    for (let i = 0; i < count; i++) {
      const totalHours = (startH + i * hrs) % 24;
      newTimes.push(
        `${String(totalHours).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
      );
    }
    setTimes(newTimes);
  };

  const handleAddTime = () => {
    setTimes([...times, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (times.length <= 1) return;
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, val: string) => {
    const newTimes = [...times];
    newTimes[index] = val;
    setTimes(newTimes);
  };

  const toggleWeekDay = (dayIndex: number) => {
    if (weekDays.includes(dayIndex)) {
      if (weekDays.length === 1) return; // Keep at least one
      setWeekDays(weekDays.filter(d => d !== dayIndex));
    } else {
      setWeekDays([...weekDays, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome do medicamento.');
      return;
    }
    if (!times.length) {
      setErrorMsg('Informe ao menos um horário.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await onSave({
        name: name.trim(),
        memberId: memberId || members[0]?.id || 'default',
        dosage: dosage.trim() || '1 dose',
        quantity: Number(quantity) || 0,
        unit,
        frequencyType,
        intervalHours: frequencyType === 'interval' ? Number(intervalHours) : undefined,
        intervalStartTime: frequencyType === 'interval' ? intervalStartTime : undefined,
        weekDays: frequencyType === 'week' ? weekDays : undefined,
        times,
        startDate,
        durationDays: Number(durationDays),
        notes: notes.trim(),
        photoUrl,
        doctorName: doctorName.trim(),
        doctorCrm: doctorCrm.trim(),
        prescriptionDate,
        prescriptionPhotoUrl,
        active: true,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar medicamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <h2 className="font-bold text-lg">
              {initialData ? 'Editar Medicamento' : 'Cadastrar Medicamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Photo Preview & Upload */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-teal-500/50 hover:border-teal-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition relative shadow-inner group"
            >
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt="Foto do remédio"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                    Alterar
                  </div>
                </>
              ) : (
                <div className="text-center p-2 text-slate-400 dark:text-slate-500">
                  <Camera className="w-6 h-6 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                  <span className="text-[10px] font-semibold block leading-tight">Foto do remédio</span>
                </div>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoChange(e, false)}
              className="hidden"
            />

            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="text-xs text-red-500 hover:underline"
              >
                Remover foto
              </button>
            )}
          </div>

          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome do medicamento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Losartana, Dipirona, Insulina..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Family Member Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Para quem é este remédio?
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name} ({m.relation || 'Familiar'})
                </option>
              ))}
            </select>
          </div>

          {/* Dosage and Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dosagem
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ex: 50mg, 1 cp, 10 gotas"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estoque atual (Qtd)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="30"
                  className="w-20 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-2 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                >
                  <option value="comprimidos">comprimidos</option>
                  <option value="cápsulas">cápsulas</option>
                  <option value="gotas">gotas</option>
                  <option value="ml">ml</option>
                  <option value="doses">doses</option>
                  <option value="ampolas">ampolas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Frequency Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Frequência de uso *
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFrequencyType('daily')}
                className={`py-2 rounded-lg transition ${
                  frequencyType === 'daily'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos os dias
              </button>
              <button
                type="button"
                onClick={() => {
                  setFrequencyType('interval');
                  updateIntervalTimes(intervalHours, intervalStartTime);
                }}
                className={`py-2 rounded-lg transition ${
                  frequencyType === 'interval'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                A cada X horas
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('week')}
                className={`py-2 rounded-lg transition ${
                  frequencyType === 'week'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Dias da semana
              </button>
            </div>
          </div>

          {/* If Interval */}
          {frequencyType === 'interval' && (
            <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-teal-900 dark:text-teal-200 mb-1">
                    Intervalo de horas
                  </label>
                  <select
                    value={intervalHours}
                    onChange={(e) => updateIntervalTimes(Number(e.target.value), intervalStartTime)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="4">A cada 4 horas (6x ao dia)</option>
                    <option value="6">A cada 6 horas (4x ao dia)</option>
                    <option value="8">A cada 8 horas (3x ao dia)</option>
                    <option value="12">A cada 12 horas (2x ao dia)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal-900 dark:text-teal-200 mb-1">
                    1ª dose do dia
                  </label>
                  <input
                    type="time"
                    value={intervalStartTime}
                    onChange={(e) => updateIntervalTimes(intervalHours, e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* If Specific Weekdays */}
          {frequencyType === 'week' && (
            <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-2">
                Selecione os dias da semana
              </label>
              <div className="grid grid-cols-7 gap-1">
                {daysLabel.map((day, idx) => {
                  const active = weekDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleWeekDay(idx)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition ${
                        active
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scheduled Times List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Horários das doses *
              </label>
              {frequencyType !== 'interval' && (
                <button
                  type="button"
                  onClick={handleAddTime}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar horário</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {times.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <input
                    type="time"
                    required
                    value={t}
                    disabled={frequencyType === 'interval'}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                  {frequencyType !== 'interval' && times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Duration & Start */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Início do tratamento
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Duração
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-semibold"
              >
                <option value="0">Uso Contínuo</option>
                <option value="3">3 dias</option>
                <option value="5">5 dias</option>
                <option value="7">7 dias (1 semana)</option>
                <option value="10">10 dias</option>
                <option value="14">14 dias (2 semanas)</option>
                <option value="21">21 dias</option>
                <option value="30">30 dias (1 mês)</option>
                <option value="60">60 dias (2 meses)</option>
                <option value="90">90 dias (3 meses)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instruções e Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tomar após as refeições com bastante água..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
            />
          </div>

          {/* Collapsible Doctor & Prescription Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRx(!showRx)}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>🩺 Dados da Receita Médica (Opcional)</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition ${showRx ? 'rotate-180' : ''}`} />
            </button>

            {showRx && (
              <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Médico(a)
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Ex: Dr. Roberto Mendes"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      CRM
                    </label>
                    <input
                      type="text"
                      value={doctorCrm}
                      onChange={(e) => setDoctorCrm(e.target.value)}
                      placeholder="Ex: CRM/SP 12345"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Foto da Receita Médica
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => rxPhotoInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-teal-500/50 hover:border-teal-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner text-center p-1"
                    >
                      {prescriptionPhotoUrl ? (
                        <img
                          src={prescriptionPhotoUrl}
                          alt="Receita"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-slate-400">
                          <FileText className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                          <span className="text-[9px] font-bold block">Adicionar Foto</span>
                        </div>
                      )}
                    </div>

                    <input
                      ref={rxPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, true)}
                      className="hidden"
                    />

                    {prescriptionPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setPrescriptionPhotoUrl('')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remover Foto da Receita
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : '💾 Salvar Medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { ActiveAlarm } from '../services/alarmManager';
import { audio } from '../services/audio';
import { Bell, Check, Clock, Volume2, User, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AlarmOverlayProps {
  alarm: ActiveAlarm | null;
  onTake: (alarm: ActiveAlarm) => void;
  onSnooze: (alarm: ActiveAlarm, minutes: number) => void;
  snoozeMinutes: number;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({
  alarm,
  onTake,
  onSnooze,
  snoozeMinutes,
}) => {
  if (!alarm) return null;

  const { medicine, member, scheduledTime, isSnoozed } = alarm;

  const handleTake = () => {
    audio.stopAlarm();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
    onTake(alarm);
  };

  const handleSnooze = () => {
    audio.stopAlarm();
    onSnooze(alarm, snoozeMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-teal-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden text-slate-900 dark:text-white transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top pulsing header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-6 py-5 text-center relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[11px] bg-red-800/60 px-2 py-0.5 rounded-full">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>Alarme Ativo</span>
          </div>

          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2 alarm-pulse-ring">
            <Bell className="w-8 h-8 text-white animate-bounce" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {isSnoozed ? 'Lembrete de Soneca ⏰' : 'Hora do Remédio! ⏰'}
          </h2>
          <p className="text-2xl font-extrabold text-amber-200 tracking-wider mt-0.5">
            {scheduledTime}
          </p>
        </div>

        {/* Medicine Info */}
        <div className="p-6 text-center space-y-4">
          
          {/* Member tag if family */}
          {member && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200 text-xs font-semibold">
              <span>{member.emoji || '👤'}</span>
              <span>Paciente: {member.name}</span>
            </div>
          )}

          {/* Photo or Icon */}
          <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-teal-500/40 flex items-center justify-center overflow-hidden shadow-inner">
            {medicine.photoUrl ? (
              <img
                src={medicine.photoUrl}
                alt={medicine.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl">💊</span>
            )}
          </div>

          {/* Name & Dosage */}
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {medicine.name}
            </h3>
            <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
              Dosagem: {medicine.dosage || '1 dose prescrita'}
            </p>
          </div>

          {/* Stock status indicator */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Estoque restante:{' '}
            <strong className={medicine.quantity <= 3 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-200'}>
              {medicine.quantity} {medicine.unit || 'unidades'}
            </strong>
            {medicine.quantity <= 3 && (
              <span className="text-red-500 ml-1 font-semibold">⚠️ (Acabando!)</span>
            )}
          </div>

          {/* Notes / Special Instructions */}
          {medicine.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Instruções:</strong> {medicine.notes}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              onClick={handleSnooze}
              className="py-3.5 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Soneca ({snoozeMinutes}m)</span>
            </button>

            <button
              onClick={handleTake}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-teal-600/30 ring-2 ring-teal-400/50"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>✓ Tomei</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Ao confirmar &quot;Tomei&quot;, seu estoque será atualizado e registrado no histórico.
          </p>
        </div>
      </div>
    </div>
  );
};

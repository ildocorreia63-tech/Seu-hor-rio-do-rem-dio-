import { Medicine, AppSettings, FamilyMember } from '../types';
import { audio } from './audio';

export interface ActiveAlarm {
  medicine: Medicine;
  member?: FamilyMember;
  scheduledTime: string;
  isSnoozed?: boolean;
}

type AlarmCallback = (alarm: ActiveAlarm) => void;

class AlarmManager {
  private medicines: Medicine[] = [];
  private members: FamilyMember[] = [];
  private settings: AppSettings | null = null;
  private snoozedList: Array<{ medicineId: string; timeStr: string; triggerAt: number }> = [];
  private lastTriggeredMinute: string = '';
  private callback: AlarmCallback | null = null;
  private intervalId: any = null;

  init(callback: AlarmCallback) {
    this.callback = callback;
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), 5000);
      this.tick();
    }
  }

  updateData(medicines: Medicine[], members: FamilyMember[], settings: AppSettings) {
    this.medicines = medicines;
    this.members = members;
    this.settings = settings;
  }

  snooze(medicineId: string, scheduledTime: string, minutes: number = 10) {
    const triggerAt = Date.now() + minutes * 60 * 1000;
    this.snoozedList.push({ medicineId, timeStr: scheduledTime, triggerAt });
  }

  clearSnooze(medicineId: string) {
    this.snoozedList = this.snoozedList.filter(s => s.medicineId !== medicineId);
  }

  private tick() {
    if (!this.callback || !this.medicines.length) return;

    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentMinuteStr = `${currentHour}:${currentMin}`;
    const currentDayOfWeek = now.getDay(); // 0-6

    // Check snoozed alarms first
    const nowTime = now.getTime();
    const readySnoozes = this.snoozedList.filter(s => s.triggerAt <= nowTime);
    if (readySnoozes.length > 0) {
      readySnoozes.forEach(sn => {
        const med = this.medicines.find(m => m.id === sn.medicineId);
        if (med) {
          const member = this.members.find(m => m.id === med.memberId);
          this.triggerAlarm({
            medicine: med,
            member,
            scheduledTime: sn.timeStr,
            isSnoozed: true
          });
        }
      });
      this.snoozedList = this.snoozedList.filter(s => s.triggerAt > nowTime);
      return;
    }

    // Avoid duplicate triggers in the exact same minute
    if (this.lastTriggeredMinute === currentMinuteStr) return;

    for (const med of this.medicines) {
      if (!med.active) continue;

      // Check weekdays if weekly frequency
      if (med.frequencyType === 'week' && Array.isArray(med.weekDays)) {
        if (!med.weekDays.includes(currentDayOfWeek)) continue;
      }

      // Check if any of the medicine's scheduled times match
      if (med.times && med.times.includes(currentMinuteStr)) {
        const member = this.members.find(m => m.id === med.memberId);
        this.lastTriggeredMinute = currentMinuteStr;
        this.triggerAlarm({
          medicine: med,
          member,
          scheduledTime: currentMinuteStr,
          isSnoozed: false
        });
        break; // Trigger one alarm at a time
      }
    }
  }

  triggerAlarm(alarm: ActiveAlarm) {
    if (this.settings?.soundEnabled) {
      audio.startAlarm(this.settings.soundType || 'standard');
    }
    if (this.settings?.vibrateEnabled) {
      audio.vibrate();
    }
    if (this.settings?.voiceEnabled) {
      setTimeout(() => {
        audio.speak(`Atenção! É hora de tomar ${alarm.medicine.name}, dosagem ${alarm.medicine.dosage || ''}`);
      }, 500);
    }

    // System Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Hora do Remédio: ${alarm.medicine.name}`, {
          body: `Dose: ${alarm.medicine.dosage || '1 dose'} - ${alarm.member ? alarm.member.name : ''}`,
          icon: '/icons/icon-192.png',
          tag: `med-${alarm.medicine.id}-${alarm.scheduledTime}`,
        });
      } catch {}
    }

    if (this.callback) {
      this.callback(alarm);
    }
  }
}

export const alarmManager = new AlarmManager();

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
  private snoozedList: Array<{
    medicineId: string;
    medicineName?: string;
    dosage?: string;
    memberName?: string;
    timeStr: string;
    triggerAt: number;
  }> = [];
  private lastTriggeredMinute: string = '';
  private callback: AlarmCallback | null = null;
  private worker: Worker | null = null;
  private fallbackInterval: any = null;
  private isInitialized = false;

  public init(callback: AlarmCallback) {
    this.callback = callback;
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Inicia Web Worker em segundo plano (imune ao throttling de abas inativas)
    this.startBackgroundWorker();

    // 2. Intervalo de fallback padrão
    if (!this.fallbackInterval) {
      this.fallbackInterval = setInterval(() => this.tick(), 4000);
    }

    // 3. Listener para mensagens do Service Worker (ex: usuário clicou na notificação)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'NOTIFICATION_OPEN_ALARM' && msg.data) {
          const med = this.medicines.find(m => m.id === msg.data.medicineId) || {
            id: msg.data.medicineId,
            name: msg.data.medicineName || 'Medicamento',
            dosage: msg.data.dosage || '',
            quantity: 1,
            unit: 'unidades',
            frequencyType: 'day',
            times: [msg.data.scheduledTime || '08:00'],
            active: true,
            createdAt: new Date().toISOString()
          };
          const member = this.members.find(m => m.id === (med as any).memberId);
          this.triggerAlarm({
            medicine: med as Medicine,
            member,
            scheduledTime: msg.data.scheduledTime || 'Agora',
            isSnoozed: msg.data.isSnoozed
          });
        }
      });
    }

    // Primeira checagem imediata
    this.tick();
  }

  /**
   * Cria um Web Worker inline via Blob para manter o relógio disparando com precisão de 4s
   * mesmo quando a aba estiver minimizada ou em segundo plano.
   */
  private startBackgroundWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const workerCode = `
        var timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 4000);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = () => {
        this.tick();
      };
      this.worker.postMessage('start');
    } catch (e) {
      console.warn('Web Worker background timer fallback used:', e);
    }
  }

  /**
   * Atualiza remédios e membros e sincroniza com o Service Worker
   */
  public updateData(medicines: Medicine[], members: FamilyMember[], settings: AppSettings) {
    this.medicines = medicines;
    this.members = members;
    this.settings = settings;

    // Sincroniza os horários com o Service Worker para alertas com app fechado
    this.syncWithServiceWorker();
  }

  /**
   * Envia os horários para o Service Worker
   */
  public syncWithServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const payload = this.medicines.map(m => {
        const member = this.members.find(mem => mem.id === m.memberId);
        return {
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          times: m.times,
          frequencyType: m.frequencyType,
          weekDays: m.weekDays,
          active: m.active,
          memberName: member ? member.name : ''
        };
      });

      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_ALARMS',
        medicines: payload
      });
    }
  }

  public snooze(medicineId: string, scheduledTime: string, minutes: number = 10) {
    const triggerAt = Date.now() + minutes * 60 * 1000;
    const med = this.medicines.find(m => m.id === medicineId);
    const member = med ? this.members.find(m => m.id === med.memberId) : undefined;

    this.snoozedList.push({
      medicineId,
      medicineName: med?.name,
      dosage: med?.dosage,
      memberName: member?.name,
      timeStr: scheduledTime,
      triggerAt
    });

    // Comunica soneca ao Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SNOOZE_ALARM',
        medicineId,
        medicineName: med?.name,
        dosage: med?.dosage,
        memberName: member?.name,
        minutes
      });
    }
  }

  public clearSnooze(medicineId: string) {
    this.snoozedList = this.snoozedList.filter(s => s.medicineId !== medicineId);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_SNOOZE',
        medicineId
      });
    }
  }

  /**
   * Checagem periódica do relógio
   */
  private tick() {
    if (!this.medicines.length) return;

    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentMinuteStr = `${currentHour}:${currentMin}`;
    const currentDayOfWeek = now.getDay(); // 0-6
    const nowTime = now.getTime();

    // 1. Checa alarmes em soneca
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

    // 2. Evita disparos duplicados no mesmo minuto
    if (this.lastTriggeredMinute === currentMinuteStr) return;

    for (const med of this.medicines) {
      if (!med.active) continue;

      // Validação de dias da semana
      if (med.frequencyType === 'week' && Array.isArray(med.weekDays)) {
        if (!med.weekDays.includes(currentDayOfWeek)) continue;
      }

      // Validação de horários programados
      if (med.times && med.times.includes(currentMinuteStr)) {
        const member = this.members.find(m => m.id === med.memberId);
        this.lastTriggeredMinute = currentMinuteStr;
        this.triggerAlarm({
          medicine: med,
          member,
          scheduledTime: currentMinuteStr,
          isSnoozed: false
        });
        break; // Dispara um alarme por vez
      }
    }
  }

  /**
   * Dispara som, vibração, fala, notificação no sistema operacional e modal visual
   */
  public triggerAlarm(alarm: ActiveAlarm) {
    const volume = this.settings?.volume ?? 100;
    const isBoosted = this.settings?.volumeBoost !== false;
    const soundType = this.settings?.soundType || 'standard';

    // 1. Desbloqueia e toca som do alarme em loop contínuo
    if (this.settings?.soundEnabled !== false) {
      audio.unlockAudio();
      audio.startAlarm(soundType, volume, isBoosted);
    }

    // 2. Vibração tátil
    if (this.settings?.vibrateEnabled !== false) {
      audio.vibrate([400, 150, 400, 150, 400, 150, 600]);
    }

    // 3. Voz sintetizada em Português
    if (this.settings?.voiceEnabled) {
      setTimeout(() => {
        audio.speak(
          `Atenção! É hora de tomar ${alarm.medicine.name}, dosagem ${alarm.medicine.dosage || ''}`,
          volume
        );
      }, 800);
    }

    // 4. Notificação visual no Sistema Operacional / Celular (via Service Worker para máxima compatibilidade)
    this.sendSystemNotification(alarm);

    // 5. Callback para exibir modal em tela cheia no React
    if (this.callback) {
      this.callback(alarm);
    }
  }

  /**
   * Emite notificação visual com vibração e botões no sistema do dispositivo
   */
  public async sendSystemNotification(alarm: ActiveAlarm) {
    const title = alarm.isSnoozed
      ? `⏰ SONECA: Hora de tomar ${alarm.medicine.name}`
      : `⏰ HORA DO REMÉDIO: ${alarm.medicine.name}`;

    const memberText = alarm.member ? ` • Paciente: ${alarm.member.name}` : '';
    const body = `Dose: ${alarm.medicine.dosage || '1 dose prescrita'}${memberText}\nHorário: ${alarm.scheduledTime}. Toque para abrir.`;

    const options: any = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [400, 150, 400, 150, 400, 150, 600],
      tag: `med-${alarm.medicine.id}-${alarm.scheduledTime}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: {
        medicineId: alarm.medicine.id,
        medicineName: alarm.medicine.name,
        dosage: alarm.medicine.dosage,
        scheduledTime: alarm.scheduledTime,
        isSnoozed: alarm.isSnoozed
      }
    };

    // Prioriza ServiceWorkerRegistration.showNotification (funciona no Android Chrome, PWA e desktop)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      } catch (err) {
        console.warn('Service Worker notification failed, trying fallback:', err);
      }
    }

    // Fallback para Notification API padrão do navegador
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (err) {
        console.warn('Direct notification error:', err);
      }
    }
  }

  /**
   * Dispara um teste completo imediato (Som + Notificação + Vibração + Visual)
   */
  public testFullAlarm(onSuccess?: () => void) {
    const sampleMed: Medicine = {
      id: 'test-med-demo',
      userId: 'user-demo',
      memberId: 'test-member-demo',
      name: 'Losartana Potássica (Teste)',
      dosage: '50 mg - 1 Comprimido',
      quantity: 30,
      unit: 'comprimidos',
      frequencyType: 'daily',
      times: ['12:00'],
      startDate: new Date().toISOString(),
      durationDays: 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    const sampleMember: FamilyMember = {
      id: 'test-member-demo',
      userId: 'user-demo',
      name: 'Você',
      emoji: '👤',
      color: '#0f766e'
    };

    this.triggerAlarm({
      medicine: sampleMed,
      member: sampleMember,
      scheduledTime: 'Agora',
      isSnoozed: false
    });

    if (onSuccess) onSuccess();
  }
}

export const alarmManager = new AlarmManager();

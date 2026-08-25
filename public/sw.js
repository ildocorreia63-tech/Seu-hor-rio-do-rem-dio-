// Service Worker do Seu Horário do Remédio (SHDR)
// Responsável por: Cache Offline, Notificações em Segundo Plano, Lembretes com App Fechado e Ações de Soneca/Dose
const CACHE_NAME = 'shdr-v1.2.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/main.tsx',
  '/src/index.css'
];

// Lista de alarmes agendados em memória no Service Worker
let scheduledAlarms = [];
let snoozedAlarms = [];
let lastTriggeredMinute = '';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições de rede (Offline First para assets, Pass-through para APIs)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      );
    })
  );
});

/**
 * Dispara uma notificação de alarme de alta prioridade com som, vibração e botões de ação
 */
function triggerMedicineNotification(med, memberName, timeStr, isSnoozed = false) {
  const title = isSnoozed 
    ? `⏰ SONECA: Hora de tomar ${med.name}`
    : `⏰ HORA DO REMÉDIO: ${med.name}`;

  const body = `Dose: ${med.dosage || '1 dose prescrita'} ${memberName ? `• Paciente: ${memberName}` : ''}\nHorário: ${timeStr}. Toque para abrir o alarme com som.`;

  const options = {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [400, 150, 400, 150, 400, 150, 600],
    tag: `med-alarm-${med.id}-${timeStr}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: `/?alarmMedId=${med.id}&time=${timeStr}&snoozed=${isSnoozed ? '1' : '0'}`,
      medicineId: med.id,
      medicineName: med.name,
      dosage: med.dosage,
      memberName: memberName,
      scheduledTime: timeStr,
      isSnoozed: isSnoozed
    },
    actions: [
      { action: 'take', title: '✓ Tomei Agora' },
      { action: 'snooze', title: '⏰ Adiar 10 min' }
    ]
  };

  return self.registration.showNotification(title, options);
}

/**
 * Loop de checagem periódica de alarmes no Service Worker (Executa em segundo plano)
 */
function checkBackgroundAlarms() {
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMin = String(now.getMinutes()).padStart(2, '0');
  const currentMinuteStr = `${currentHour}:${currentMin}`;
  const currentDayOfWeek = now.getDay();
  const nowTime = now.getTime();

  // 1. Checa alarmes em modo soneca
  const readySnoozes = snoozedAlarms.filter(s => s.triggerAt <= nowTime);
  if (readySnoozes.length > 0) {
    readySnoozes.forEach(sn => {
      triggerMedicineNotification(
        { id: sn.medicineId, name: sn.medicineName, dosage: sn.dosage },
        sn.memberName,
        currentMinuteStr,
        true
      );
    });
    snoozedAlarms = snoozedAlarms.filter(s => s.triggerAt > nowTime);
  }

  // 2. Evita duplicidade no mesmo minuto para agendados normais
  if (lastTriggeredMinute === currentMinuteStr) return;

  if (Array.isArray(scheduledAlarms) && scheduledAlarms.length > 0) {
    for (const item of scheduledAlarms) {
      if (!item.active) continue;

      if (item.frequencyType === 'week' && Array.isArray(item.weekDays)) {
        if (!item.weekDays.includes(currentDayOfWeek)) continue;
      }

      if (Array.isArray(item.times) && item.times.includes(currentMinuteStr)) {
        lastTriggeredMinute = currentMinuteStr;
        triggerMedicineNotification(
          item,
          item.memberName || '',
          currentMinuteStr,
          false
        );
      }
    }
  }
}

// Inicia verificação periódica no Service Worker
setInterval(checkBackgroundAlarms, 8000);

// Mensagens recebidas da aplicação React
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  switch (data.type) {
    case 'SYNC_ALARMS':
      // Atualiza lista de remédios e horários para monitoramento em segundo plano
      if (Array.isArray(data.medicines)) {
        scheduledAlarms = data.medicines;
      }
      break;

    case 'SNOOZE_ALARM':
      // Adia um alarme por X minutos no Service Worker
      if (data.medicineId) {
        const minutes = data.minutes || 10;
        snoozedAlarms.push({
          medicineId: data.medicineId,
          medicineName: data.medicineName || 'Medicamento',
          dosage: data.dosage || '',
          memberName: data.memberName || '',
          triggerAt: Date.now() + minutes * 60 * 1000
        });
      }
      break;

    case 'TRIGGER_TEST_NOTIFICATION':
      // Notificação de teste solicitada pelo usuário
      self.registration.showNotification('🔔 Teste de Alarme: Seu Horário do Remédio', {
        body: 'Alerta sonoro e visual funcionando perfeitamente! Você receberá avisos pontuais mesmo com o aplicativo em segundo plano.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [300, 100, 300, 100, 300, 100, 500],
        requireInteraction: true,
        tag: 'test-notification',
        actions: [
          { action: 'open', title: 'Abrir Aplicativo' }
        ]
      });
      break;

    case 'CLEAR_SNOOZE':
      if (data.medicineId) {
        snoozedAlarms = snoozedAlarms.filter(s => s.medicineId !== data.medicineId);
      }
      break;
  }
});

// Ações ao clicar na notificação (mesmo com o aplicativo fechado)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Se o usuário clicou em "Adiar 10 min"
  if (action === 'snooze' && data.medicineId) {
    snoozedAlarms.push({
      medicineId: data.medicineId,
      medicineName: data.medicineName || 'Medicamento',
      dosage: data.dosage || '',
      memberName: data.memberName || '',
      triggerAt: Date.now() + 10 * 60 * 1000
    });
    return;
  }

  // Se o usuário clicou em "Tomei Agora" ou na notificação geral:
  // Abre ou foca a janela do aplicativo
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela e envia evento
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: action === 'take' ? 'NOTIFICATION_TAKE_DOSE' : 'NOTIFICATION_OPEN_ALARM',
            data: data
          });
          return;
        }
      }
      // Se nenhuma janela estiver aberta, abre uma nova
      if (self.clients.openWindow) {
        const targetUrl = data.url || '/';
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

const CACHE = 'demi-workout-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ─── WATER REMINDERS ────────────────────────────────────────────────────────
function getSettings() {
  // Read from clients since SW can't access localStorage directly
  return { startHour: 8, endHour: 22, intervalHours: 2 };
}

function scheduleNextReminder() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  // Read settings via broadcast
  self.clients.matchAll().then(clientList => {
    clientList.forEach(client => {
      client.postMessage({ type: 'GET_WATER_SETTINGS' });
    });
  });
}

// Listen for messages from the app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'WATER_SETTINGS') {
    const { enabled, startHour, endHour, intervalHours } = e.data;
    if (!enabled) return;

    const now = new Date();
    const hour = now.getHours();

    if (hour >= startHour && hour < endHour) {
      const messages = [
        "drink your water babe 💧 — Jozef",
        "av ju, now drink water 💧",
        "Demik, water. now. please 💧",
        "jozef here, drink water 💧",
        "you're probably not drinking enough water, am i wrong? 💧",
        "i'm not there to remind you in person so — water 💧",
        "demik 💧 water 💧 now 💧 ily",
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];

      self.registration.showNotification("Demi's Workout App 💧", {
        body: msg,
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: 'water-reminder',
        renotify: true,
      });
    }

    // Schedule next reminder
    const msToNext = intervalHours * 60 * 60 * 1000;
    setTimeout(() => scheduleNextReminder(), msToNext);
  }
});

// Periodic check every hour
setInterval(() => scheduleNextReminder(), 60 * 60 * 1000);

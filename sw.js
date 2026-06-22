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

// ─── WATER REMINDER MESSAGES ────────────────────────────────────────────────
const messages = [
  "💧 Hey Demi, time to drink some water!",
  "💧 Hydration check! Grab a glass of water",
  "💧 Don't forget to drink water today",
  "💧 You're probably not drinking enough water, am i wrong?",
  "💧 Av ju, now drink water 💧",
];

function getRandomMessage() {
  return messages[Math.floor(Math.random() * messages.length)];
}

function shouldNotifyNow(startHour, endHour) {
  const hour = new Date().getHours();
  return hour >= startHour && hour < endHour;
}

function sendWaterNotification() {
  self.registration.showNotification("💧 Demi's Workout App", {
    body: getRandomMessage(),
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: 'water-reminder',
    renotify: true,
  });
}

// ─── SCHEDULED DAILY REMINDERS ──────────────────────────────────────────────
// Ask the app for settings, then check if we should notify
function checkAndNotify() {
  self.clients.matchAll().then(clientList => {
    if (clientList.length > 0) {
      clientList[0].postMessage({ type: 'GET_WATER_SETTINGS' });
    } else {
      // No client open — read what we can from the last known schedule
      // and fire if within hours (we stored schedule in SW scope via message)
      if (self._waterEnabled && shouldNotifyNow(self._startHour, self._endHour)) {
        sendWaterNotification();
      }
    }
  });
}

// Store settings in SW scope when received
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'WATER_SETTINGS') {
    const { enabled, startHour, endHour, intervalHours } = e.data;
    // Cache in SW scope
    self._waterEnabled = enabled;
    self._startHour = startHour;
    self._endHour = endHour;
    self._intervalHours = intervalHours;

    if (!enabled) return;
    if (shouldNotifyNow(startHour, endHour)) {
      sendWaterNotification();
    }
  }

  if (e.data.type === 'WATER_ENABLED') {
    // Fired when user just turned it on — send confirmation first, then real message shortly after
    self.registration.showNotification("💧 Demi's Workout App", {
      body: "Water reminders are on! First reminder coming shortly 💧",
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      tag: 'water-confirm',
    });

    // Send first real reminder after 2 minutes
    setTimeout(() => {
      const { startHour, endHour } = e.data;
      if (shouldNotifyNow(startHour, endHour)) {
        sendWaterNotification();
      }
    }, 2 * 60 * 1000);
  }
});

// ─── HOURLY TICK ─────────────────────────────────────────────────────────────
// Check every hour — fire notification if within time window and interval matches
let lastNotifyHour = -1;

setInterval(() => {
  const now = new Date();
  const hour = now.getHours();

  if (!self._waterEnabled) return;
  if (hour < self._startHour || hour >= self._endHour) return;

  // Check if this hour is on the interval
  const hoursSinceStart = hour - self._startHour;
  const interval = self._intervalHours || 2;
  if (hoursSinceStart % interval !== 0) return;
  if (lastNotifyHour === hour) return; // don't double fire

  lastNotifyHour = hour;
  sendWaterNotification();
}, 60 * 60 * 1000); // every hour

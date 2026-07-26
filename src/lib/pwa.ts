let registration: ServiceWorkerRegistration | null = null;
let isReloading = false;

async function checkRemoteVersion(reg: ServiceWorkerRegistration, onUpdateFound: () => void) {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const currentVersion = window.__APP_VERSION__;
      if (data.version && currentVersion && data.version !== currentVersion) {
        console.log(`[PWA] New version detected on GitHub Pages: ${data.version} (current: ${currentVersion})`);
        onUpdateFound();
        reg.update().catch(() => {});
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        // Force reload if service worker doesn't trigger controllerchange quickly
        setTimeout(() => {
          if (!isReloading) {
            isReloading = true;
            window.location.reload();
          }
        }, 1200);
      }
    }
  } catch (err) {
    // Ignore fetch errors if offline or network interrupted
  }
}

export function registerServiceWorker(onUpdateFound: () => void) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
        registration = reg;

        // Check for updates on startup
        reg.update().catch(() => {});
        checkRemoteVersion(reg, onUpdateFound);

        // Check for updates periodically (every 30 seconds)
        setInterval(() => {
          if (navigator.onLine) {
            reg.update().catch(() => {});
            checkRemoteVersion(reg, onUpdateFound);
          }
        }, 30 * 1000);

        // Check when returning to app or network becomes active (critical for iPhone PWA)
        const checkAppUpdate = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            reg.update().catch(() => {});
            checkRemoteVersion(reg, onUpdateFound);
          }
        };

        document.addEventListener('visibilitychange', checkAppUpdate);
        window.addEventListener('focus', checkAppUpdate);
        window.addEventListener('pageshow', checkAppUpdate);
        window.addEventListener('online', checkAppUpdate);

        // Handle installing new Service Worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                onUpdateFound();
                if (navigator.serviceWorker.controller) {
                  // Force new service worker to take control immediately
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });

        // If there's already a waiting worker, skip waiting immediately
        if (reg.waiting) {
          onUpdateFound();
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }).catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });

      // Reload page as soon as the active service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isReloading) {
          isReloading = true;
          window.location.reload();
        }
      });
    });
  }
}

export function reloadToUpdateSW() {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
  }
}

export function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12);
    } catch {
      // Ignore vibration unsupported errors
    }
  }
}

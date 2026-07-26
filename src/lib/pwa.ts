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

export interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  imageUrl?: string;
}

export function readSharedDataFromIDB(): Promise<SharedData | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    const request = indexedDB.open('grocery_share_db', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('shared_data')) {
        db.createObjectStore('shared_data');
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('shared_data')) {
        resolve(null);
        return;
      }
      const tx = db.transaction('shared_data', 'readwrite');
      const store = tx.objectStore('shared_data');
      const getReq = store.get('latest');
      getReq.onsuccess = () => {
        const val = getReq.result;
        if (val) {
          // Clear 'latest' after reading
          store.delete('latest');
          resolve({
            title: val.title || undefined,
            text: val.text || undefined,
            url: val.url || undefined,
            imageUrl: val.imageUrl || undefined,
          });
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

export async function parseSharedTargetContent(): Promise<SharedData | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try reading from IndexedDB (for POST Share Target from iOS Share Sheet)
  const idbShared = await readSharedDataFromIDB();
  if (idbShared) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
    return idbShared;
  }

  // 2. Try reading from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const text = urlParams.get('text');
  const title = urlParams.get('title');
  const url = urlParams.get('url');
  const image = urlParams.get('image');

  if (text || title || url || image) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    return {
      title: title || undefined,
      text: text || undefined,
      url: url || undefined,
      imageUrl: image || undefined
    };
  }

  return null;
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

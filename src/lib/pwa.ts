let registration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(onUpdateFound: () => void) {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' || true) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
        registration = reg;

        // Check for updates periodically (every 5 minutes) and when app becomes visible
        setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                onUpdateFound();
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
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

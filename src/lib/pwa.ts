let registration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(onUpdateFound: () => void) {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' || true) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
        registration = reg;

        // Check for updates periodically (every 5 minutes)
        setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000);

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
}

export function parseSharedTargetContent(): SharedData | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const text = urlParams.get('text');
  const title = urlParams.get('title');
  const url = urlParams.get('url');

  if (text || title || url) {
    // Clean URL parameters without page reload
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    return {
      title: title || undefined,
      text: text || undefined,
      url: url || undefined
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

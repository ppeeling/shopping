import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  signInAnonymously,
  User 
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { GroceryItem, HistoryItem, AUTHORIZED_EMAILS, AUTHORIZED_USERS } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with reliable persistent cache (compatible with iOS WebKit)
const dbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({})
  }, dbId);
} catch {
  db = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { db };

// Helper to ensure Firebase user is authenticated (Google or Anonymous) so request.auth != null is always met
export async function ensureAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Authentication setup error:', err);
    return null;
  }
}

// Helper to check email authorization
export function isUserAuthorized(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
}

// Local storage fallback keys for immediate offline responsiveness
const LOCAL_STORAGE_ITEMS_KEY = 'grocery_app_items_fallback_v1';
const LOCAL_STORAGE_HISTORY_KEY = 'grocery_app_history_fallback_v1';

function getLocalItems(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const itemSubscribers = new Set<(items: GroceryItem[]) => void>();
const historySubscribers = new Set<(history: HistoryItem[]) => void>();

function saveLocalItems(items: GroceryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    itemSubscribers.forEach(cb => cb(items));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(history: HistoryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    historySubscribers.forEach(cb => cb(history));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

export const INITIAL_DEMO_ITEMS: Omit<GroceryItem, 'id'>[] = [];

// Firestore Realtime Subscriptions with Local Fallback sync
export function subscribeToGroceryItems(
  callback: (items: GroceryItem[]) => void,
  onError?: (error: Error) => void
) {
  itemSubscribers.add(callback);

  // 1. Synchronously emit local cached items so UI shows items immediately without waiting
  const initialLocal = getLocalItems();
  callback(initialLocal);

  ensureAuth();

  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const q = query(collection(db, 'groceries'), orderBy('createdAt', 'desc'));
    unsubscribeFirestore = onSnapshot(
      q,
      async (snapshot) => {
        const items: GroceryItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name || '',
            quantity: data.quantity || '1',
            section: data.section || 'Other',
            supermarkets: Array.isArray(data.supermarkets) ? data.supermarkets : ['Tesco'],
            priority: data.priority || 'medium',
            completed: Boolean(data.completed),
            notes: data.notes || '',
            addedBy: data.addedBy || 'paulpeeling@gmail.com',
            completedBy: data.completedBy,
            completedAt: data.completedAt,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : (data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now())
          });
        });

        // Check if there are unsynced local items that aren't in Firestore yet
        const currentLocal = getLocalItems();
        const unsyncedLocals = currentLocal.filter(
          (loc) => loc.id.startsWith('local-') && !items.some((f) => f.name === loc.name && f.createdAt === loc.createdAt)
        );

        // Upload unsynced local items to Firestore
        if (unsyncedLocals.length > 0) {
          for (const localItem of unsyncedLocals) {
            try {
              const { id, ...itemToSync } = localItem;
              await addDoc(collection(db, 'groceries'), cleanForFirestore(itemToSync));
            } catch (err) {
              console.warn('Error syncing local item to Firestore:', err);
            }
          }
        }

        const combinedItems = items;
        try {
          localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(combinedItems));
        } catch {}
        callback(combinedItems);
      },
      (err) => {
        console.warn('Firestore subscription offline or error, using local state:', err);
        const local = getLocalItems();
        callback(local);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Error setting up Firestore query, using local storage fallback:', err);
    callback(getLocalItems());
  }

  return () => {
    itemSubscribers.delete(callback);
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

export function subscribeToHistory(
  callback: (history: HistoryItem[]) => void
) {
  historySubscribers.add(callback);
  ensureAuth();

  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const q = query(collection(db, 'history'), orderBy('boughtAt', 'desc'));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const history: HistoryItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          history.push({
            id: docSnap.id,
            itemId: data.itemId,
            name: data.name,
            quantity: data.quantity || '1',
            section: data.section || 'Other',
            supermarkets: Array.isArray(data.supermarkets) ? data.supermarkets : [],
            boughtAt: typeof data.boughtAt === 'number' ? data.boughtAt : (data.boughtAt?.toMillis ? data.boughtAt.toMillis() : Date.now()),
            boughtBy: data.boughtBy || 'paulpeeling@gmail.com',
            timesBought: data.timesBought || 1
          });
        });
        try {
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
        } catch {}
        callback(history);
      },
      (err) => {
        console.warn('History subscription error, falling back to local storage:', err);
        callback(getLocalHistory());
      }
    );
  } catch {
    callback(getLocalHistory());
  }

  return () => {
    historySubscribers.delete(callback);
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

// Add Item
export async function addGroceryItem(item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const tempId = `local-${now}-${Math.random().toString(36).substr(2, 4)}`;
  const created: GroceryItem = {
    ...item,
    notes: item.notes || '',
    createdAt: now,
    updatedAt: now,
    id: tempId
  };

  // 1. Save locally IMMEDIATELY so UI updates instantly on all devices (including iPhone)
  const local = getLocalItems();
  saveLocalItems([created, ...local]);

  // 2. Sync with Firestore in background without blocking
  try {
    await ensureAuth();
    const newItem = cleanForFirestore({
      ...item,
      notes: item.notes || '',
      createdAt: now,
      updatedAt: now
    });

    const docRef = await addDoc(collection(db, 'groceries'), newItem);
    
    // Update local storage temp id with real firestore doc id if temp item still exists
    const currentLocal = getLocalItems();
    if (currentLocal.some(i => i.id === tempId)) {
      const updatedLocal = currentLocal.map(i => i.id === tempId ? { ...created, id: docRef.id } : i);
      saveLocalItems(updatedLocal);
    }
  } catch (err) {
    console.warn('Firestore addDoc fallback (stored locally):', err);
  }
}

// Toggle Complete
export async function toggleGroceryCompleted(
  item: GroceryItem, 
  currentUserEmail: string
) {
  const newCompletedState = !item.completed;
  const now = Date.now();

  // Optimistic update locally
  const local = getLocalItems();
  const updated = local.map(i => {
    if (i.id === item.id) {
      return {
        ...i,
        completed: newCompletedState,
        completedBy: newCompletedState ? currentUserEmail : undefined,
        completedAt: newCompletedState ? now : undefined,
        updatedAt: now
      };
    }
    return i;
  });
  saveLocalItems(updated);

  if (newCompletedState) {
    recordItemBoughtHistory(item, currentUserEmail);
  }

  try {
    await ensureAuth();
    if (!item.id.startsWith('local-')) {
      const itemRef = doc(db, 'groceries', item.id);
      await updateDoc(itemRef, {
        completed: newCompletedState,
        completedBy: newCompletedState ? currentUserEmail : null,
        completedAt: newCompletedState ? now : null,
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('Firestore updateDoc fallback (stored locally):', err);
  }
}

function isSameCalendarDay(t1: number, t2: number): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Record Item Purchase History (at most once per item per calendar day)
async function recordItemBoughtHistory(item: GroceryItem, boughtBy: string) {
  const now = Date.now();
  const localHist = getLocalHistory();

  // Check if a purchase for this item (by ID or matching name) was already recorded today
  const recordedToday = localHist.some((h) => {
    const sameItem =
      (h.itemId && h.itemId === item.id) ||
      (h.name && h.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    return sameItem && isSameCalendarDay(h.boughtAt, now);
  });

  if (recordedToday) {
    // Already recorded for today; do not duplicate
    return;
  }

  const historyData = {
    itemId: item.id,
    name: item.name,
    quantity: item.quantity,
    section: item.section,
    supermarkets: item.supermarkets,
    boughtAt: now,
    boughtBy: boughtBy,
    timesBought: 1
  };

  const newHist: HistoryItem = {
    ...historyData,
    id: `hist-${now}`
  };
  saveLocalHistory([newHist, ...localHist]);

  try {
    await ensureAuth();
    await addDoc(collection(db, 'history'), historyData);
  } catch {
    // Keep local history
  }
}

// Update Item
export async function updateGroceryItem(id: string, updates: Partial<GroceryItem>) {
  const now = Date.now();
  const local = getLocalItems();
  const updated = local.map(i => i.id === id ? { ...i, ...updates, updatedAt: now } : i);
  saveLocalItems(updated);

  try {
    await ensureAuth();
    if (!id.startsWith('local-')) {
      const cleanedUpdates = cleanForFirestore({
        ...updates,
        updatedAt: now
      });
      const itemRef = doc(db, 'groceries', id);
      await updateDoc(itemRef, cleanedUpdates);
    }
  } catch (err) {
    console.warn('Firestore updateDoc fallback (stored locally):', err);
  }
}

// Delete Item
export async function deleteGroceryItem(id: string) {
  const local = getLocalItems();
  saveLocalItems(local.filter(i => i.id !== id));

  try {
    await ensureAuth();
    if (!id.startsWith('local-')) {
      await deleteDoc(doc(db, 'groceries', id));
    }
  } catch (err) {
    console.warn('Firestore deleteDoc fallback (stored locally):', err);
  }
}

// Clear all completed items
export async function clearCompletedItems(items: GroceryItem[]) {
  const completed = items.filter(i => i.completed);
  for (const item of completed) {
    await deleteGroceryItem(item.id);
  }
}

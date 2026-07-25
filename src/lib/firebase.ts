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

// Initialize Firestore with offline persistence
const dbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
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
  ensureAuth();

  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const q = query(collection(db, 'groceries'), orderBy('createdAt', 'desc'));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
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

        try {
          localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
        } catch {}
        callback(items);
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
  await ensureAuth();
  const now = Date.now();
  const newItem = cleanForFirestore({
    ...item,
    notes: item.notes || '',
    createdAt: now,
    updatedAt: now
  });

  try {
    await addDoc(collection(db, 'groceries'), newItem);
  } catch (err) {
    console.warn('Failed to add to Firestore, saving locally:', err);
    const local = getLocalItems();
    const created: GroceryItem = {
      ...item,
      notes: item.notes || '',
      createdAt: now,
      updatedAt: now,
      id: `local-${now}-${Math.random().toString(36).substr(2, 4)}`
    };
    saveLocalItems([created, ...local]);
  }
}

// Toggle Complete
export async function toggleGroceryCompleted(
  item: GroceryItem, 
  currentUserEmail: string
) {
  await ensureAuth();
  const newCompletedState = !item.completed;
  const now = Date.now();

  try {
    const itemRef = doc(db, 'groceries', item.id);
    await updateDoc(itemRef, {
      completed: newCompletedState,
      completedBy: newCompletedState ? currentUserEmail : null,
      completedAt: newCompletedState ? now : null,
      updatedAt: now
    });

    if (newCompletedState) {
      recordItemBoughtHistory(item, currentUserEmail);
    }
  } catch (err) {
    console.warn('Failed to update Firestore, updating locally:', err);
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
  }
}

// Record Item Purchase History
async function recordItemBoughtHistory(item: GroceryItem, boughtBy: string) {
  await ensureAuth();
  const historyData = {
    itemId: item.id,
    name: item.name,
    quantity: item.quantity,
    section: item.section,
    supermarkets: item.supermarkets,
    boughtAt: Date.now(),
    boughtBy: boughtBy,
    timesBought: 1
  };

  try {
    await addDoc(collection(db, 'history'), historyData);
  } catch {
    const localHist = getLocalHistory();
    const newHist: HistoryItem = {
      ...historyData,
      id: `hist-${Date.now()}`
    };
    saveLocalHistory([newHist, ...localHist]);
  }
}

// Update Item
export async function updateGroceryItem(id: string, updates: Partial<GroceryItem>) {
  await ensureAuth();
  const cleanedUpdates = cleanForFirestore({
    ...updates,
    updatedAt: Date.now()
  });
  try {
    const itemRef = doc(db, 'groceries', id);
    await updateDoc(itemRef, cleanedUpdates);
  } catch (err) {
    console.warn('Failed to update Firestore, updating locally:', err);
    const local = getLocalItems();
    const updated = local.map(i => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i);
    saveLocalItems(updated);
  }
}

// Delete Item
export async function deleteGroceryItem(id: string) {
  await ensureAuth();
  try {
    await deleteDoc(doc(db, 'groceries', id));
  } catch (err) {
    console.warn('Failed to delete from Firestore, deleting locally:', err);
    const local = getLocalItems();
    saveLocalItems(local.filter(i => i.id !== id));
  }
}

// Clear all completed items
export async function clearCompletedItems(items: GroceryItem[]) {
  await ensureAuth();
  const completed = items.filter(i => i.completed);
  for (const item of completed) {
    await deleteGroceryItem(item.id);
  }
}

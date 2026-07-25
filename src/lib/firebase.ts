import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
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

// Helper to check email authorization
export function isUserAuthorized(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
}

// Local storage fallback keys for immediate offline responsiveness or offline fallback
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

function saveLocalItems(items: GroceryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
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
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

// Default initial items if completely empty
export const INITIAL_DEMO_ITEMS: Omit<GroceryItem, 'id'>[] = [
  {
    name: 'Organic Whole Milk',
    quantity: '2 bottles',
    section: 'Dairy & Eggs',
    supermarkets: ['Tesco', "Sainsbury's"],
    priority: 'high',
    completed: false,
    addedBy: 'paulpeeling@gmail.com',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    name: 'Sourdough Bread',
    quantity: '1 loaf',
    section: 'Bakery',
    supermarkets: ['Marks & Spencer', 'Waitrose'],
    priority: 'medium',
    completed: false,
    addedBy: 'huichiao45@gmail.com',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    name: 'Avocados',
    quantity: '4 pack',
    section: 'Produce',
    supermarkets: ['Aldi', 'Lidl'],
    priority: 'high',
    completed: false,
    notes: 'Pick ripe ones for guacamole',
    addedBy: 'paulpeeling@gmail.com',
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
  },
  {
    name: 'Jasmine Rice (5kg)',
    quantity: '1 bag',
    section: 'Pantry & Grains',
    supermarkets: ['Asian Supermarket'],
    priority: 'low',
    completed: false,
    addedBy: 'huichiao45@gmail.com',
    createdAt: Date.now() - 14400000,
    updatedAt: Date.now() - 14400000,
  }
];

// Firestore Realtime Subscriptions with Local Fallback sync
export function subscribeToGroceryItems(
  callback: (items: GroceryItem[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, 'groceries'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && getLocalItems().length === 0) {
          // Initialize default items if both remote and local are empty
          const initial = INITIAL_DEMO_ITEMS.map((item, index) => ({
            ...item,
            id: `item-demo-${index}`
          }));
          saveLocalItems(initial);
          callback(initial);
          return;
        }

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
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now())
          });
        });

        saveLocalItems(items);
        callback(items);
      },
      (err) => {
        console.warn('Firestore subscription offline or error, falling back to local state:', err);
        const local = getLocalItems();
        if (local.length === 0) {
          const initial = INITIAL_DEMO_ITEMS.map((item, index) => ({
            ...item,
            id: `item-demo-${index}`
          }));
          saveLocalItems(initial);
          callback(initial);
        } else {
          callback(local);
        }
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Error setting up Firestore query, using local storage fallback:', err);
    const local = getLocalItems();
    callback(local);
    return () => {};
  }
}

export function subscribeToHistory(
  callback: (history: HistoryItem[]) => void
) {
  try {
    const q = query(collection(db, 'history'), orderBy('boughtAt', 'desc'));
    return onSnapshot(
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
            boughtAt: data.boughtAt?.toMillis ? data.boughtAt.toMillis() : (data.boughtAt || Date.now()),
            boughtBy: data.boughtBy || 'paulpeeling@gmail.com',
            timesBought: data.timesBought || 1
          });
        });
        saveLocalHistory(history);
        callback(history);
      },
      (err) => {
        console.warn('History subscription error, falling back to local storage:', err);
        callback(getLocalHistory());
      }
    );
  } catch {
    callback(getLocalHistory());
    return () => {};
  }
}

// Add Item
export async function addGroceryItem(item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const newItem: Omit<GroceryItem, 'id'> = {
    ...item,
    createdAt: now,
    updatedAt: now
  };

  try {
    await addDoc(collection(db, 'groceries'), {
      ...newItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to add to Firestore, saving locally:', err);
    const local = getLocalItems();
    const created: GroceryItem = {
      ...newItem,
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
  const newCompletedState = !item.completed;
  const now = Date.now();

  try {
    const itemRef = doc(db, 'groceries', item.id);
    await updateDoc(itemRef, {
      completed: newCompletedState,
      completedBy: newCompletedState ? currentUserEmail : null,
      completedAt: newCompletedState ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });

    // If marked completed, also add or update History entry
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
  const historyData: Omit<HistoryItem, 'id'> = {
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
    await addDoc(collection(db, 'history'), {
      ...historyData,
      boughtAt: serverTimestamp()
    });
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
  try {
    const itemRef = doc(db, 'groceries', id);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to update Firestore, updating locally:', err);
    const local = getLocalItems();
    const updated = local.map(i => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i);
    saveLocalItems(updated);
  }
}

// Delete Item
export async function deleteGroceryItem(id: string) {
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
  const completed = items.filter(i => i.completed);
  for (const item of completed) {
    await deleteGroceryItem(item.id);
  }
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GroceryItem, 
  HistoryItem, 
  FilterState, 
  DEFAULT_SECTIONS, 
  AUTHORIZED_USERS,
  PriorityLevel 
} from './types';
import { 
  subscribeToGroceryItems, 
  subscribeToHistory, 
  addGroceryItem, 
  toggleGroceryCompleted, 
  updateGroceryItem, 
  deleteGroceryItem, 
  clearCompletedItems,
  ensureAuth,
  auth
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerServiceWorker, reloadToUpdateSW } from './lib/pwa';

// Modular React Components (Each in its own file as required)
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import SectionGroup from './components/SectionGroup';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import HistoryView from './components/HistoryView';
import SupermarketView from './components/SupermarketView';
import AuthModal from './components/AuthModal';
import OfflineBanner from './components/OfflineBanner';
import UpdateNotification from './components/UpdateNotification';
import IPhoneInstallPrompt from './components/IPhoneInstallPrompt';
import BottomNav from './components/BottomNav';

import { ShoppingBag, CheckCircle2, Trash2, Plus, Sparkles } from 'lucide-react';

export default function App() {
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Current Active User (Google Auth)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // Network & PWA States
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  // Active Navigation Tab: 'list' | 'supermarket' | 'history'
  const [activeTab, setActiveTab] = useState<'list' | 'supermarket' | 'history'>('list');

  // Grocery Items & Purchase History from Firebase / Local Cache
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Filtering State
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    section: 'all',
    supermarket: 'all',
    priority: 'all',
    status: 'active' // Show active items to buy by default
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  // Initialize theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Network online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register PWA Service Worker
  useEffect(() => {
    registerServiceWorker(() => setHasUpdate(true));
  }, []);

  // Sync Firebase Auth State strictly from Google Auth
  useEffect(() => {
    ensureAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous && user.email) {
        setCurrentUserEmail(user.email.toLowerCase());
      } else {
        setCurrentUserEmail('');
        ensureAuth();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Subscriptions for Groceries & History
  useEffect(() => {
    const unsubscribeItems = subscribeToGroceryItems(
      (newItems) => setItems(newItems),
      (err) => console.warn('Grocery subscription error:', err)
    );

    const unsubscribeHistory = subscribeToHistory(
      (newHist) => setHistory(newHist)
    );

    return () => {
      if (typeof unsubscribeItems === 'function') unsubscribeItems();
      if (typeof unsubscribeHistory === 'function') unsubscribeHistory();
    };
  }, []);

  // Filtered Grocery Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (filter.status === 'active' && item.completed) return false;
      if (filter.status === 'completed' && !item.completed) return false;

      // Search text
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSection = item.section.toLowerCase().includes(query);
        const matchNotes = item.notes?.toLowerCase().includes(query) || false;
        if (!matchName && !matchSection && !matchNotes) return false;
      }

      // Section filter
      if (filter.section !== 'all' && item.section !== filter.section) return false;

      // Supermarket filter
      if (filter.supermarket !== 'all') {
        if (!item.supermarkets || !item.supermarkets.includes(filter.supermarket)) {
          return false;
        }
      }

      // Priority filter
      if (filter.priority !== 'all' && item.priority !== filter.priority) return false;

      return true;
    });
  }, [items, filter]);

  // Counts
  const activeItemsCount = useMemo(() => items.filter(i => !i.completed).length, [items]);
  const completedItemsCount = useMemo(() => items.filter(i => i.completed).length, [items]);

  // Group filtered items by Section
  const sectionsWithItems = useMemo(() => {
    const activeSections = DEFAULT_SECTIONS.filter((sec) =>
      filteredItems.some((item) => item.section === sec)
    );

    // Any items with custom section not in default list
    const otherItems = filteredItems.filter(
      (item) => !(DEFAULT_SECTIONS as readonly string[]).includes(item.section)
    );

    return {
      standardSections: activeSections,
      hasOther: otherItems.length > 0
    };
  }, [filteredItems]);

  // Handlers
  const handleToggleComplete = async (item: GroceryItem) => {
    const activeEmail = currentUserEmail || auth.currentUser?.email?.toLowerCase() || 'paulpeeling@gmail.com';
    await toggleGroceryCompleted(item, activeEmail);
  };

  const handleOpenAddModal = () => {
    if (!currentUserEmail) {
      setIsAuthModalOpen(true);
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleAddItem = async (item: {
    name: string;
    quantity: string;
    section: string;
    supermarkets: string[];
    priority: PriorityLevel;
    notes?: string;
  }) => {
    if (!currentUserEmail) {
      setIsAuthModalOpen(true);
      return;
    }
    await addGroceryItem({
      ...item,
      completed: false,
      addedBy: currentUserEmail
    });
  };

  const handleSaveEdit = async (id: string, updates: Partial<GroceryItem>) => {
    await updateGroceryItem(id, updates);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteGroceryItem(id);
  };

  const handleClearCompleted = async () => {
    if (window.confirm('Clear all bought items from the current list?')) {
      await clearCompletedItems(items);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Offline Banner */}
      <OfflineBanner isOffline={isOffline} />

      {/* PWA Update Notification */}
      <UpdateNotification hasUpdate={hasUpdate} onReload={reloadToUpdateSW} />

      {/* Main App Header */}
      <Header
        currentUserEmail={currentUserEmail}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        activeItemsCount={activeItemsCount}
        completedItemsCount={completedItemsCount}
      />

      {/* Main Content Area depending on Active Tab */}
      <main className="max-w-3xl mx-auto">
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <FilterBar
              filter={filter}
              onChangeFilter={setFilter}
              activeCount={activeItemsCount}
              completedCount={completedItemsCount}
            />

            {/* List View Container */}
            <div className="p-3 sm:p-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl my-4">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                    {filter.status === 'completed'
                      ? 'No Bought Items Yet'
                      : 'Your Shopping List is Empty'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    {filter.status === 'completed'
                      ? 'Tick off items when you buy them to track your groceries.'
                      : 'Tap the "+" button below to add your first grocery item for Paul & Hui-Chiao!'}
                  </p>
                  {filter.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Grocery Item
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Render items grouped by Section */}
                  {sectionsWithItems.standardSections.map((sec) => {
                    const sectionItems = filteredItems.filter((i) => i.section === sec);
                    return (
                      <SectionGroup
                        key={sec}
                        sectionName={sec}
                        items={sectionItems}
                        currentUserEmail={currentUserEmail}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(item) => setEditingItem(item)}
                        onDelete={handleDeleteItem}
                      />
                    );
                  })}

                  {sectionsWithItems.hasOther && (
                    <SectionGroup
                      sectionName="Other"
                      items={filteredItems.filter(
                        (i) => !(DEFAULT_SECTIONS as readonly string[]).includes(i.section)
                      )}
                      currentUserEmail={currentUserEmail}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(item) => setEditingItem(item)}
                      onDelete={handleDeleteItem}
                    />
                  )}

                  {/* Clear Completed Action Button at bottom of list */}
                  {completedItemsCount > 0 && filter.status !== 'active' && (
                    <div className="pt-6 pb-2 text-center">
                      <button
                        type="button"
                        onClick={handleClearCompleted}
                        className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/50 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear {completedItemsCount} Bought Items
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supermarket Store View */}
        {activeTab === 'supermarket' && (
          <SupermarketView
            items={items}
            currentUserEmail={currentUserEmail}
            onToggleComplete={handleToggleComplete}
            onEdit={(item) => setEditingItem(item)}
            onDelete={handleDeleteItem}
          />
        )}

        {/* Purchase History View */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            currentUserEmail={currentUserEmail}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onReAddToList={(item) => {
              if (!currentUserEmail) {
                setIsAuthModalOpen(true);
                return;
              }
              handleAddItem({
                ...item,
                priority: 'medium'
              });
              setActiveTab('list');
            }}
          />
        )}
      </main>

      {/* Bottom Floating Navigation for iPhone / PWA */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        activeItemsCount={activeItemsCount}
      />

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        currentUserEmail={currentUserEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <EditItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserEmail={currentUserEmail}
      />

      {/* iPhone Add to Home Screen Instructions */}
      <IPhoneInstallPrompt />
    </div>
  );
}

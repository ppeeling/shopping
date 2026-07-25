import React from 'react';
import { ShoppingBag, Store, History, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'list' | 'supermarket' | 'history';
  onChangeTab: (tab: 'list' | 'supermarket' | 'history') => void;
  onOpenAddModal: () => void;
  activeItemsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddModal,
  activeItemsCount
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,12px)] pt-2 px-4 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Main Shopping List Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('list')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative ${
            activeTab === 'list'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {activeItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {activeItemsCount > 99 ? '99+' : activeItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Main List</span>
        </button>

        {/* Floating Quick Add Button in Center */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="-mt-6 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-90 ring-4 ring-slate-50 dark:ring-slate-950"
          title="Add New Item"
          aria-label="Add Item"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Supermarket Store View Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('supermarket')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'supermarket'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px]">By Store</span>
        </button>

        {/* History Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">History</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;

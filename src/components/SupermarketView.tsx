import React, { useState } from 'react';
import { Store, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { GroceryItem, DEFAULT_SUPERMARKETS, SUPERMARKET_COLORS, DEFAULT_SECTIONS, SECTION_ICONS } from '../types';
import { GroceryItemCard } from './GroceryItemCard';

interface SupermarketViewProps {
  items: GroceryItem[];
  currentUserEmail: string;
  onToggleComplete: (item: GroceryItem) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
}

export const SupermarketView: React.FC<SupermarketViewProps> = ({
  items,
  currentUserEmail,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const [selectedStore, setSelectedStore] = useState<string>('Tesco');

  // Filter items matching the selected store
  const storeItems = items.filter(i => 
    i.supermarkets && i.supermarkets.includes(selectedStore)
  );

  const activeStoreItems = storeItems.filter(i => !i.completed);
  const completedStoreItems = storeItems.filter(i => i.completed);

  // Group active store items by section
  const sectionsWithItems = DEFAULT_SECTIONS.filter(sec => 
    activeStoreItems.some(item => item.section === sec)
  );

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto pb-24">
      {/* Supermarket selector pills */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Supermarket Mode
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {DEFAULT_SUPERMARKETS.map((store) => {
            const count = items.filter(i => !i.completed && i.supermarkets?.includes(store)).length;
            const isSelected = selectedStore === store;

            return (
              <button
                key={store}
                type="button"
                onClick={() => setSelectedStore(store)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{store}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-lg border border-slate-700 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Shopping at</span>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{selectedStore}</span>
          </h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-400">{activeStoreItems.length}</div>
          <div className="text-xs text-slate-400">items to find</div>
        </div>
      </div>

      {/* Store Items List Grouped by Section/Aisle */}
      {activeStoreItems.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <Check className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            No Active Items for {selectedStore}!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            You don't have any items tagged for {selectedStore} left to buy.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sectionsWithItems.map((sec) => {
            const sectionItems = activeStoreItems.filter(i => i.section === sec);

            return (
              <div key={sec} className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-slate-900 dark:text-slate-100 font-bold text-sm">
                  <span>{SECTION_ICONS[sec] || '🛒'}</span>
                  <span>{sec}</span>
                  <span className="text-xs font-medium text-slate-400">({sectionItems.length})</span>
                </div>

                <div className="space-y-2">
                  {sectionItems.map((item) => (
                    <GroceryItemCard
                      key={item.id}
                      item={item}
                      currentUserEmail={currentUserEmail}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Store Items */}
      {completedStoreItems.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bought at {selectedStore} ({completedStoreItems.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedStoreItems.map((item) => (
              <GroceryItemCard
                key={item.id}
                item={item}
                currentUserEmail={currentUserEmail}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupermarketView;

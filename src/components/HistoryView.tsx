import React, { useState } from 'react';
import { History, Plus, Search, Calendar, User, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { HistoryItem, SECTION_ICONS, AUTHORIZED_USERS } from '../types';

interface HistoryViewProps {
  history: HistoryItem[];
  currentUserEmail?: string;
  onOpenAuth?: () => void;
  onReAddToList: (item: {
    name: string;
    quantity: string;
    section: string;
    supermarkets: string[];
  }) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, currentUserEmail = '', onOpenAuth, onReAddToList }) => {
  const [search, setSearch] = useState('');

  const filteredHistory = history.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.section.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Purchase History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {history.length} recorded purchases
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bought history..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Purchase History Yet</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            When you tick off items from your shopping list, they will appear here so you can easily re-add them later.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => {
            const userObj = AUTHORIZED_USERS[item.boughtBy] || { name: item.boughtBy?.split('@')[0] || 'Family', avatar: '👤' };

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-amber-400/50 transition-all shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0 mt-0.5">
                    {SECTION_ICONS[item.section] || '🛒'}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h4>
                      {item.quantity && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md shrink-0">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.boughtAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>{userObj.avatar}</span>
                        <span>{userObj.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Re-add Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUserEmail) {
                      if (onOpenAuth) onOpenAuth();
                      return;
                    }
                    onReAddToList({
                      name: item.name,
                      quantity: item.quantity,
                      section: item.section,
                      supermarkets: item.supermarkets && item.supermarkets.length ? item.supermarkets : ['Tesco']
                    });
                  }}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95"
                  title="Add back to current shopping list"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Re-add</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryView;

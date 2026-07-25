import React, { useState } from 'react';
import { Check, Edit2, Trash2, Tag, StickyNote, AlertCircle, Clock, Store } from 'lucide-react';
import { GroceryItem, SECTION_ICONS, SUPERMARKET_COLORS, AUTHORIZED_USERS } from '../types';
import { triggerHapticFeedback } from '../lib/pwa';

interface GroceryItemCardProps {
  item: GroceryItem;
  currentUserEmail: string;
  onToggleComplete: (item: GroceryItem) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  currentUserEmail,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const [showNotes, setShowNotes] = useState(false);

  const handleToggle = () => {
    triggerHapticFeedback();
    onToggleComplete(item);
  };

  const addedByUser = AUTHORIZED_USERS[item.addedBy] || { name: item.addedBy.split('@')[0], avatar: '👤' };
  const completedByUser = item.completedBy ? (AUTHORIZED_USERS[item.completedBy] || { name: item.completedBy.split('@')[0], avatar: '👤' }) : null;

  const priorityStyles = {
    high: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 flex flex-col gap-2.5 ${
        item.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75 hover:opacity-100'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Interactive Checkbox & Item Details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Custom iPhone Touch Target Checkbox */}
          <button
            type="button"
            onClick={handleToggle}
            className={`mt-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 border-2 active:scale-90 ${
              item.completed
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800'
            }`}
            title={item.completed ? 'Mark as to buy' : 'Mark as bought'}
            aria-label="Toggle completed"
          >
            {item.completed && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          {/* Title & Quantity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap gap-2">
              <h3
                onClick={handleToggle}
                className={`font-semibold text-sm sm:text-base cursor-pointer select-none transition-all ${
                  item.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {item.name}
              </h3>

              {item.quantity && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {item.quantity}
                </span>
              )}
            </div>

            {/* Badges: Section, Supermarket, Priority */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2 text-[11px]">
              {/* Section badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span>{SECTION_ICONS[item.section] || '🛒'}</span>
                <span>{item.section}</span>
              </span>

              {/* Supermarkets */}
              {item.supermarkets && item.supermarkets.length > 0 && (
                item.supermarkets.map((store) => (
                  <span
                    key={store}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      SUPERMARKET_COLORS[store] || 'bg-slate-700 text-white border-slate-800'
                    }`}
                  >
                    <Store className="w-2.5 h-2.5" />
                    {store}
                  </span>
                ))
              )}

              {/* Priority badge if High/Medium */}
              {item.priority !== 'low' && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border capitalize ${priorityStyles[item.priority]}`}>
                  {item.priority === 'high' && <AlertCircle className="w-2.5 h-2.5" />}
                  {item.priority}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {item.notes && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                showNotes ? 'text-amber-500 font-bold' : 'text-slate-400'
              }`}
              title="Toggle notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit item"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Notes Section */}
      {(item.notes || showNotes) && (
        <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-xl p-2.5 flex items-start gap-2">
          <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="whitespace-pre-wrap flex-1">{item.notes}</span>
        </div>
      )}

      {/* Footer Meta: Added By / Bought By */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <span className="flex items-center gap-1">
          <span>Added by {addedByUser.name}</span>
        </span>

        {item.completed && completedByUser && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3 h-3" />
            Bought by {completedByUser.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default GroceryItemCard;

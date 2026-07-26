import React, { useState } from 'react';
import { Check, Edit2, Trash2, StickyNote } from 'lucide-react';
import { GroceryItem, SECTION_ICONS } from '../types';
import { triggerHapticFeedback } from '../lib/pwa';
import QuantitySpinner from './QuantitySpinner';

interface GroceryItemCardProps {
  item: GroceryItem;
  currentUserEmail: string;
  onToggleComplete: (item: GroceryItem) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
  onUpdateQuantity?: (id: string, newQuantity: string) => void;
  showSectionBadge?: boolean;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  currentUserEmail,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateQuantity,
  showSectionBadge = false
}) => {
  const [showNotes, setShowNotes] = useState(false);

  const handleToggle = () => {
    triggerHapticFeedback();
    onToggleComplete(item);
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 px-3 py-2 sm:px-3.5 sm:py-2.5 ${
        item.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75 hover:opacity-100'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5 min-w-0">
        {/* Left: Interactive Checkbox & Item Details */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Custom iPhone Touch Target Checkbox */}
          <button
            type="button"
            onClick={handleToggle}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 border-2 active:scale-90 ${
              item.completed
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800'
            }`}
            title={item.completed ? 'Mark as to buy' : 'Mark as bought'}
            aria-label="Toggle completed"
          >
            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Title & Quantity */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              onClick={handleToggle}
              className={`font-semibold text-sm sm:text-base cursor-pointer select-none transition-all truncate ${
                item.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {item.name}
            </span>

            <QuantitySpinner
              value={item.quantity || '0'}
              onChange={(newQty) => {
                if (onUpdateQuantity) {
                  onUpdateQuantity(item.id, newQty);
                }
              }}
              mode="inline"
            />

            {showSectionBadge && item.section && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1">
                <span>{SECTION_ICONS[item.section] || '🛒'}</span>
                <span className="hidden sm:inline">{item.section}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {item.notes && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit item"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Notes Section if user toggles notes */}
      {item.notes && showNotes && (
        <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-lg p-2 flex items-start gap-2 mt-2">
          <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="whitespace-pre-wrap flex-1">{item.notes}</span>
        </div>
      )}
    </div>
  );
};

export default GroceryItemCard;

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GroceryItem, SECTION_ICONS } from '../types';
import { GroceryItemCard } from './GroceryItemCard';

interface SectionGroupProps {
  sectionName: string;
  items: GroceryItem[];
  currentUserEmail: string;
  onToggleComplete: (item: GroceryItem) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
}

export const SectionGroup: React.FC<SectionGroupProps> = ({
  sectionName,
  items,
  currentUserEmail,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCount = items.filter(i => !i.completed).length;
  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="space-y-2 mb-4">
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between py-2 px-3 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{SECTION_ICONS[sectionName] || '🛒'}</span>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {sectionName}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
            ({activeCount} to buy{completedCount > 0 ? `, ${completedCount} bought` : ''})
          </span>
        </div>

        <div className="text-slate-400">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Items list */}
      {!isCollapsed && (
        <div className="space-y-2 pl-1 sm:pl-2">
          {items.map((item) => (
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
      )}
    </div>
  );
};

export default SectionGroup;

import React from 'react';
import { Search, Store, Layers, AlertCircle, X, CheckCircle2, List } from 'lucide-react';
import { FilterState, DEFAULT_SECTIONS, DEFAULT_SUPERMARKETS, SECTION_ICONS } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (updated: FilterState) => void;
  activeCount: number;
  completedCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  activeCount,
  completedCount
}) => {
  const hasActiveFilters = 
    filter.search || 
    (filter.section !== 'all' && filter.section !== 'flat') || 
    filter.supermarket !== 'all' || 
    filter.priority !== 'all';

  const resetFilters = () => {
    onChangeFilter({
      search: '',
      section: 'all',
      supermarket: 'all',
      priority: 'all',
      status: filter.status
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 sticky top-[57px] z-20 shadow-xs">
      {/* Search Input & Status Segmented Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onChangeFilter({ ...filter, search: e.target.value })}
            placeholder="Search groceries..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => onChangeFilter({ ...filter, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Toggle: To Buy / Completed / All */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-center shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, status: 'active' })}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filter.status === 'active'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>To Buy</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              {activeCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, status: 'completed' })}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filter.status === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>Bought</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {completedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, status: 'all' })}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter.status === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Horizontal Filter Chips: Supermarkets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Store className="w-3.5 h-3.5" />
          Store:
        </span>
        <button
          type="button"
          onClick={() => onChangeFilter({ ...filter, supermarket: 'all' })}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all border ${
            filter.supermarket === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Stores
        </button>
        {DEFAULT_SUPERMARKETS.map((store) => (
          <button
            key={store}
            type="button"
            onClick={() => onChangeFilter({ ...filter, supermarket: store })}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all border ${
              filter.supermarket === store
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {store}
          </button>
        ))}
      </div>

      {/* Horizontal Filter Chips: Sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          Section:
        </span>
        <button
          type="button"
          onClick={() => onChangeFilter({ ...filter, section: 'all' })}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all border ${
            filter.section === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-xs font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Sections
        </button>
        <button
          type="button"
          onClick={() => onChangeFilter({ ...filter, section: 'flat' })}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1 ${
            filter.section === 'flat'
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-xs font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title="Show all items in a single list without section headers"
        >
          <List className="w-3.5 h-3.5" />
          <span>Flat List</span>
        </button>
        {DEFAULT_SECTIONS.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => onChangeFilter({ ...filter, section: sec })}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1 ${
              filter.section === sec
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{SECTION_ICONS[sec] || '🛒'}</span>
            <span>{sec}</span>
          </button>
        ))}
      </div>

      {/* Active filters bar / reset option */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500">
          <span>Filtering active</span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

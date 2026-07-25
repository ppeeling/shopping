import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Store, Layers, AlertCircle, StickyNote } from 'lucide-react';
import { DEFAULT_SECTIONS, DEFAULT_SUPERMARKETS, PriorityLevel, SECTION_ICONS } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: {
    name: string;
    quantity: string;
    section: string;
    supermarkets: string[];
    priority: PriorityLevel;
    notes?: string;
  }) => void;
  initialName?: string;
  initialSupermarket?: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  initialName = '',
  initialSupermarket = 'Tesco'
}) => {
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState('1');
  const [section, setSection] = useState<string>('Produce');
  const [selectedSupermarkets, setSelectedSupermarkets] = useState<string[]>([initialSupermarket]);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialName) {
      setName(initialName);
      autoSuggestSection(initialName);
    }
  }, [initialName]);

  if (!isOpen) return null;

  // Smart section auto-suggestion
  const autoSuggestSection = (itemName: string) => {
    const lower = itemName.toLowerCase();
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('butter') || lower.includes('egg') || lower.includes('yogurt') || lower.includes('cream')) {
      setSection('Dairy & Eggs');
    } else if (lower.includes('bread') || lower.includes('toast') || lower.includes('croissant') || lower.includes('bagel') || lower.includes('bun') || lower.includes('muffin')) {
      setSection('Bakery');
    } else if (lower.includes('apple') || lower.includes('banana') || lower.includes('tomato') || lower.includes('lemon') || lower.includes('salad') || lower.includes('spinach') || lower.includes('potato') || lower.includes('onion') || lower.includes('avocado') || lower.includes('berry') || lower.includes('garlic')) {
      setSection('Produce');
    } else if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || lower.includes('salmon') || lower.includes('fish') || lower.includes('steak') || lower.includes('bacon') || lower.includes('mince')) {
      setSection('Meat & Seafood');
    } else if (lower.includes('rice') || lower.includes('pasta') || lower.includes('noodle') || lower.includes('flour') || lower.includes('oil') || lower.includes('sugar') || lower.includes('sauce') || lower.includes('salt') || lower.includes('can')) {
      setSection('Pantry & Grains');
    } else if (lower.includes('ice') || lower.includes('frozen') || lower.includes('pizza') || lower.includes('peas')) {
      setSection('Frozen Foods');
    } else if (lower.includes('crisps') || lower.includes('chip') || lower.includes('chocolate') || lower.includes('cookie') || lower.includes('biscuit') || lower.includes('juice') || lower.includes('water') || lower.includes('coffee') || lower.includes('tea') || lower.includes('coke') || lower.includes('beer')) {
      setSection('Snacks & Beverages');
    } else if (lower.includes('paper') || lower.includes('soap') || lower.includes('trash') || lower.includes('foil') || lower.includes('clean') || lower.includes('detergent') || lower.includes('sponge')) {
      setSection('Household & Cleaning');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    autoSuggestSection(val);
  };

  const toggleSupermarket = (store: string) => {
    if (selectedSupermarkets.includes(store)) {
      if (selectedSupermarkets.length > 1) {
        setSelectedSupermarkets(selectedSupermarkets.filter(s => s !== store));
      }
    } else {
      setSelectedSupermarkets([...selectedSupermarkets, store]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      quantity: quantity.trim() || '1',
      section,
      supermarkets: selectedSupermarkets.length > 0 ? selectedSupermarkets : ['Tesco'],
      priority,
      notes: notes.trim() || ''
    });

    // Reset form
    setName('');
    setQuantity('1');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Add Grocery Item
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Organic Milk, Avocados, Sourdough"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
            />
          </div>

          {/* Quantity & Priority in two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 2 bottles, 500g, 1 pack"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
              >
                <option value="high">High Priority 🔴</option>
                <option value="medium">Medium 🟡</option>
                <option value="low">Low Priority 🟢</option>
              </select>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Section / Aisle</span>
              <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                Auto-suggested
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {DEFAULT_SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSection(sec)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                    section === sec
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{SECTION_ICONS[sec] || '🛒'}</span>
                  <span className="truncate">{sec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Supermarket Multi-select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supermarket Tag(s)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SUPERMARKETS.map((store) => {
                const isSelected = selectedSupermarkets.includes(store);
                return (
                  <button
                    key={store}
                    type="button"
                    onClick={() => toggleSupermarket(store)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {store} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Special Brand (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Get organic if available, or buy 2 for £3 offer"
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-900/20 active:scale-98 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Grocery List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;

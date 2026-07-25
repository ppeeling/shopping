import React, { useState } from 'react';
import { Share2, Plus, X } from 'lucide-react';
import { SharedData } from '../lib/pwa';
import { DEFAULT_SECTIONS, DEFAULT_SUPERMARKETS, PriorityLevel } from '../types';

interface ShareTargetModalProps {
  sharedData: SharedData | null;
  onClose: () => void;
  onAddItem: (item: {
    name: string;
    quantity: string;
    section: string;
    supermarkets: string[];
    priority: PriorityLevel;
    notes?: string;
  }) => void;
}

export const ShareTargetModal: React.FC<ShareTargetModalProps> = ({
  sharedData,
  onClose,
  onAddItem
}) => {
  if (!sharedData) return null;

  const initialText = sharedData.text || sharedData.title || sharedData.url || '';
  const [name, setName] = useState(initialText);
  const [quantity, setQuantity] = useState('1');
  const [section, setSection] = useState('Produce');
  const [supermarket, setSupermarket] = useState('Tesco');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      quantity: quantity || '1',
      section,
      supermarkets: [supermarket],
      priority: 'medium',
      notes: sharedData.url ? `Shared URL: ${sharedData.url}` : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Shared Item Detected
            </h2>
            <p className="text-xs text-slate-500">Received via Share Target</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium text-sm"
              >
                {DEFAULT_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
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

export default ShareTargetModal;

import React, { useState, useEffect } from 'react';
import { Share2, Plus, X, Camera, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { SharedData } from '../lib/pwa';
import { DEFAULT_SECTIONS, DEFAULT_SUPERMARKETS, PriorityLevel } from '../types';
import { compressImage } from '../lib/imageUtils';

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
    imageUrl?: string;
  }) => void;
}

export const ShareTargetModal: React.FC<ShareTargetModalProps> = ({
  sharedData,
  onClose,
  onAddItem
}) => {
  if (!sharedData) return null;

  // Clean initial text or title
  const rawText = sharedData.text || sharedData.title || '';
  // Clean URL if present in text
  const cleanTitle = rawText.replace(/https?:\/\/\S+/gi, '').trim() || sharedData.title || 'Shared Grocery Item';

  const [name, setName] = useState(cleanTitle);
  const [quantity, setQuantity] = useState('1');
  const [section, setSection] = useState('Produce');
  const [supermarket, setSupermarket] = useState('Tesco');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState(sharedData.url ? `Shared URL: ${sharedData.url}` : '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(sharedData.imageUrl);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (sharedData?.imageUrl) {
      setImageUrl(sharedData.imageUrl);
    }
  }, [sharedData]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Failed to compress shared image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      quantity: quantity.trim() || '1',
      section,
      supermarkets: [supermarket],
      priority,
      notes: notes.trim() || undefined,
      imageUrl
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Shared Item Detected
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Received via iPhone Share Sheet</p>
          </div>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
            />
          </div>

          {/* Image Preview & Capture */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Photo / Image
            </label>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group max-h-48 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Shared product"
                  className="max-h-48 w-full object-contain bg-slate-950/20"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Processing image...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Take Photo or Upload Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={isCompressing}
                  />
                </label>
              </div>
            )}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supermarket
            </label>
            <select
              value={supermarket}
              onChange={(e) => setSupermarket(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium text-sm"
            >
              {DEFAULT_SUPERMARKETS.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
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

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { adjustQuantity, getNumericQuantity } from '../lib/quantityUtils';
import { triggerHapticFeedback } from '../lib/pwa';

interface QuantitySpinnerProps {
  value: string;
  onChange: (newValue: string) => void;
  mode?: 'inline' | 'field';
  disabled?: boolean;
  className?: string;
}

export const QuantitySpinner: React.FC<QuantitySpinnerProps> = ({
  value,
  onChange,
  mode = 'inline',
  disabled = false,
  className = ''
}) => {
  const numericQty = getNumericQuantity(value);
  const isZeroOrLess = numericQty <= 0;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZeroOrLess || disabled) return;
    triggerHapticFeedback();
    const newQty = adjustQuantity(value, -1);
    onChange(newQty);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    triggerHapticFeedback();
    const newQty = adjustQuantity(value, 1);
    onChange(newQty);
  };

  if (mode === 'inline') {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-0.5 rounded-lg border bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 p-0.5 shrink-0 ${className}`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isZeroOrLess || disabled}
          className="p-1 rounded-md text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/70 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90 cursor-pointer disabled:cursor-not-allowed"
          title="Decrease quantity (min 0)"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3 stroke-[3]" />
        </button>

        <span className="text-[11px] font-bold px-1.5 min-w-[1.25rem] text-center text-emerald-900 dark:text-emerald-200 select-none">
          {value || '0'}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className="p-1 rounded-md text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/70 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90 cursor-pointer disabled:cursor-not-allowed"
          title="Increase quantity"
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
        </button>
      </div>
    );
  }

  // Field mode for modals/forms
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isZeroOrLess || disabled}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-800 disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 transition-all shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        title="Decrease quantity (min 0)"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4 stroke-[2.5]" />
      </button>

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1, 2 bottles, 500g"
        className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm text-center"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        title="Increase quantity"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};

export default QuantitySpinner;

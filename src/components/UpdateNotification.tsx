import React from 'react';
import { RefreshCw, Download } from 'lucide-react';

interface UpdateNotificationProps {
  hasUpdate: boolean;
  onReload: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ hasUpdate, onReload }) => {
  if (!hasUpdate) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-emerald-500 animate-bounce-short">
      <div className="flex items-center gap-2.5">
        <Download className="w-5 h-5 shrink-0 animate-pulse" />
        <span className="text-xs sm:text-sm font-medium">App updating to latest version...</span>
      </div>
      <button
        type="button"
        onClick={onReload}
        className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Reloading
      </button>
    </div>
  );
};

export default UpdateNotification;

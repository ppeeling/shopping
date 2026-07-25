import React from 'react';
import { ShoppingCart, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AUTHORIZED_USERS } from '../types';

interface HeaderProps {
  currentUserEmail: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  activeItemsCount: number;
  completedItemsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUserEmail,
  isDark,
  onToggleTheme,
  onOpenAuth,
  activeItemsCount,
  completedItemsCount
}) => {
  const userObj = AUTHORIZED_USERS[currentUserEmail] || {
    email: currentUserEmail,
    name: currentUserEmail.split('@')[0],
    avatar: '👤'
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white font-bold text-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              Grocery List
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Shared
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>{activeItemsCount} to buy</span>
              <span>•</span>
              <span>{completedItemsCount} bought</span>
            </p>
          </div>
        </div>

        {/* Right actions: User Switcher & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* User badge */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all active:scale-95"
            title="Click to switch user or sign in"
          >
            <span className="text-base">{userObj.avatar}</span>
            <span className="hidden sm:inline font-medium text-slate-200">{userObj.name.split(' ')[0]}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
};

export default Header;

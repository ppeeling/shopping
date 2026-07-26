import React from 'react';
import { ShoppingCart, ShieldCheck, LogIn, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AUTHORIZED_USERS } from '../types';
import { auth } from '../lib/firebase';
import { APP_VERSION } from '../version';

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
  const firebaseUser = auth.currentUser;
  const isSignedInWithGoogle = Boolean(firebaseUser && !firebaseUser.isAnonymous && firebaseUser.email);
  const activeEmail = (isSignedInWithGoogle ? firebaseUser?.email : currentUserEmail)?.toLowerCase() || '';

  const userObj = AUTHORIZED_USERS[activeEmail] || {
    email: activeEmail,
    name: firebaseUser?.displayName || (activeEmail ? activeEmail.split('@')[0] : 'Guest'),
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
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1.5 flex-wrap">
              Grocery List
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Shared
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-tight px-1.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80 shadow-xs">
                v{APP_VERSION}
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>{activeItemsCount} to buy</span>
              <span>•</span>
              <span>{completedItemsCount} bought</span>
            </p>
          </div>
        </div>

        {/* Right actions: Google Auth Badge & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* User badge / Google Auth */}
          <button
            type="button"
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 ${
              isSignedInWithGoogle
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
            }`}
            title={isSignedInWithGoogle ? `Signed in as ${activeEmail}` : 'Sign in with Google'}
          >
            {isSignedInWithGoogle ? (
              <>
                {firebaseUser?.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="text-sm">{userObj.avatar}</span>
                )}
                <span className="hidden sm:inline font-medium text-emerald-100">{userObj.name.split(' ')[0]}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium text-slate-200">Sign In</span>
              </>
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
};

export default Header;


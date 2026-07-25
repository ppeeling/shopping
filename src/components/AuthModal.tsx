import React, { useState } from 'react';
import { X, ShieldCheck, LogIn, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AUTHORIZED_EMAILS, AUTHORIZED_USERS } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onSelectUser: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onSelectUser
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase();
      if (!email || !AUTHORIZED_EMAILS.includes(email)) {
        await signOut(auth);
        setErrorMsg(`Access Denied: ${email || 'This account'} is not authorized. Only paulpeeling@gmail.com and huichiao45@gmail.com can access this list.`);
      } else {
        onSelectUser(email);
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-in failed or closed:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Sign in popup could not be completed in preview window. You can select your profile below directly.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Authorized Family Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            This shared grocery list is strictly restricted to Paul & Hui-Chiao.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Identity Switcher for Both Family Members */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Active Profile
          </label>
          <div className="space-y-2.5">
            {AUTHORIZED_EMAILS.map((email) => {
              const userObj = AUTHORIZED_USERS[email];
              const isSelected = currentUserEmail === email;

              return (
                <button
                  key={email}
                  type="button"
                  onClick={() => {
                    onSelectUser(email);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{userObj.avatar}</span>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {userObj.name}
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{userObj.email}</div>
                    </div>
                  </div>
                  <UserCheck className={`w-5 h-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Verifying...' : 'Sign In with Google Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

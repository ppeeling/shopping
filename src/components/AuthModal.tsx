import React, { useState } from 'react';
import { X, ShieldCheck, LogIn, LogOut, AlertCircle, ExternalLink, Copy, Check, User as UserIcon } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AUTHORIZED_EMAILS, AUTHORIZED_USERS } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const firebaseUser = auth.currentUser;
  const isSignedInWithGoogle = Boolean(firebaseUser && !firebaseUser.isAnonymous && firebaseUser.email);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setErrorCode(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase();
      if (email && !AUTHORIZED_EMAILS.includes(email)) {
        await signOut(auth);
        setErrorMsg(`Access Denied: ${email} is not authorized. Only authorized family members can access this list.`);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-in popup result:', err);
      const code = err.code || '';
      setErrorCode(code);

      if (code === 'auth/unauthorized-domain') {
        setErrorMsg(`Domain "${currentDomain}" is not in Firebase Auth's Authorized Domains list.`);
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Sign in popup was blocked by your browser. Please allow popups or open the app in a new tab.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg(null);
      } else {
        setErrorMsg('Sign-in popup is restricted in the preview window (iframe cross-origin restriction). Please open the app in a new browser tab to sign in with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeEmail = (isSignedInWithGoogle ? firebaseUser?.email : currentUserEmail)?.toLowerCase() || '';
  const knownUser = AUTHORIZED_USERS[activeEmail];

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
            Google Account Authentication
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Your profile identity is strictly determined by who is logged in with Google auth.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>{errorMsg}</span>
            </div>

            {errorCode === 'auth/unauthorized-domain' && currentDomain && (
              <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                <p className="mb-1.5">Add this domain to <strong>Firebase Console → Authentication → Settings → Authorized Domains</strong>:</p>
                <div className="flex items-center justify-between bg-amber-100/70 dark:bg-amber-900/60 p-2 rounded-xl font-mono text-[10px] break-all">
                  <span>{currentDomain}</span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="ml-2 shrink-0 p-1 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 rounded-lg text-amber-900 dark:text-amber-100 transition-colors flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300">
              <span>Try signing in via standalone tab:</span>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Current Google Account Status Card */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Logged-In Profile
          </label>

          {isSignedInWithGoogle && firebaseUser ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/50 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border border-emerald-500/30 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {knownUser?.avatar || '👤'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-1.5">
                    {firebaseUser.displayName || knownUser?.name || activeEmail.split('@')[0]}
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Google Auth
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {firebaseUser.email}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Not Signed In with Google</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in below with your Google account to authorize updates as your profile.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google OAuth Action / Sign Out */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {isSignedInWithGoogle ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isLoading ? 'Signing Out...' : 'Sign Out of Google Account'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Signing In...' : 'Sign In with Google Account'}
            </button>
          )}

          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Window for Popup OAuth</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;


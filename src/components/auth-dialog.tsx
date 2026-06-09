'use client';

import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { PlantLoader } from '@/components/garden/plant-loader';

type Mode = 'signin' | 'signup';

/** Turn raw Firebase auth error codes into something a human wants to read. */
function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'That email address looks invalid.';
      case 'auth/missing-password':
        return 'Please enter a password.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/email-already-in-use':
        return 'An account already exists for that email. Try signing in.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return ''; // user backed out — not worth an error message
      case 'auth/popup-blocked':
        return 'Your browser blocked the sign-in popup. Allow popups and retry.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'google' | 'email' | null>(null);

  // On success the AuthProvider's onAuthStateChanged fires and the page-level
  // redirect effect sends the user to /garden, so we just close + reset here.
  function reset() {
    setError('');
    setPassword('');
    setPending(null);
  }

  async function run(action: () => Promise<void>, which: 'google' | 'email') {
    setError('');
    setPending(which);
    try {
      await action();
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(friendlyError(err));
      setPending(null);
    }
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        mode === 'signin'
          ? signInWithEmail(email, password)
          : signUpWithEmail(email, password),
      'email'
    );
  }

  const busy = pending !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return; // don't dismiss mid-request
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        {busy ? (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle>
                {mode === 'signup' ? 'Planting your garden' : 'Waking your garden'}
              </DialogTitle>
              <DialogDescription>
                Just a moment while we get everything growing.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <PlantLoader />
            </div>
          </>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Welcome back' : 'Create your garden'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Sign in to tend your plants and keep your streak alive.'
              : 'Sign up to start growing, it only takes a moment.'}
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => run(signInWithGoogle, 'google')}
        >
          <GoogleGlyph />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gardener@email.com"
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={busy}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
              setError('');
            }}
            className="font-bold text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Inline Google "G" mark so we don't pull in an icon dependency. */
function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard';
import { useAuth } from '@/components/auth-provider';

export default function GardenPage() {
  const { signedIn, ready, signOut } = useAuth();
  const router = useRouter();

  // Guard: bounce to landing if not signed in.
  useEffect(() => {
    if (ready && !signedIn) {
      router.replace('/');
    }
  }, [ready, signedIn, router]);

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  if (!ready || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="animate-float text-5xl" role="status" aria-label="Loading">
          🪴
        </span>
      </div>
    );
  }

  return <Dashboard onSignOut={handleSignOut} />;
}

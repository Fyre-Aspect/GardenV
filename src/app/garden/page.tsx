'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
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

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (!ready || !signedIn) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        role="status"
        aria-label="Loading your garden"
      >
        <Leaf className="h-10 w-10 animate-float text-primary/70" />
      </div>
    );
  }

  return <Dashboard onSignOut={handleSignOut} />;
}

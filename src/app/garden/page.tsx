'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard';
import { useAuth } from '@/components/auth-provider';
import { PlantLoader } from '@/components/garden/plant-loader';

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
        <PlantLoader label="Loading your garden" />
      </div>
    );
  }

  return <Dashboard onSignOut={handleSignOut} />;
}

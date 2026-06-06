'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '@/components/landing';
import { useAuth } from '@/components/auth-provider';

export default function HomePage() {
  const { signedIn, ready, signIn } = useAuth();
  const router = useRouter();

  // Already signed in → skip the marketing page.
  useEffect(() => {
    if (ready && signedIn) {
      router.replace('/garden');
    }
  }, [ready, signedIn, router]);

  function handleStart() {
    signIn();
    router.push('/garden');
  }

  return <Landing onStart={handleStart} />;
}

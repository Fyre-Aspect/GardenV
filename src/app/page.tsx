'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '@/components/landing';
import { AuthDialog } from '@/components/auth-dialog';
import { useAuth } from '@/components/auth-provider';

export default function HomePage() {
  const { signedIn, ready } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  // Already signed in → skip the marketing page. The redirect also fires right
  // after a successful sign-in, since onAuthStateChanged flips `signedIn`.
  useEffect(() => {
    if (ready && signedIn) {
      router.replace('/garden');
    }
  }, [ready, signedIn, router]);

  return (
    <>
      <Landing onStart={() => setAuthOpen(true)} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

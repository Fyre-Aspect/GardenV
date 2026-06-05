import { useAuth } from '@/lib/AuthContext';

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream">
      <h1 className="text-3xl font-bold text-garden">GardenKeeper</h1>
      <p className="text-gray-600">Sign in to tend your plants.</p>
      <button
        onClick={() => signInWithGoogle()}
        className="rounded-lg bg-garden px-6 py-3 font-medium text-white shadow hover:opacity-90"
      >
        Sign in with Google
      </button>
    </div>
  );
}

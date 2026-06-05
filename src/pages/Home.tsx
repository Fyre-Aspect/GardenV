import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';

interface PlantRow {
  id: string;
  name: string;
  species: string;
}

export function Home() {
  const { user, signOutUser } = useAuth();
  const [plants, setPlants] = useState<PlantRow[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const plantsRef = collection(db, 'users', user.uid, 'plants');
    const plantsQuery = query(plantsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(plantsQuery, (snapshot) => {
      setPlants(
        snapshot.docs.map((document) => {
          const data = document.data() as Pick<PlantRow, 'name' | 'species'>;
          return { id: document.id, name: data.name, species: data.species };
        })
      );
    });
    return unsubscribe;
  }, [user]);

  async function addTestPlant() {
    if (!user) {
      return;
    }
    const plantsRef = collection(db, 'users', user.uid, 'plants');
    await addDoc(plantsRef, {
      userId: user.uid,
      name: `Test Plant ${plants.length + 1}`,
      species: 'Monstera deliciosa',
      photoURL: '',
      createdAt: serverTimestamp(),
      careProfile: {
        wateringIntervalDays: 7,
        fertilizingIntervalDays: 30,
        lightRequirement: 'medium',
      },
      lastScan: null,
      nextActions: [],
    });
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-garden">GardenKeeper</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={() => signOutUser()} className="text-sm text-garden underline">
            Sign out
          </button>
        </div>
      </header>

      <button
        onClick={() => addTestPlant()}
        className="mb-6 rounded-lg bg-garden px-4 py-2 font-medium text-white shadow hover:opacity-90"
      >
        Add test plant
      </button>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <li
            key={plant.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-gray-900">{plant.name}</p>
            <p className="text-sm text-gray-500">{plant.species}</p>
          </li>
        ))}
        {plants.length === 0 && (
          <li className="text-gray-400">No plants yet — add one to test Firestore.</li>
        )}
      </ul>
    </div>
  );
}

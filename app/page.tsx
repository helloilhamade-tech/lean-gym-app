'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/db/dexie-db';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    async function checkStatus() {
      if (!user) {
        router.replace('/login');
        return;
      }

      const profile = await db.profiles.toCollection().first();
      if (profile) {
        router.replace('/today');
      } else {
        router.replace('/onboarding');
      }
    }

    checkStatus();
  }, [user, loading, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-mutedText">Memuat LEAN...</p>
    </div>
  );
}

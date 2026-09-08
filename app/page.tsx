'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/dexie-db';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      const profile = await db.profiles.toCollection().first();
      if (profile) {
        router.replace('/today');
      } else {
        router.replace('/login');
      }
    }
    checkStatus();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

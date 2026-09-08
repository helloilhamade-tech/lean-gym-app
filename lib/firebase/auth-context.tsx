'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './config';
import { syncCloudToLocal, syncLocalToCloud } from './sync';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  triggerSync: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOutUser: async () => {},
  triggerSync: async () => ({ success: false, message: 'Not configured' }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Auto sync on login
        await syncCloudToLocal(currentUser.uid);
        await syncLocalToCloud(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth not available');
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth not available');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth not available');
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
  };

  const triggerSync = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Masuk dengan akun terlebih dahulu.' };
    }
    const uploadRes = await syncLocalToCloud(user.uid);
    const downloadRes = await syncCloudToLocal(user.uid);

    if (uploadRes.success || downloadRes.success) {
      window.dispatchEvent(new Event('lean_data_changed'));
      return { success: true, message: 'Sinkronisasi berhasil!' };
    }
    return { success: false, message: uploadRes.error || 'Gagal sinkronisasi' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

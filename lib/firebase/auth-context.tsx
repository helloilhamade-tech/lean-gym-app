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

export interface LeanUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  isGuest?: boolean;
}

export type AuthUser = (User | LeanUser) & { isGuest?: boolean };

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsGuest: () => void;
  signOutUser: () => Promise<void>;
  triggerSync: () => Promise<{ success: boolean; message: string }>;
}

const GUEST_USER: AuthUser = {
  uid: 'guest-local-user',
  displayName: 'Tamu / Offline',
  email: 'guest@leangym.local',
  isGuest: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isConfigured: false,
  isGuest: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInAsGuest: () => {},
  signOutUser: async () => {},
  triggerSync: async () => ({ success: false, message: 'Not configured' }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasGuestSession =
      typeof window !== 'undefined' && localStorage.getItem('lean_guest_session') === 'true';

    if (!isFirebaseConfigured || !auth) {
      if (hasGuestSession) {
        setUser(GUEST_USER);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lean_guest_session');
        }
        setUser(currentUser);
        setLoading(false);

        // Auto sync on login
        await syncCloudToLocal(currentUser.uid);
        await syncLocalToCloud(currentUser.uid);
      } else {
        if (typeof window !== 'undefined' && localStorage.getItem('lean_guest_session') === 'true') {
          setUser(GUEST_USER);
        } else {
          setUser(null);
        }
        setLoading(false);
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

  const signInAsGuest = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lean_guest_session', 'true');
    }
    setUser(GUEST_USER);
  };

  const signOutUser = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lean_guest_session');
    }
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('SignOut warning:', e);
      }
    }
    setUser(null);
  };

  const triggerSync = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Masuk dengan akun terlebih dahulu.' };
    }
    if ('isGuest' in user && user.isGuest) {
      return {
        success: false,
        message: 'Mode Tamu: Masuk dengan Google/Email untuk sinkronisasi cloud.',
      };
    }
    const uploadRes = await syncLocalToCloud(user.uid);
    const downloadRes = await syncCloudToLocal(user.uid);

    if (uploadRes.success || downloadRes.success) {
      window.dispatchEvent(new Event('lean_data_changed'));
      return { success: true, message: 'Sinkronisasi berhasil!' };
    }
    return { success: false, message: uploadRes.error || 'Gagal sinkronisasi' };
  };

  const isGuest = Boolean(user && 'isGuest' in user && user.isGuest);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        isGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOutUser,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

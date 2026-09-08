'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Dumbbell, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/db/dexie-db';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, route to today or onboarding
  useEffect(() => {
    async function checkExisting() {
      if (!loading && user) {
        const profile = await db.profiles.toCollection().first();
        if (profile) {
          router.replace('/today');
        } else {
          router.replace('/onboarding');
        }
      }
    }
    checkExisting();
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Harap isi email dan password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter.');
        }
        await signUpWithEmail(email.trim(), password);
      }

      // Check if user has profile
      const profile = await db.profiles.toCollection().first();
      if (profile) {
        router.replace('/today');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      let msg = err.message || 'Terjadi kesalahan saat masuk.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Email atau password salah.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Akun belum terdaftar. Silakan pilih Daftar Baru.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email sudah digunakan. Silakan langsung masuk.';
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      const profile = await db.profiles.toCollection().first();
      if (profile) {
        router.replace('/today');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Gagal masuk dengan Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-2 animate-in fade-in duration-200">
      {/* 1. Brand & Header */}
      <div className="space-y-3 text-center pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary mb-1 shadow-lg shadow-primary/20">
          <Dumbbell className="w-7 h-7 stroke-[2.2px]" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-3xl font-black text-white tracking-tight">LEAN</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
          </div>
          <p className="text-xs text-mutedText mt-1">
            Personalized Gym & Body Lean Tracker
          </p>
        </div>

        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
          Silakan masuk menggunakan akun <strong>Google (Gmail)</strong> untuk membuka seluruh fitur latihan, direktori anatomi otot, dan catatan beban gym Anda.
        </p>
      </div>

      {/* 2. Login Card */}
      <div className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 my-auto">
        {/* HERO: 1-Click Google / Gmail Sign In */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-black font-extrabold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-white/10 disabled:opacity-60"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.2L1.6 16c1.9 3.7 5.8 7 10.4 7z"/>
            </svg>
            <span>{isSubmitting ? 'Menghubungkan ke Google...' : 'Masuk dengan Google (Gmail)'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-mutedText justify-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Akses 1-ketuk langsung, aman tersinkronisasi</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-[1px] bg-surfaceBorder"></div>
          <span className="text-[10px] uppercase font-bold text-subtleText">atau gunakan email</span>
          <div className="flex-1 h-[1px] bg-surfaceBorder"></div>
        </div>

        {/* Mode Selector Tabs for Email */}
        <div className="flex bg-card rounded-xl p-1 border border-surfaceBorder">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'signin'
                ? 'bg-surface text-white shadow'
                : 'text-mutedText hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-surface text-white shadow'
                : 'text-mutedText hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-card border border-surfaceBorder rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-card border border-surfaceBorder rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Memproses...' : mode === 'signin' ? 'Masuk dengan Email' : 'Daftar dengan Email'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 3. Bottom Security & Sync Explanation */}
      <div className="text-center pt-2 px-4">
        <p className="text-[11px] text-mutedText leading-relaxed">
          Setelah login, seluruh fitur aplikasi akan terbuka dan data latihan Anda dapat diakses di berbagai perangkat secara sinkron.
        </p>
      </div>
    </div>
  );
}

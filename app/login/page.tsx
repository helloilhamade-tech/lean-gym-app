'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  AlertCircle,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/db/dexie-db';

interface AuthErrorInfo {
  title: string;
  description: string;
  isFirebaseConfigIssue?: boolean;
  rawDetails?: string;
}

function getFriendlyAuthError(err: any): AuthErrorInfo {
  if (!err) {
    return {
      title: 'Terjadi Kesalahan',
      description: 'Gagal melakukan login. Silakan coba beberapa saat lagi.',
    };
  }

  const code = String(err.code || '');
  const message = String(err.message || '').toLowerCase();
  const rawDetails = `Code: ${err.code || 'N/A'} | Error: ${err.name || 'Error'}: ${err.message || String(err)}`;

  // Internal error or operation not allowed -> Firebase Console config
  if (
    code === 'auth/internal-error' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/configuration-not-found' ||
    message.includes('unknownerror') ||
    message.includes('internal error')
  ) {
    return {
      title: 'Autentikasi Google Belum Dapat Terhubung',
      description:
        'Firebase menolak koneksi Google Auth. Hal ini umumnya terjadi karena domain web belum didaftarkan di Authorized Domains, Support Email belum disimpan, atau browser memblokir penyimpanan cross-domain.',
      isFirebaseConfigIssue: true,
      rawDetails,
    };
  }

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return {
      title: 'Domain Belum Terdaftar di Firebase',
      description:
        'Domain web ini belum ditambahkan ke Firebase Console > Authentication > Settings > Authorized domains.',
      isFirebaseConfigIssue: true,
      rawDetails,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Pop-up Diblokir Browser',
      description: 'Browser Anda memblokir jendela popup Google. Coba gunakan metode Redirect (halaman penuh) di bawah.',
      rawDetails,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      title: 'Login Dibatalkan',
      description: 'Jendela login ditutup sebelum proses verifikasi selesai.',
      rawDetails,
    };
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return {
      title: 'Email atau Kata Sandi Salah',
      description: 'Kombinasi email dan kata sandi yang Anda masukkan tidak cocok.',
      rawDetails,
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      title: 'Akun Belum Terdaftar',
      description: 'Email ini belum terdaftar. Silakan pilih tab "Daftar Baru" untuk membuat akun.',
      rawDetails,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      title: 'Email Sudah Digunakan',
      description: 'Email ini sudah memiliki akun. Silakan langsung masuk di tab "Masuk".',
      rawDetails,
    };
  }

  if (code === 'auth/weak-password') {
    return {
      title: 'Password Terlalu Pendek',
      description: 'Kata sandi minimal harus terdiri dari 6 karakter.',
      rawDetails,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      title: 'Gangguan Koneksi Jaringan',
      description: 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.',
      rawDetails,
    };
  }

  return {
    title: 'Gagal Masuk',
    description: err.message || 'Terjadi kesalahan saat proses autentikasi.',
    rawDetails,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithGoogleRedirect, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [showRawDetails, setShowRawDetails] = useState(false);
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
    setErrorInfo(null);
    if (!email.trim() || !password) {
      setErrorInfo({
        title: 'Formulir Belum Lengkap',
        description: 'Harap isi alamat email dan kata sandi Anda.',
      });
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
      setErrorInfo(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
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
        setErrorInfo(getFriendlyAuthError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setErrorInfo(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setErrorInfo(getFriendlyAuthError(err));
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
          Silakan masuk menggunakan akun <strong>Google (Gmail)</strong> atau <strong>Email</strong> untuk membuka seluruh fitur latihan, rekomendasi nutrisi, dan tracking gym Anda.
        </p>
      </div>

      {/* 2. Login Card */}
      <div className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 my-4">
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

        {/* Detailed Error & Troubleshooting Banner */}
        {errorInfo && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2 text-rose-300 animate-in fade-in duration-200">
            <div className="flex items-start gap-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorInfo.title}</span>
            </div>
            <p className="text-[11px] text-rose-300 leading-relaxed pl-6">
              {errorInfo.description}
            </p>

            {errorInfo.isFirebaseConfigIssue && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 pl-6 space-y-2">
                <p className="text-[11px] font-semibold text-white">3 Hal yang Perlu Diperiksa di Firebase Console:</p>
                <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>
                    <strong>Authorized Domains (Paling Penting):</strong> Buka <em>Authentication</em> &gt; tab <em>Settings</em> &gt; <em>Authorized domains</em> &gt; Tambahkan domain web Anda (misal <code>lean-gym-app.vercel.app</code> atau <code>127.0.0.1</code>).
                  </li>
                  <li>
                    <strong>Support Email:</strong> Buka tab <em>Sign-in method</em> &gt; <em>Google</em> &gt; Pastikan kolom <em>Project support email</em> dipilih, lalu klik <strong>Save</strong>.
                  </li>
                  <li>
                    <strong>Cookies &amp; Pop-up:</strong> Jika di browser Brave / Chrome Incognito, matikan Shields atau izinkan 3rd-party cookies untuk Google Auth.
                  </li>
                </ol>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignIn}
                    className="w-full py-2 px-3 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>Coba Google via Redirect (Halaman Penuh)</span>
                  </button>
                </div>
              </div>
            )}

            {errorInfo.rawDetails && (
              <div className="pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => setShowRawDetails(!showRawDetails)}
                  className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted"
                >
                  {showRawDetails ? 'Sembunyikan detail teknis' : 'Lihat detail teknis error'}
                </button>
                {showRawDetails && (
                  <pre className="mt-1 p-2 rounded-lg bg-black/50 border border-surfaceBorder text-[10px] text-rose-200 overflow-x-auto whitespace-pre-wrap font-mono">
                    {errorInfo.rawDetails}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

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
              setErrorInfo(null);
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
              setErrorInfo(null);
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
          Data Anda disimpan di penyimpanan offline perangkat secara aman dan dapat disinkronkan ke cloud sewaktu-waktu.
        </p>
      </div>
    </div>
  );
}

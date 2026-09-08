import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout } from '@/components/shell/AppLayout';

export const metadata: Metadata = {
  title: 'LEAN — Personal Gym Tracker',
  description: 'A quiet personal fitness system that knows what you should do today.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LEAN',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0c0d0e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

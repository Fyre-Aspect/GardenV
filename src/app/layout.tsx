import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { GardenProvider } from '@/components/garden-provider';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GardenKeeper — Grow smarter, not harder',
  description:
    'The AI garden companion that makes caring for your real plants as addictive as leveling up.',
  manifest: '/manifest.json',
  icons: { apple: '/logo192.png' },
};

export const viewport: Viewport = {
  themeColor: '#2d5a27',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-sans">
        <AuthProvider>
          <GardenProvider>{children}</GardenProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

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
  applicationName: 'GardenKeeper',
  icons: { apple: '/logo192.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GardenKeeper',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#2d5a27',
  width: 'device-width',
  initialScale: 1,
  // Standalone PWAs should fill the display and not allow the layout to be
  // zoomed away, while staying accessible.
  maximumScale: 5,
  viewportFit: 'cover',
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

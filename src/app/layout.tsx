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
  title: 'Kindred: Care for your plants, every day',
  description:
    'Kindred helps you remember what each plant needs and turns daily care into a habit worth keeping.',
  manifest: '/manifest.json',
  applicationName: 'Kindred',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/logo192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kindred',
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

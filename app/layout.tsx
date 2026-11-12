import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Grenze, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/context/GameContext';
import { ThemeProvider } from '@/context/ThemeContext';
import NavigationShell from '@/components/NavigationShell';

const grenze = Grenze({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-grenze',
  display: 'swap',
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const isDesktopMode = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
const appTitle = isDesktopMode
  ? 'BOTC Desktop - Narator Trouble Brewing Indonesia'
  : 'Grimoire Trouble Brewing - Narator BOTC Indonesia';
const appDescription =
  'Aplikasi Digital Grimoire dan Narator Storyteller interaktif berbahasa Indonesia untuk Blood on the Clocktower skrip Trouble Brewing.';

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: appTitle,
    description: appDescription,
    type: 'website',
    images: ['/icons/icon-512.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: appTitle,
    description: appDescription,
    images: ['/icons/icon-512.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#121614',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`dark ${grenze.variable} ${atkinson.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#F1F8F4] dark:bg-[#0C0C10] text-slate-900 dark:text-[#EDEAF0] font-sans antialiased selection:bg-[#3D3552] selection:text-[#FFFFFF] min-h-screen transition-colors duration-300"
      >
        <ThemeProvider>
          <GameProvider>
            <NavigationShell>{children}</NavigationShell>
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

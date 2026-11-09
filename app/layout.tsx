import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GameProvider } from '@/context/GameContext';
import NavigationShell from '@/components/NavigationShell';

export const metadata: Metadata = {
  title: 'Grimoire Trouble Brewing - Narator BOTC Indonesia',
  description:
    'Aplikasi web Digital Grimoire dan Narator Storyteller interaktif berbahasa Indonesia untuk Blood on the Clocktower skrip Trouble Brewing.',
  openGraph: {
    title: 'Grimoire Trouble Brewing - Narator BOTC Indonesia',
    description:
      'Aplikasi web Digital Grimoire dan Narator Storyteller interaktif berbahasa Indonesia untuk Blood on the Clocktower skrip Trouble Brewing.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grimoire Trouble Brewing - Narator BOTC Indonesia',
    description:
      'Aplikasi web Digital Grimoire dan Narator Storyteller interaktif berbahasa Indonesia untuk Blood on the Clocktower skrip Trouble Brewing.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0C0C10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body
        suppressHydrationWarning
        className="bg-[#0C0C10] text-[#EDEAF0] font-sans antialiased selection:bg-[#3D3552] selection:text-[#FFFFFF] min-h-screen"
      >
        <GameProvider>
          <NavigationShell>{children}</NavigationShell>
        </GameProvider>
      </body>
    </html>
  );
}

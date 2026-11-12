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

import type { Metadata, Viewport } from 'next';
import './globals.css';

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
  themeColor: '#121016',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body
        suppressHydrationWarning
        className="bg-[#121016] text-[#EDE7DB] font-sans antialiased selection:bg-[#991B1B] selection:text-white min-h-screen"
      >
        {children}
      </body>
    </html>
  );
}

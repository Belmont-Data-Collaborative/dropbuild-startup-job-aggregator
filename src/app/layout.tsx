import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Startup Jobs',
    template: '%s — Startup Jobs',
  },
  description:
    'Curated job listings from top VC portfolio companies — roles in operations, strategy, health tech, and more.',
  openGraph: {
    title: 'Startup Jobs',
    description: 'Curated job listings from top VC portfolio companies.',
    type: 'website',
    siteName: 'Startup Jobs',
  },
  twitter: {
    card: 'summary',
    title: 'Startup Jobs',
    description: 'Curated job listings from top VC portfolio companies.',
  },
};

export const viewport: Viewport = {
  themeColor: '#4355B9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background text-on-background antialiased">
      <body className={`${inter.variable} ${inter.className}`}>{children}</body>
    </html>
  );
}

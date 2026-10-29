import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

const sans = Inter({ variable: '--font-sans', subsets: ['latin'] });
const serif = Source_Serif_4({ variable: '--font-serif', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AHA',
  description: 'Type anything you want to understand. AHA teaches it with visuals you can play with.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#121214' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

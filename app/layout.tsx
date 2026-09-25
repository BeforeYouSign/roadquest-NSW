import type { Metadata, Viewport } from 'next';
import { Lilita_One, Nunito } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const lilita = Lilita_One({ weight: '400', subsets: ['latin'], variable: '--font-lilita', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'RoadQuest NSW — Learn the road. Beat the test. Rule your suburb.', template: '%s · RoadQuest NSW' },
  description: 'An independent road-rules study game for NSW learner drivers. Drive, learn, level up, compete for your suburb and pass the Ultimate NSW Learner Test.',
  applicationName: 'RoadQuest NSW',
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0a1022',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${lilita.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

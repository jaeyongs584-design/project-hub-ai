import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from './components/Sidebar';
import HydrationGuard from './components/HydrationGuard';
import styles from './Layout.module.css';

export const metadata: Metadata = {
  title: 'AGS ProjectHub Manager',
  description: 'AGS AI-Powered Project Management Dashboard',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HydrationGuard>
          <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
              {children}
            </main>
          </div>
        </HydrationGuard>
      </body>
    </html>
  );
}


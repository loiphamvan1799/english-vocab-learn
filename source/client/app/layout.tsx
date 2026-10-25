import type { Metadata } from 'next';

import { AppNavbar } from '@/components/layout/app-navbar';

import './globals.css';

export const metadata: Metadata = {
  title: 'English Vocabulary',
  description: 'Ứng dụng học từ vựng tiếng Anh local-first.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="app-body">
        <AppNavbar />
        <div className="min-h-screen bg-slate-50">{children}</div>
      </body>
    </html>
  );
}

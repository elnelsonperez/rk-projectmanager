import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import Layout from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Project Manager',
  description: 'Sistema de gestión de proyectos de diseño de interiores',
};

// Make the route dynamic to avoid prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>
          <Layout>{children}</Layout>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}

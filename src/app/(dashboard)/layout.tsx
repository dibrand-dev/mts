import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Tablero Principal',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Maestro */}
      <Sidebar />

      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* TopNav Maestro */}
        <TopNav />

        {/* MainContent: Área Dinámica con Fondo #F8FAFC */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#F8FAFC] max-w-full overflow-x-hidden">
          {children}
        </main>

        {/* Footer Maestro según stitch_mts/pie-de-pagina */}
        <Footer />
      </div>
    </div>
  );
}

import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Maestro (Prohibido alterar por IA) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TopNav Maestro (Prohibido alterar por IA) */}
        <TopNav />

        {/* MainContent: Área Dinámica con Fondo #F8FAFC */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#F8FAFC] max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

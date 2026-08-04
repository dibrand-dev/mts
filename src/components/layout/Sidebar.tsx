'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardEdit, 
  Wallet, 
  Users, 
  MapPin, 
  Building2, 
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Settings
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Tablero Principal', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Carga Diaria de Horas', href: '/dashboard/daily-entry', icon: ClipboardEdit },
  { name: 'Cálculo de Sueldos', href: '/dashboard/payroll', icon: ClipboardEdit },
  { name: 'Gestión de Facturación', href: '/dashboard/invoicing', icon: FileSpreadsheet },
  { name: 'Tarifario Comercial', href: '/dashboard/rates', icon: FileSpreadsheet },
  { name: 'Flujo de Caja', href: '/dashboard/cash-flow', icon: Wallet },
  { name: 'Gestión de Personal', href: '/dashboard/employees', icon: Users },
  { name: 'Gestión de Locaciones', href: '/dashboard/locations', icon: MapPin },
  { name: 'Gestión de Clientes', href: '/dashboard/clients', icon: Building2 },
  { name: 'Centro de Reportes', href: '/dashboard/reports', icon: FileSpreadsheet },
  { name: 'Configuración del Sistema', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-[#0F2547] text-white rounded-md shadow-md focus:outline-none"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 w-64 bg-[#d7e2ff] text-[#0b1c30] flex flex-col h-screen shrink-0 border-r border-[#c2c6d4] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#c2c6d4]/40 flex items-center gap-3">
          <img
            src="/mts_logo.png"
            alt="MTS LOGÍSTICA"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Primary Action Button */}
        <div className="px-4 pt-4">
          <Link
            href="/dashboard/daily-entry"
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#1e5bb4] hover:bg-[#004392] text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo Registro</span>
          </Link>
        </div>

        {/* Navigation Options */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1e5bb4] text-white font-bold shadow-xs'
                    : 'text-[#4b5e84] hover:bg-[#dce9ff] hover:text-[#004392] font-medium'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#c2c6d4]/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#4b5e84] hover:bg-red-600/10 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}



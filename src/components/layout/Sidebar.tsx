'use client';

import { useState, useEffect } from 'react';
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
  Settings,
  Briefcase,
  Clock,
  UserCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  testId: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Tablero Principal', href: '/', icon: LayoutDashboard, testId: 'dashboard' },
  { name: 'Carga Diaria de Horas', href: '/daily-entry', icon: ClipboardEdit, testId: 'daily-entry' },
  { name: 'Cálculo de Sueldos', href: '/payroll', icon: ClipboardEdit, testId: 'payroll' },
  { name: 'Gestión de Facturación', href: '/invoicing', icon: FileSpreadsheet, testId: 'invoicing' },
  { name: 'Control de Vencimientos', href: '/invoicing/due-reminders', icon: Clock, testId: 'due-reminders' },
  { name: 'Tarifario Comercial', href: '/rates', icon: FileSpreadsheet, testId: 'rates' },
  { name: 'Ingreso de Caja y Flujo de Caja', href: '/cash-flow', icon: Wallet, testId: 'cash-flow' },
  { name: 'Gestión de Personal', href: '/employees', icon: Users, testId: 'employees' },
  { name: 'Puestos de Trabajo', href: '/positions', icon: Briefcase, testId: 'positions' },
  { name: 'Gestión de Lugares de Trabajo', href: '/locations', icon: MapPin, testId: 'locations' },
  { name: 'Gestión de Clientes', href: '/clients', icon: Building2, testId: 'clients' },
  { name: 'Centro de Reportes', href: '/reports', icon: FileSpreadsheet, testId: 'reports' },
  { name: 'Gestión de Usuarios', href: '/users', icon: UserCheck, testId: 'users', adminOnly: true },
  { name: 'Configuración del Sistema', href: '/settings', icon: Settings, testId: 'settings', adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'accounting_auditor' | null>(null);

  useEffect(() => {
    async function loadUserRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserRole(profile.role);
        }
      }
    }
    loadUserRole();
  }, []);

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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#d7e2ff] text-[#0b1c30] flex flex-col h-screen shrink-0 border-r border-[#c2c6d4] transition-transform duration-300 ease-in-out ${
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

        {/* Primary Action Button (Only for Admin / Full access users) */}
        {userRole !== 'accounting_auditor' ? (
          <div className="px-4 pt-4">
            <Link
              href="/daily-entry"
              data-testid="sidebar-btn-nuevo-registro"
              onClick={() => setIsOpen(false)}
              className="w-full bg-[#1e5bb4] hover:bg-[#004392] text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nuevo Registro</span>
            </Link>
          </div>
        ) : (
          <div className="px-4 pt-4">
            <div className="w-full bg-purple-100/70 border border-purple-200 text-purple-900 rounded-lg p-2.5 text-center">
              <span className="block text-xs font-bold uppercase tracking-wider">Rol Contable</span>
              <span className="block text-[11px] text-purple-700 mt-0.5 font-medium">Acceso Solo Lectura</span>
            </div>
          </div>
        )}

        {/* Navigation Options */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || userRole === 'admin')
            .map((item) => {
              const isActive = (() => {
                if (item.href === '/') return pathname === '/';
                if (pathname === item.href) return true;
                const hasMoreSpecificMatch = navItems.some(
                  (other) => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)
                );
                if (hasMoreSpecificMatch) return false;
                return pathname.startsWith(item.href + '/');
              })();
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`sidebar-link-${item.testId}`}
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
            data-testid="sidebar-btn-logout"
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



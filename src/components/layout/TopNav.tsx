'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Settings, 
  ChevronDown, 
  KeyRound, 
  LogOut, 
  User,
  Sliders
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function TopNav() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Usuario Admin');
  const [userRole, setUserRole] = useState<string>('Admin');
  const [initials, setInitials] = useState<string>('AD');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        const profile = data as { full_name: string; role: string } | null;
        const name = profile?.full_name || user.email?.split('@')[0] || 'Usuario Admin';
        const role = profile?.role === 'admin' ? 'Admin' : (profile?.role || 'Admin');
        
        setUserName(name);
        setUserRole(role);

        // Generate initials
        const nameParts = name.trim().split(' ');
        if (nameParts.length >= 2) {
          setInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
          setInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      }
    }
    loadUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white w-full sticky top-0 z-30 flex justify-between items-center px-4 pl-14 sm:pl-16 lg:px-8 border-b border-[#E2E8F0] shadow-xs">
      {/* Search Central Section */}
      <div className="flex-1 max-w-md mr-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#1E5BB4] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            className="block w-full bg-[#EFF4FF] border-none rounded-lg py-2 pl-9 pr-12 text-xs sm:text-sm text-[#0B1C30] placeholder-slate-500 focus:ring-2 focus:ring-[#1E5BB4] focus:bg-white transition-all duration-200 outline-none"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-[#C2C6D4] rounded text-[10px] font-medium text-slate-400 bg-white uppercase">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Trailing Actions & User Identity */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications Button */}
        <button 
          className="relative p-2 rounded-full hover:bg-[#EFF4FF] text-[#424752] hover:text-[#0B1C30] transition-colors active:scale-95"
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-600 border-2 border-white"></span>
        </button>

        {/* Settings Button */}
        <Link
          href="/settings"
          className="p-2 rounded-full hover:bg-[#EFF4FF] text-[#424752] hover:text-[#0B1C30] transition-colors active:scale-95"
          title="Configuración del Sistema"
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* Vertical Separator */}
        <div className="h-7 border-l border-[#E2E8F0] mx-1 sm:mx-2"></div>

        {/* User Identity Section with Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#EFF4FF] transition-colors cursor-pointer text-left focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-xs sm:text-sm text-[#0B1C30] leading-none">{userName}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{userRole}</p>
            </div>

            {/* Avatar Circle */}
            <div className="h-9 w-9 rounded-full bg-[#1E5BB4] flex items-center justify-center text-white font-bold text-xs sm:text-sm ring-2 ring-transparent hover:ring-[#1E5BB4]/30 transition-all shrink-0">
              {initials}
            </div>

            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#1E5BB4]' : ''}`} />
          </button>

          {/* Interactive Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50 animate-fadeIn">
              <div className="p-3 border-b border-slate-100 bg-slate-50 sm:hidden">
                <p className="font-bold text-xs text-[#0B1C30]">Jorge Caetano</p>
                <p className="text-[10px] text-slate-500">Admin</p>
              </div>

              <div className="py-1">
                <Link
                  href="/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-[#0B1C30] hover:bg-[#EFF4FF] hover:text-[#1E5BB4] transition-colors font-medium"
                >
                  <KeyRound className="h-4 w-4 text-[#1E5BB4]" />
                  <span>Modificar Contraseña</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-[#0B1C30] hover:bg-[#EFF4FF] hover:text-[#1E5BB4] transition-colors font-medium"
                >
                  <Sliders className="h-4 w-4 text-[#1E5BB4]" />
                  <span>Configuración</span>
                </Link>

                <hr className="my-1 border-slate-100" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

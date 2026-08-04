'use client';

import { Bell, User } from 'lucide-react';

export function TopNav() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 pl-14 sm:pl-16 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs max-w-full overflow-hidden">
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <h1 className="text-xs sm:text-sm md:text-base font-semibold text-[#0F2547] truncate">
          Plataforma de Facturación y Operaciones
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button className="p-1.5 sm:p-2 text-slate-500 hover:text-[#0F2547] hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="bg-[#1E5BB4]/10 p-1.5 sm:p-2 rounded-full text-[#1E5BB4]">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-left text-xs sm:text-sm hidden xs:block">
            <p className="font-semibold text-[#0F2547] leading-none">Jorge / Matías</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#c2c6d4] bg-[#eff4ff] flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-8 py-4 mt-auto">
      {/* Left Side: Copyright and Developer Info */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#424752] font-medium text-center sm:text-left">
          2026 | MTS Gestión Logística - Desarrollo: <a href="https://www.dibrand.co" target="_blank" rel="noopener noreferrer">Dibrand</a>
        </span>
      </div>

      {/* Right Side: Navigation Links */}
      <nav className="flex items-center gap-6">
        <a 
          className="text-xs text-[#424752] hover:text-[#004392] font-medium transition-colors duration-200" 
          href="mailto:soporte@dibrand.co"
          target="_blank"
          rel="noopener noreferrer"
        >
          Soporte Dibrand
        </a>
      </nav>
    </footer>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function LocationsPage() {
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Locaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Administre muelles, almacenes y áreas de operaciones.</p>
        </div>
      </header>

      {/* Section 1: Filters Card (Sky Blue B2B) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="search-location">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2547]" />
              <input
                id="search-location"
                type="text"
                placeholder="Nombre o Puerto..."
                className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          <div className="w-full md:w-64 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="filter-status">Estado</label>
            <div className="relative w-full">
              <select
                id="filter-status"
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="inactivo">Inactivo</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={() => setIsSlideoverOpen(true)}
              className="w-full md:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Locación</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Data Table Card (White) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
              <tr>
                <th className="py-3 px-4 pl-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">ID</th>
                <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Nombre</th>
                <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Puerto/Ciudad</th>
                <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Capacidad</th>
                <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Estado</th>
                <th className="py-3 px-4 pr-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-500 font-medium">LOC-001</td>
                <td className="py-3 px-4 font-semibold text-[#0B1C30]">Muelle Norte 1</td>
                <td className="py-3 px-4">Puerto Valparaíso</td>
                <td className="py-3 px-4 font-mono text-xs">5000 TEU</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="py-3 px-4 pr-6 text-right space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-500 font-medium">LOC-002</td>
                <td className="py-3 px-4 font-semibold text-[#0B1C30]">Almacén Techado B</td>
                <td className="py-3 px-4">San Antonio</td>
                <td className="py-3 px-4 font-mono text-xs">12000 m2</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="py-3 px-4 pr-6 text-right space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-500 font-medium">LOC-003</td>
                <td className="py-3 px-4 font-semibold text-[#0B1C30]">Patio Contenedores Sur</td>
                <td className="py-3 px-4">Puerto Rosario</td>
                <td className="py-3 px-4 font-mono text-xs">8500 TEU</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Mantenimiento
                  </span>
                </td>
                <td className="py-3 px-4 pr-6 text-right space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Slide-over (Alta / Edición de Locación) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Alta / Edición de Locación</h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="p-6 flex-1 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Código</label>
                <input
                  type="text"
                  placeholder="Ej: LOC-004"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nombre Locación</label>
                <input
                  type="text"
                  placeholder="Ej: Muelle Sur 2"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puerto / Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Puerto Buenos Aires"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Capacidad</label>
                <input
                  type="text"
                  placeholder="Ej: 6000 TEU"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Guardar Locación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

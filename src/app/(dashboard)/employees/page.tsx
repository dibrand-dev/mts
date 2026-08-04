'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Filter, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function EmployeesPage() {
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Gestión de Personal</h1>
          <p className="text-slate-500 text-sm mt-1">Administración de empleados, altas, bajas y perfiles operativos</p>
        </div>
      </header>

      {/* Section 1: Filters Card (Sky Blue B2B) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <form className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="search">Buscar Empleado</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2547]" />
              <input
                id="search"
                type="text"
                placeholder="Nombre o DNI"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Post Dropdown */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="puesto">Puesto</label>
            <div className="relative w-full">
              <select
                id="puesto"
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Puestos</option>
                <option value="estibador">Estibador</option>
                <option value="supervisor">Supervisor</option>
                <option value="guinchero">Guinchero</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="estado">Estado</label>
            <div className="relative w-full">
              <select
                id="estado"
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="vacaciones">Vacaciones</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              className="bg-white text-[#0F2547] font-semibold text-sm px-4 py-2 rounded-lg border border-[#0F2547] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Filter className="h-4 w-4" />
              <span>Filtrar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSlideoverOpen(true)}
              className="bg-[#1E5BB4] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#004392] transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Empleado</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Data Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6 whitespace-nowrap">DNI</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Nombre Completo</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Puesto</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Teléfono</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right pr-6 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-[#0F2547] font-semibold">28.456.789</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold">Carlos Ruiz</td>
                <td className="px-4 py-3 whitespace-nowrap">Supervisor</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">+54 11 4567-8901</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="px-4 py-3 pr-6 text-right whitespace-nowrap space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-[#0F2547] font-semibold">31.234.567</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold">Miguel Ángel Torres</td>
                <td className="px-4 py-3 whitespace-nowrap">Estibador</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">+54 11 2345-6789</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="px-4 py-3 pr-6 text-right whitespace-nowrap space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-[#0F2547] font-semibold">25.987.654</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold">Roberto Fernández</td>
                <td className="px-4 py-3 whitespace-nowrap">Guinchero</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">+54 11 9876-5432</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Inactivo
                  </span>
                </td>
                <td className="px-4 py-3 pr-6 text-right whitespace-nowrap space-x-1">
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

      {/* Slide-over (Alta / Edición de Personal) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Alta / Edición de Empleado</h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="p-6 flex-1 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Ruiz"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">DNI</label>
                <input
                  type="text"
                  placeholder="Ej: 28.456.789"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puesto</label>
                <select className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]">
                  <option>Seleccionar Puesto...</option>
                  <option>Supervisor</option>
                  <option>Estibador</option>
                  <option>Guinchero</option>
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

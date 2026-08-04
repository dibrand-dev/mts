'use client';

import React from 'react';
import { Download, Plus, Filter, ChevronDown, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Centro de Reportes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión y extracción de datos operativos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0F2547] font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-xs">
            <Download className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-[#1E5BB4] text-white rounded-lg font-bold text-sm hover:bg-[#004392] transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap">
            <Plus className="h-4 w-4" />
            <span>Programar Reporte</span>
          </button>
        </div>
      </header>

      {/* Section 1: Search Parameters Card (Sky Blue B2B) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 fill-current" />
          <span>Parámetros de Búsqueda</span>
        </h2>
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="modulo">Módulo</label>
            <div className="relative">
              <select
                id="modulo"
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option>Todos los módulos</option>
                <option>Carga Diaria</option>
                <option>Flujo de Caja</option>
                <option>Personal</option>
                <option>Locaciones</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="fecha_desde">Fecha Desde</label>
            <input
              id="fecha_desde"
              type="date"
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="fecha_hasta">Fecha Hasta</label>
            <input
              id="fecha_hasta"
              type="date"
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium" htmlFor="estado">Estado</label>
            <div className="relative">
              <select
                id="estado"
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option>Cualquier Estado</option>
                <option>Procesado</option>
                <option>Pendiente</option>
                <option>Error</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>
        </form>
      </section>

      {/* Section 2: Results Table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
              <tr>
                <th className="p-3 pl-4 sm:pl-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider">ID Registro</th>
                <th className="p-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Fecha</th>
                <th className="p-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Módulo</th>
                <th className="p-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Detalle</th>
                <th className="p-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Usuario Responsable</th>
                <th className="p-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Estado</th>
                <th className="p-3 pr-4 sm:pr-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs font-bold text-[#0F2547]">#REP-0091</td>
                <td className="p-3 text-slate-600 text-xs">12/10/2026</td>
                <td className="p-3 font-medium">Carga Diaria</td>
                <td className="p-3 max-w-[200px] truncate" title="Resumen de horas buque Amazonas">Resumen de horas buque Amazonas</td>
                <td className="p-3">Carlos Mendoza</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Procesado
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Ver detalle">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs font-bold text-[#0F2547]">#REP-0092</td>
                <td className="p-3 text-slate-600 text-xs">12/10/2026</td>
                <td className="p-3 font-medium">Flujo de Caja</td>
                <td className="p-3 max-w-[200px] truncate" title="Balance Semanal Locación Norte">Balance Semanal Locación Norte</td>
                <td className="p-3">Ana Ramírez</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" /> Pendiente
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Ver detalle">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs font-bold text-[#0F2547]">#REP-0093</td>
                <td className="p-3 text-slate-600 text-xs">11/10/2026</td>
                <td className="p-3 font-medium">Personal</td>
                <td className="p-3 max-w-[200px] truncate" title="Reporte de asistencias turno noche">Reporte de asistencias turno noche</td>
                <td className="p-3">Luis García</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Procesado
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Ver detalle">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs font-bold text-[#0F2547]">#REP-0094</td>
                <td className="p-3 text-slate-600 text-xs">10/10/2026</td>
                <td className="p-3 font-medium">Locaciones</td>
                <td className="p-3 max-w-[200px] truncate" title="Inventario general Depósito Sur">Inventario general Depósito Sur</td>
                <td className="p-3">Marta Silva</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" /> Error
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Ver detalle">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


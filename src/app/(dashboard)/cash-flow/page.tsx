'use client';

import React from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CashFlowPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Ingreso de Caja y Flujo de Caja</h1>
          <p className="text-slate-500 text-sm mt-1">Control de ingresos, egresos y saldo operativo</p>
        </div>
      </header>

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white">Fecha Desde</label>
            <input
              type="date"
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white">Fecha Hasta</label>
            <input
              type="date"
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Área Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white">Área</label>
            <select className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]">
              <option>Todas</option>
              <option>Sueldos</option>
              <option>Impuestos</option>
              <option>Cobros</option>
              <option>Proveedores</option>
              <option>Otros</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-5 py-2.5 text-sm shadow-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap pl-6">Fecha</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Área</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Detalle</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Importe</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Saldo</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-center whitespace-nowrap pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              {/* Fila 1: Ingreso */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-500">15/10/2026</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Ingreso
                  </span>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">Cobros</td>
                <td className="px-4 py-3">Factura #4589 - Cliente A</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">+$12.500,00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">$145.300,00</td>
                <td className="px-4 py-3 pr-6 text-center space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Fila 2: Egreso */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-500">14/10/2026</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Egreso
                  </span>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">Impuestos</td>
                <td className="px-4 py-3">Pago IVA Septiembre</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">-$4.200,00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">$132.800,00</td>
                <td className="px-4 py-3 pr-6 text-center space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Fila 3: Egreso */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-500">12/10/2026</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Egreso
                  </span>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">Sueldos</td>
                <td className="px-4 py-3">Nómina Quincenal</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">-$28.400,00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">$137.000,00</td>
                <td className="px-4 py-3 pr-6 text-center space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Fila 4: Ingreso */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-500">10/10/2026</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Ingreso
                  </span>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">Cobros</td>
                <td className="px-4 py-3">Factura #4588 - Cliente B</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">+$8.900,00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">$165.400,00</td>
                <td className="px-4 py-3 pr-6 text-center space-x-1">
                  <button className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              {/* Fila 5: Egreso */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-500">08/10/2026</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Egreso
                  </span>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">Proveedores</td>
                <td className="px-4 py-3">Mantenimiento Flota</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">-$5.150,00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">$156.500,00</td>
                <td className="px-4 py-3 pr-6 text-center space-x-1">
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

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-xs sm:text-sm">
          <span>Mostrando 1 a 5 de 42 registros</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1" disabled>
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

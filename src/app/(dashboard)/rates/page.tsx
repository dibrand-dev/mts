'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function RatesPage() {
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Tarifario Comercial</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión y configuración de tarifas base y recargos para clientes.</p>
        </div>
      </header>

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search"
                type="text"
                placeholder="Buscar por cliente o servicio..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="plazo">Condición de Pago</label>
            <div className="relative w-full">
              <select
                id="plazo"
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos</option>
                <option value="30">30 Días</option>
                <option value="60">60 Días</option>
                <option value="90">90 Días</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-start md:justify-end">
            <button
              onClick={() => setIsSlideoverOpen(true)}
              className="w-full md:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm py-2.5 px-5 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Tarifa</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 pl-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Puesto / Servicio</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right whitespace-nowrap">Valor Hora Norm.</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right whitespace-nowrap">Valor Hora 50%</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right whitespace-nowrap">Valor Hora 100%</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cond. Pago</th>
                <th className="py-3 px-4 pr-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-semibold">Logística Sur S.A.</td>
                <td className="py-3 px-4">Operador Montacargas</td>
                <td className="py-3 px-4 text-right font-mono">$ 4.500,00</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">$ 6.750,00</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1C30]">$ 9.000,00</td>
                <td className="py-3 px-4 font-mono text-xs">30 Días</td>
                <td className="py-3 px-4 pr-6 text-center space-x-1">
                  <button className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-semibold">Naviera del Puerto</td>
                <td className="py-3 px-4">Estibador</td>
                <td className="py-3 px-4 text-right font-mono">$ 3.200,00</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">$ 4.800,00</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1C30]">$ 6.400,00</td>
                <td className="py-3 px-4 font-mono text-xs">60 Días</td>
                <td className="py-3 px-4 pr-6 text-center space-x-1">
                  <button className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 pl-6 font-semibold">Distribuidora Central</td>
                <td className="py-3 px-4">Jefe de Depósito</td>
                <td className="py-3 px-4 text-right font-mono">$ 6.000,00</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">$ 9.000,00</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1C30]">$ 12.000,00</td>
                <td className="py-3 px-4 font-mono text-xs">30 Días</td>
                <td className="py-3 px-4 pr-6 text-center space-x-1">
                  <button className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
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

      {/* Slide-over (Nueva Tarifa) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Alta / Edición de Tarifa</h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="p-6 flex-1 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Cliente</label>
                <select className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]">
                  <option>Seleccionar Cliente...</option>
                  <option>Logística Sur S.A.</option>
                  <option>Naviera del Puerto</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puesto / Servicio</label>
                <select className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]">
                  <option>Seleccionar Puesto...</option>
                  <option>Operador Montacargas</option>
                  <option>Estibador</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Valor Hora Normal</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

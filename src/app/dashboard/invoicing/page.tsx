'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

export default function InvoicingPage() {
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header & Action */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Facturación</h1>
          <p className="text-slate-500 text-sm mt-1">Administra y filtra facturas y proformas.</p>
        </div>
        <button
          onClick={() => setIsSlideoverOpen(true)}
          className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          type="button"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Factura</span>
        </button>
      </header>

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] rounded-xl p-4 sm:p-6 shadow-sm text-white space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Filtros Búsqueda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Buscador */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Buscador</label>
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cliente, Nro. Factura..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Fecha Desde</label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Fecha Hasta</label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Estado</label>
            <select className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]">
              <option value="">Todos los Estados</option>
              <option value="cobrada">Cobrada</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6">Cliente</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Nro. Factura</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha Factura</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Importe Neto</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">IVA</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Importe Total</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-center pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 pl-6 font-semibold">Logística Global Sur S.A.</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">FC-A-0001-0004512</td>
                <td className="px-6 py-4 text-slate-500 text-xs">15/10/2026</td>
                <td className="px-6 py-4 text-right font-mono">$ 1.250.000,00</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500">$ 262.500,00</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-[#0B1C30]">$ 1.512.500,00</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    Cobrada
                  </span>
                </td>
                <td className="px-6 py-4 pr-6 text-center space-x-1">
                  <button className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 pl-6 font-semibold">Transportes Vía Rápida</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">FC-A-0001-0004513</td>
                <td className="px-6 py-4 text-slate-500 text-xs">18/10/2026</td>
                <td className="px-6 py-4 text-right font-mono">$ 850.000,00</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500">$ 178.500,00</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-[#0B1C30]">$ 1.028.500,00</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    Pendiente
                  </span>
                </td>
                <td className="px-6 py-4 pr-6 text-center space-x-1">
                  <button className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 pl-6 font-semibold">Comercializadora Andina</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">FC-A-0001-0004514</td>
                <td className="px-6 py-4 text-slate-500 text-xs">20/10/2026</td>
                <td className="px-6 py-4 text-right font-mono">$ 3.400.000,00</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500">$ 714.000,00</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-[#0B1C30]">$ 4.114.000,00</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    Pendiente
                  </span>
                </td>
                <td className="px-6 py-4 pr-6 text-center space-x-1">
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

      {/* Slide-over (Alta de Factura) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nueva Factura</h2>
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
                  <option>Logística Global Sur S.A.</option>
                  <option>Transportes Vía Rápida</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nro. Factura</label>
                <input
                  type="text"
                  placeholder="FC-A-0001-0000000"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Importe Neto</label>
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
                  Generar Comprobante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

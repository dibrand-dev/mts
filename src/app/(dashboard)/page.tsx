'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Dashboard Operativo</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen financiero y logístico de la jornada</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/daily-entry"
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-[#0B1C30] hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Carga Diaria</span>
          </Link>
          <Link
            href="/cash-flow"
            className="flex-1 sm:flex-none px-4 py-2 bg-[#1E5BB4] text-white hover:bg-[#004392] font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Ingreso de Caja</span>
          </Link>
        </div>
      </header>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <article className="bg-white border-t-4 border-t-[#1E5BB4] border-x border-b border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
            SALDO BANCO FIN DE MES (Julio 2026)
          </h3>
          <div className="text-xl sm:text-2xl font-bold text-[#1E5BB4] font-mono truncate" title="$ 3.450.000,00">
            $ 3.450.000,00
          </div>
        </article>

        {/* Card 2 */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
              FACTURACIÓN A FIN DE MES (Julio 2026)
            </h3>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold w-fit">
              <ArrowUpRight className="h-3 w-3" />
              <span>5.2% vs mes anterior</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono truncate" title="$ 8.200.000,00">
            $ 8.200.000,00
          </div>
        </article>

        {/* Card 3 */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
              TOTAL GASTO A FIN DE MES
            </h3>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold w-fit">
              <ArrowDownRight className="h-3 w-3" />
              <span>2.1% vs mes anterior</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-500 font-mono truncate" title="$ - 4.750.000,00">
            $ - 4.750.000,00
          </div>
        </article>

        {/* Card 4 */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
            ESTADO DE FACTURACIÓN AL DÍA DE LA FECHA
          </h3>
          <div className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-mono truncate" title="$ 5.100.000,00">
            $ 5.100.000,00
          </div>
        </article>
      </section>

      {/* Lower Section: Alerts (50%) & Evolution Chart (50%) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-[#0B1C30] flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1E5BB4]" />
            <span>Alertas</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1">
            <ul className="divide-y divide-slate-200 flex-1">
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">21/07/2026</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">ENVIAR PROFORMA</p>
                </div>
              </li>
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">22/07/2026</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">ALERTA PARA ENVIAR FACTURAS</p>
                </div>
              </li>
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">25/07/2026</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">Próximos vencimientos, pagos ARCA</p>
                </div>
              </li>
            </ul>
            <div className="p-3 border-t border-slate-200 text-center bg-slate-50">
              <Link className="text-xs font-bold text-[#1E5BB4] hover:underline" href="/dashboard/invoicing">
                Ver todas las alertas
              </Link>
            </div>
          </div>
        </div>

        {/* Evolución Ingresos vs Egresos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1C30]">Evolución Ingresos vs Egresos</h2>
            <span className="text-xs text-slate-500">(Últimos 6 meses)</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col min-h-[300px]">
            {/* Chart Legend */}
            <div className="flex justify-end gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-emerald-600"></div>
                <span className="text-xs text-slate-600 font-medium">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-red-500"></div>
                <span className="text-xs text-slate-600 font-medium">Egresos</span>
              </div>
            </div>

            {/* CSS Bar Chart Simulation matching stitch_mts */}
            <div className="flex-1 flex items-end justify-between pt-6 border-b border-slate-200 px-2 sm:px-4">
              {/* Enero */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[60%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[40%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Ene</span>
              </div>
              {/* Febrero */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[75%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[55%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Feb</span>
              </div>
              {/* Marzo */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[65%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[45%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Mar</span>
              </div>
              {/* Abril */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[85%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[50%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Abr</span>
              </div>
              {/* Mayo */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[70%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[60%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">May</span>
              </div>
              {/* Junio */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[82%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[48%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs font-bold text-[#1E5BB4]">Jun</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

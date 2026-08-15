'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Clock,
  Building2,
  Wallet
} from 'lucide-react';

// Helper to format Date to YYYY-MM-DD
function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format YYYY-MM-DD to DD/MM/YYYY
function formatDisplayDate(isoStr: string): string {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

// Calculate current week bounds (Monday to Sunday)
function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);

  return {
    start: toISODate(startOfWeek),
    end: toISODate(endOfWeek),
  };
}

export default function DashboardPage() {
  const weekDefaults = useMemo(() => getCurrentWeekDates(), []);
  const [startDate, setStartDate] = useState<string>(weekDefaults.start);
  const [endDate, setEndDate] = useState<string>(weekDefaults.end);
  const [activePreset, setActivePreset] = useState<'week' | 'fortnight' | 'month' | 'custom'>('week');

  // Quick filter presets
  const handleSetPreset = (preset: 'week' | 'fortnight' | 'month') => {
    setActivePreset(preset);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (preset === 'week') {
      const dates = getCurrentWeekDates();
      setStartDate(dates.start);
      setEndDate(dates.end);
    } else if (preset === 'fortnight') {
      const currentDay = now.getDate();
      if (currentDay <= 15) {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth, 15);
        setStartDate(toISODate(start));
        setEndDate(toISODate(end));
      } else {
        const start = new Date(currentYear, currentMonth, 16);
        // Default max up to current week end or month end
        const end = new Date(currentYear, currentMonth + 1, 0);
        setStartDate(toISODate(start));
        setEndDate(toISODate(end));
      }
    } else if (preset === 'month') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      setStartDate(toISODate(start));
      setEndDate(toISODate(end));
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header & Actions */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Tablero Principal</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen financiero y logístico de la jornada</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/daily-entry"
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-[#0B1C30] hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Carga Diaria de Horas</span>
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

      {/* Date Range Filter Section (Celeste B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            {/* Fecha Desde */}
            <div className="flex flex-col gap-1">
              <label htmlFor="start-date" className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Fecha Desde</span>
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] font-medium focus:outline-none focus:border-[#1E5BB4] shadow-xs"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex flex-col gap-1">
              <label htmlFor="end-date" className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Fecha Hasta (Máx. Semana Actual)</span>
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] font-medium focus:outline-none focus:border-[#1E5BB4] shadow-xs"
              />
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-white block w-full lg:hidden mb-1">
              Período Rápido:
            </span>
            <button
              type="button"
              onClick={() => handleSetPreset('week')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                activePreset === 'week'
                  ? 'bg-[#0F2547] text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Semana Actual
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('fortnight')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                activePreset === 'fortnight'
                  ? 'bg-[#0F2547] text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Quincena Actual
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('month')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                activePreset === 'month'
                  ? 'bg-[#0F2547] text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Mes Completo
            </button>
          </div>
        </div>

        {/* Selected Period Badge */}
        <div className="pt-2 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sky-200" />
            <span>
              Período de consulta:{' '}
              <strong className="text-white font-semibold">{formatDisplayDate(startDate)}</strong> al{' '}
              <strong className="text-white font-semibold">{formatDisplayDate(endDate)}</strong>
            </span>
          </div>
          {activePreset === 'week' && (
            <span className="bg-sky-700/60 px-2 py-0.5 rounded text-[11px] font-medium text-sky-100">
              Límite: Último día de la semana actual
            </span>
          )}
        </div>
      </section>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <article className="bg-white border-t-4 border-t-[#1E5BB4] border-x border-b border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
            SALDO DISPONIBLE ({formatDisplayDate(startDate)} - {formatDisplayDate(endDate)})
          </h3>
          <div className="text-xl sm:text-2xl font-bold text-[#1E5BB4] font-mono truncate" title="$ 3.450.000,00">
            $ 3.450.000,00
          </div>
        </article>

        {/* Card 2 */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
              FACTURACIÓN DEL PERÍODO
            </h3>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold w-fit">
              <ArrowUpRight className="h-3 w-3" />
              <span>+5.2% vs anterior</span>
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
              TOTAL GASTOS DEL PERÍODO
            </h3>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold w-fit">
              <ArrowDownRight className="h-3 w-3" />
              <span>2.1% optimizado</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-500 font-mono truncate" title="$ - 4.750.000,00">
            $ - 4.750.000,00
          </div>
        </article>

        {/* Card 4 */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-32 justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
            PROFORMAS Y COBRANZAS ACTIVAS
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
            <span>Alertas Operativas y de Facturación</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1">
            <ul className="divide-y divide-slate-200 flex-1">
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Vencimiento Próximo</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">Enviar Proformas de Plazoleta Fiscal</p>
                  <p className="text-xs text-slate-500 mt-0.5">3 clientes pendientes de cierre quincenal</p>
                </div>
              </li>
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className="p-2 bg-sky-50 text-[#1E5BB4] rounded-lg shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Cobranzas Brevo</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">Recordatorios automáticos de facturas pendientes</p>
                  <p className="text-xs text-slate-500 mt-0.5">Aviso a clientes con plazo de pago 7 y 15 días</p>
                </div>
              </li>
              <li className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Liquidación de Sueldos</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5">Auditoría de turnos y jornales de la semana</p>
                  <p className="text-xs text-slate-500 mt-0.5">45 legajos computados</p>
                </div>
              </li>
            </ul>
            <div className="p-3 border-t border-slate-200 text-center bg-slate-50">
              <Link className="text-xs font-bold text-[#1E5BB4] hover:underline" href="/invoicing">
                Ver todas las alertas y vencimientos
              </Link>
            </div>
          </div>
        </div>

        {/* Evolución Ingresos vs Egresos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1C30] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Evolución Ingresos vs Egresos</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Período Semanal / Mensual</span>
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
              {/* Semana 1 */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[60%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[40%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Sem 1</span>
              </div>
              {/* Semana 2 */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[75%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[55%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Sem 2</span>
              </div>
              {/* Semana 3 */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[65%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[45%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Sem 3</span>
              </div>
              {/* Semana 4 */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[85%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[50%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs text-slate-500">Sem 4</span>
              </div>
              {/* Semana Actual */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-end gap-1 h-36">
                  <div className="w-3 sm:w-5 bg-emerald-600 rounded-t-xs h-[90%] transition-opacity group-hover:opacity-80"></div>
                  <div className="w-3 sm:w-5 bg-red-500 rounded-t-xs h-[42%] transition-opacity group-hover:opacity-80"></div>
                </div>
                <span className="text-xs font-bold text-[#1E5BB4]">Actual</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

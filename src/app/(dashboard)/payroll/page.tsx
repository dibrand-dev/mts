'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Search,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  Eye,
  X,
  Filter,
  DollarSign,
  Users,
  Clock,
  ArrowDownRight,
  TrendingUp,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import {
  getPayrollData,
  exportPayrollToCSV,
  PayrollRecord,
  PayrollShiftDetail
} from '@/lib/services/payroll';

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

export default function PayrollPage() {
  const weekDefaults = useMemo(() => getCurrentWeekDates(), []);
  const [startDate, setStartDate] = useState<string>(weekDefaults.start);
  const [endDate, setEndDate] = useState<string>(weekDefaults.end);
  const [activePreset, setActivePreset] = useState<'week' | 'fortnight' | 'month' | 'custom'>('week');

  // Dynamic payroll data state
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState<boolean>(false);

  // Search & Type Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Slideover for employee payroll detail
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch dynamic payroll from Supabase
  const loadPayroll = useCallback(async (start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayrollData(start, end);
      setPayrollData(data);
    } catch (err: any) {
      console.error('Error fetching dynamic payroll:', err);
      setError(err?.message || 'No se pudo cargar la liquidación del período.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadPayroll(startDate, endDate);
    }
  }, [startDate, endDate, loadPayroll]);

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

  // Filtered rows
  const filteredData = useMemo(() => {
    return payrollData.filter((r) => {
      const matchSearch =
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = !typeFilter || r.contractType === typeFilter;

      return matchSearch && matchType;
    });
  }, [payrollData, searchTerm, typeFilter]);

  // Dynamic totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => ({
        count: acc.count + (curr.shiftsCount > 0 ? 1 : 0),
        totalStaff: acc.totalStaff + 1,
        gross: acc.gross + curr.grossAmount,
        advances: acc.advances + curr.advancesAmount,
        net: acc.net + curr.netAmount,
        regularHours: acc.regularHours + curr.regularHours,
        ot50Hours: acc.ot50Hours + curr.overtime50Hours,
        ot100Hours: acc.ot100Hours + curr.overtime100Hours,
      }),
      {
        count: 0,
        totalStaff: 0,
        gross: 0,
        advances: 0,
        net: 0,
        regularHours: 0,
        ot50Hours: 0,
        ot100Hours: 0,
      }
    );
  }, [filteredData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenDetail = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;
    exportPayrollToCSV(filteredData, startDate, endDate);
  };

  const handleApprovePeriod = () => {
    setApprovalSuccess(true);
    setTimeout(() => {
      setApprovalSuccess(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Cálculo de Sueldos y Jornales</h1>
          <p className="text-slate-500 text-sm mt-1">Auditoría de turnos, conceptos y liquidación de personal operativo en tiempo real</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || filteredData.length === 0}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-[#0B1C30] hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Pre-liquidación</span>
          </button>
          <button
            type="button"
            onClick={handleApprovePeriod}
            disabled={loading || filteredData.length === 0}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#1E5BB4] text-white hover:bg-[#004392] font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Aprobar Período</span>
          </button>
        </div>
      </header>

      {/* Approval Success Alert */}
      {approvalSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Período de Liquidación Aprobado</p>
              <p className="text-xs text-emerald-700">Se validaron los haberes del período {formatDisplayDate(startDate)} al {formatDisplayDate(endDate)} para {totals.count} legajos con actividad.</p>
            </div>
          </div>
          <button onClick={() => setApprovalSuccess(false)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Date Range & Search Filter (Celeste B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label htmlFor="payroll-start" className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Fecha Desde</span>
            </label>
            <input
              id="payroll-start"
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] font-medium focus:outline-none focus:border-[#1E5BB4] shadow-xs"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label htmlFor="payroll-end" className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Fecha Hasta (Máx. Fin de Semana)</span>
            </label>
            <input
              id="payroll-end"
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] font-medium focus:outline-none focus:border-[#1E5BB4] shadow-xs"
            />
          </div>

          {/* Buscar Personal */}
          <div className="flex flex-col gap-1">
            <label htmlFor="payroll-search" className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              <span>Buscar Personal</span>
            </label>
            <input
              id="payroll-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Legajo, Nombre o Puesto..."
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4] shadow-xs"
            />
          </div>

          {/* Régimen */}
          <div className="flex flex-col gap-1">
            <label htmlFor="payroll-regimen" className="text-xs font-bold uppercase tracking-wider text-white">Régimen</label>
            <div className="relative w-full">
              <select
                id="payroll-regimen"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4] shadow-xs"
              >
                <option value="">Todos los Regímenes</option>
                <option value="Jornal">Jornal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>
        </div>

        {/* Quick Presets & Range Info */}
        <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Período Rápido:
            </span>
            <button
              type="button"
              onClick={() => handleSetPreset('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                activePreset === 'month'
                  ? 'bg-[#0F2547] text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Mes Completo
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-sky-100">
            {loading ? (
              <span className="flex items-center gap-1.5 text-white font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Calculando liquidación...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-200" />
                <span>
                  Liquidación activa:{' '}
                  <strong className="text-white font-semibold">{formatDisplayDate(startDate)}</strong> al{' '}
                  <strong className="text-white font-semibold">{formatDisplayDate(endDate)}</strong>
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => loadPayroll(startDate, endDate)}
              disabled={loading}
              title="Recalcular haberes"
              className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between text-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Error al calcular nómina</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadPayroll(startDate, endDate)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-semibold text-xs transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white border-t-4 border-t-[#1E5BB4] border-x border-b border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Liquidado</span>
            <Users className="h-4 w-4 text-[#1E5BB4]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1C30] mt-2">
            {totals.count} <span className="text-sm font-normal text-slate-500">de {totals.totalStaff} Legajos</span>
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Básico Bruto</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#0B1C30] font-mono mt-2">{formatCurrency(totals.gross)}</div>
        </article>

        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Anticipos</span>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-2">
            {totals.advances > 0 ? `-${formatCurrency(totals.advances)}` : formatCurrency(0)}
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between border-l-4 border-l-[#1E5BB4]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E5BB4] uppercase tracking-wider">Total Neto a Liquidar</span>
            <DollarSign className="h-4 w-4 text-[#1E5BB4]" />
          </div>
          <div className="text-2xl font-bold text-[#1E5BB4] font-mono mt-2">{formatCurrency(totals.net)}</div>
        </article>
      </section>

      {/* Data Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0B1C30]">Detalle de Sueldos y Jornales</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Desglose de turnos trabajados, horas y anticipos del {formatDisplayDate(startDate)} al {formatDisplayDate(endDate)}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Mostrando {filteredData.length} registros</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium text-[#0B1C30]">Consultando turnos y calculando liquidaciones...</p>
            <p className="text-xs text-slate-400">Sincronizando con partes diarios y tarifarios de Supabase</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold text-[#0B1C30]">No se encontraron registros de turnos para este período o filtro.</p>
            <p className="text-xs text-slate-400 mt-1">Prueba ampliando el rango de fechas en el selector o modificando los términos de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 border-b-2 border-[#0F2547] text-[#0F2547] text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 pl-6 whitespace-nowrap">Legajo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Empleado</th>
                  <th className="py-3 px-4 whitespace-nowrap">Puesto / Función</th>
                  <th className="py-3 px-4 whitespace-nowrap">Régimen</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Turnos</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Hs. Norm.</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Hs. Ext. 50%</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Hs. Ext. 100%</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Anticipos</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Total Neto</th>
                  <th className="py-3 px-4 pr-6 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredData.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-600 font-semibold whitespace-nowrap">
                      {rec.fileNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0B1C30] whitespace-nowrap">
                      {rec.fullName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                      {rec.position}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
                        {rec.contractType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs whitespace-nowrap">
                      {rec.shiftsCount > 0 ? (
                        <span className="bg-blue-50 text-[#1E5BB4] font-bold px-2 py-0.5 rounded border border-blue-200">
                          {rec.shiftsCount} {rec.shiftsCount === 1 ? 'turno' : 'turnos'}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {rec.regularHours > 0 ? `${rec.regularHours}h` : <span className="text-slate-400">0h</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {rec.overtime50Hours > 0 ? (
                        <span className="text-amber-700 font-semibold">{rec.overtime50Hours}h</span>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {rec.overtime100Hours > 0 ? (
                        <span className="text-purple-700 font-semibold">{rec.overtime100Hours}h</span>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-red-600 font-semibold whitespace-nowrap">
                      {rec.advancesAmount > 0 ? `-${formatCurrency(rec.advancesAmount)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1E5BB4] whitespace-nowrap">
                      {formatCurrency(rec.netAmount)}
                    </td>
                    <td className="py-3 px-4 pr-6 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(rec)}
                        className="text-[#1E5BB4] hover:text-[#004392] p-1.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Ver Detalle de Liquidación"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Slide-over: Detalle de Liquidación de Empleado */}
      {isDetailOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative w-screen max-w-xl bg-white text-[#0B1C30] shadow-2xl z-50 flex flex-col h-full overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 bg-[#0F2547] text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Detalle de Liquidación</h2>
                <p className="text-xs text-sky-200 mt-0.5">
                  {selectedRecord.fullName} ({selectedRecord.fileNumber})
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Período: {formatDisplayDate(startDate)} al {formatDisplayDate(endDate)}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md cursor-pointer hover:bg-white/10 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6">
              {/* Resumen de Conceptos */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Puesto / Función</span>
                  <span className="text-sm font-semibold">{selectedRecord.position}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Régimen</span>
                  <span className="text-sm font-semibold">{selectedRecord.contractType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Turnos Computados</span>
                  <span className="text-sm font-semibold">{selectedRecord.shiftsCount} turnos</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Normales</span>
                  <span className="text-sm font-mono">{selectedRecord.regularHours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Extras 50%</span>
                  <span className="text-sm font-mono text-amber-700 font-semibold">{selectedRecord.overtime50Hours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Extras 100%</span>
                  <span className="text-sm font-mono text-purple-700 font-semibold">{selectedRecord.overtime100Hours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Pluses / Adicionales</span>
                  <span className="text-sm font-mono text-emerald-700 font-semibold">+{formatCurrency(selectedRecord.bonusAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Anticipos Solicitados</span>
                  <span className="text-sm font-mono text-red-600 font-semibold">-{formatCurrency(selectedRecord.advancesAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-300 text-[#1E5BB4]">
                  <span className="text-sm font-bold uppercase">Neto a Percibir</span>
                  <span className="text-lg font-bold font-mono">{formatCurrency(selectedRecord.netAmount)}</span>
                </div>
              </div>

              {/* Desglose de Turnos Individuales */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#0B1C30] uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1E5BB4]" />
                  Desglose de Partes Diarios ({selectedRecord.shifts.length})
                </h3>

                {selectedRecord.shifts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">
                    No registra partes diarios trabajados en este rango de fechas.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {selectedRecord.shifts.map((s, idx) => (
                      <div key={s.id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                        <div className="flex justify-between items-center font-bold text-[#0B1C30]">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDisplayDate(s.workDate)}
                          </span>
                          <span className="text-[#0B1C30]">{s.clientName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                          <div>
                            <span className="text-slate-400">Horario:</span> {s.shiftStartTime || '--:--'} a {s.shiftEndTime || '--:--'}
                          </div>
                          <div>
                            <span className="text-slate-400">Puesto:</span> {s.positionName}
                          </div>
                          <div>
                            <span className="text-slate-400">Hs. Norm:</span> {s.regularHours}h
                          </div>
                          <div>
                            <span className="text-slate-400">Extras:</span> {s.overtime50Hours + s.overtime100Hours}h
                          </div>
                          {s.plusDeltaAmount + s.bonusAppliedAmount > 0 && (
                            <div className="text-emerald-700 font-medium">
                              <span className="text-slate-400">Plus:</span> +{formatCurrency(s.plusDeltaAmount + s.bonusAppliedAmount)}
                            </div>
                          )}
                          {s.advanceAmount > 0 && (
                            <div className="text-red-600 font-medium">
                              <span className="text-slate-400">Anticipo:</span> -{formatCurrency(s.advanceAmount)}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-semibold text-slate-800">
                          <span>Subtotal Turno:</span>
                          <span className="font-mono text-[#1E5BB4]">{formatCurrency(s.shiftNetAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

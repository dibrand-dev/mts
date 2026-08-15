'use client';

import React, { useState, useMemo } from 'react';
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
  Download
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

interface PayrollRecord {
  id: string;
  fileNumber: string; // Legajo
  fullName: string;
  position: string;
  contractType: 'Jornal' | 'Quincenal' | 'Mensual';
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  grossAmount: number;
  advancesAmount: number;
  bonusAmount: number;
  netAmount: number;
  shiftsCount: number;
}

const mockPayrollData: PayrollRecord[] = [
  {
    id: '1',
    fileNumber: 'LEG-1042',
    fullName: 'BRITES LUCAS DAVID',
    position: 'Capataz de Operaciones',
    contractType: 'Jornal',
    regularHours: 40,
    overtime50Hours: 12,
    overtime100Hours: 4,
    grossAmount: 385000,
    advancesAmount: 15000,
    bonusAmount: 25000,
    netAmount: 395000,
    shiftsCount: 5,
  },
  {
    id: '2',
    fileNumber: 'LEG-1045',
    fullName: 'FERREIRA MARIANO AGUSTÍN',
    position: 'Apuntador Portuario',
    contractType: 'Jornal',
    regularHours: 40,
    overtime50Hours: 8,
    overtime100Hours: 0,
    grossAmount: 320000,
    advancesAmount: 20000,
    bonusAmount: 18000,
    netAmount: 318000,
    shiftsCount: 5,
  },
  {
    id: '3',
    fileNumber: 'LEG-1051',
    fullName: 'GONZALEZ HÉCTOR RAMÓN',
    position: 'Conductor / Chofer',
    contractType: 'Quincenal',
    regularHours: 48,
    overtime50Hours: 16,
    overtime100Hours: 8,
    grossAmount: 490000,
    advancesAmount: 50000,
    bonusAmount: 35000,
    netAmount: 475000,
    shiftsCount: 6,
  },
  {
    id: '4',
    fileNumber: 'LEG-1058',
    fullName: 'MARTÍNEZ CARLOS ALBERTO',
    position: 'Estibador / Operario',
    contractType: 'Jornal',
    regularHours: 32,
    overtime50Hours: 4,
    overtime100Hours: 0,
    grossAmount: 240000,
    advancesAmount: 0,
    bonusAmount: 12000,
    netAmount: 252000,
    shiftsCount: 4,
  },
  {
    id: '5',
    fileNumber: 'LEG-1064',
    fullName: 'RODRÍGUEZ JUAN PABLO',
    position: 'Guinchero',
    contractType: 'Quincenal',
    regularHours: 40,
    overtime50Hours: 10,
    overtime100Hours: 6,
    grossAmount: 430000,
    advancesAmount: 30000,
    bonusAmount: 28000,
    netAmount: 428000,
    shiftsCount: 5,
  },
];

export default function PayrollPage() {
  const weekDefaults = useMemo(() => getCurrentWeekDates(), []);
  const [startDate, setStartDate] = useState<string>(weekDefaults.start);
  const [endDate, setEndDate] = useState<string>(weekDefaults.end);
  const [activePreset, setActivePreset] = useState<'week' | 'fortnight' | 'month' | 'custom'>('week');

  // Search & Type Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Slideover for employee payroll detail
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    return mockPayrollData.filter((r) => {
      const matchSearch =
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = !typeFilter || r.contractType === typeFilter;

      return matchSearch && matchType;
    });
  }, [searchTerm, typeFilter]);

  // Dynamic totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => ({
        count: acc.count + 1,
        gross: acc.gross + curr.grossAmount,
        advances: acc.advances + curr.advancesAmount,
        net: acc.net + curr.netAmount,
      }),
      { count: 0, gross: 0, advances: 0, net: 0 }
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Cálculo de Sueldos y Jornales</h1>
          <p className="text-slate-500 text-sm mt-1">Auditoría de turnos, conceptos y liquidación de personal operativo</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-[#0B1C30] hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Pre-liquidación</span>
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none px-4 py-2 bg-[#1E5BB4] text-white hover:bg-[#004392] font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Aprobar Período</span>
          </button>
        </div>
      </header>

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

          <div className="text-xs text-sky-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sky-200" />
            <span>
              Liquidación activa:{' '}
              <strong className="text-white font-semibold">{formatDisplayDate(startDate)}</strong> al{' '}
              <strong className="text-white font-semibold">{formatDisplayDate(endDate)}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white border-t-4 border-t-[#1E5BB4] border-x border-b border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Liquidado</span>
            <Users className="h-4 w-4 text-[#1E5BB4]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1C30] mt-2">{totals.count} Legajos</div>
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
          <div className="text-2xl font-bold text-red-600 font-mono mt-2">-{formatCurrency(totals.advances)}</div>
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
            <p className="text-xs text-slate-500 mt-0.5">Desglose de horas trabajadas, recargos y descuentos del período seleccionado</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Mostrando {filteredData.length} registros</span>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron registros de sueldos para este período o filtro.</p>
            <p className="text-xs text-slate-400 mt-1">Prueba ampliando el rango de fechas o modificando el término de búsqueda.</p>
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
                    <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {rec.regularHours}h
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
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Detalle de Liquidación</h2>
                <p className="text-xs text-sky-100 mt-0.5">{selectedRecord.fullName} ({selectedRecord.fileNumber})</p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-4">
              <div className="bg-white text-[#0B1C30] p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Puesto / Función</span>
                  <span className="text-sm font-semibold">{selectedRecord.position}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Régimen</span>
                  <span className="text-sm font-semibold">{selectedRecord.contractType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Turnos Computados</span>
                  <span className="text-sm font-semibold">{selectedRecord.shiftsCount} turnos</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Normales</span>
                  <span className="text-sm font-mono">{selectedRecord.regularHours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Extras 50%</span>
                  <span className="text-sm font-mono text-amber-700 font-semibold">{selectedRecord.overtime50Hours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Horas Extras 100%</span>
                  <span className="text-sm font-mono text-purple-700 font-semibold">{selectedRecord.overtime100Hours} horas</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Plus / Delta Aplicado</span>
                  <span className="text-sm font-mono text-emerald-700 font-semibold">+{formatCurrency(selectedRecord.bonusAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Anticipos Solicitados</span>
                  <span className="text-sm font-mono text-red-600 font-semibold">-{formatCurrency(selectedRecord.advancesAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-200 text-[#1E5BB4]">
                  <span className="text-sm font-bold uppercase">Neto a Percibir</span>
                  <span className="text-lg font-bold font-mono">{formatCurrency(selectedRecord.netAmount)}</span>
                </div>
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

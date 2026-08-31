'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Filter,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Printer,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface ReportRecord {
  id: string;
  date: string;
  module: string;
  detail: string;
  responsible: string;
  status: 'Procesado' | 'Pendiente' | 'Error';
}

const INITIAL_REPORTS: ReportRecord[] = [
  {
    id: '#REP-0091',
    date: '2026-10-12',
    module: 'Carga Diaria de Horas',
    detail: 'Resumen de horas buque Amazonas',
    responsible: 'Carlos Mendoza',
    status: 'Procesado',
  },
  {
    id: '#REP-0092',
    date: '2026-10-12',
    module: 'Ingreso de Caja y Flujo de Caja',
    detail: 'Balance Semanal Locación Norte',
    responsible: 'Ana Ramírez',
    status: 'Pendiente',
  },
  {
    id: '#REP-0093',
    date: '2026-10-11',
    module: 'Personal',
    detail: 'Reporte de asistencias turno noche',
    responsible: 'Luis García',
    status: 'Procesado',
  },
  {
    id: '#REP-0094',
    date: '2026-10-10',
    module: 'Lugares de Trabajo',
    detail: 'Inventario general Depósito Sur',
    responsible: 'Marta Silva',
    status: 'Error',
  },
  {
    id: '#REP-0095',
    date: '2026-10-09',
    module: 'Carga Diaria de Horas',
    detail: 'Consolidado de despachos quincenal',
    responsible: 'Carlos Mendoza',
    status: 'Procesado',
  },
];

export default function ReportsPage() {
  const [reports] = useState<ReportRecord[]>(INITIAL_REPORTS);
  const [selectedModule, setSelectedModule] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Schedule Slideover State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState('Semanal');
  const [scheduleFormat, setScheduleFormat] = useState('Excel (.xlsx)');
  const [scheduleRecipients, setScheduleRecipients] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Detail Slideover State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedModule && selectedModule !== 'Todos los módulos' && r.module !== selectedModule) {
        return false;
      }
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedStatus && selectedStatus !== 'Cualquier Estado' && r.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [reports, selectedModule, fromDate, toDate, selectedStatus]);

  const handleOpenSchedule = () => {
    setScheduleName('');
    setScheduleFreq('Semanal');
    setScheduleFormat('Excel (.xlsx)');
    setScheduleRecipients('');
    setScheduleError(null);
    setIsScheduleOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim()) {
      setScheduleError('Por favor ingresa un nombre para la programación.');
      return;
    }
    if (!scheduleRecipients.trim()) {
      setScheduleError('Por favor ingresa al menos un correo destinatario.');
      return;
    }

    setIsScheduleOpen(false);
    setNotification({
      type: 'success',
      message: `Reporte programado exitosamente con frecuencia ${scheduleFreq}.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenDetail = (record: ReportRecord) => {
    setSelectedReport(record);
    setIsDetailOpen(true);
  };

  const handleExport = () => {
    setNotification({
      type: 'success',
      message: 'Exportando reporte consolidado en formato Excel...',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Centro de Reportes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión y extracción de datos operativos y financieros.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="w-full sm:w-auto px-4 py-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0F2547] font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleOpenSchedule}
            className="w-full sm:w-auto px-4 py-2 bg-[#1E5BB4] text-white rounded-lg font-bold text-sm hover:bg-[#004392] transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Programar Reporte</span>
          </button>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-xs animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Section 1: Search Parameters Card (Sky Blue B2B) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 fill-current" />
          <span>Parámetros de Búsqueda</span>
        </h2>
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold" htmlFor="modulo">Módulo</label>
            <div className="relative">
              <select
                id="modulo"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los módulos</option>
                <option value="Carga Diaria de Horas">Carga Diaria de Horas</option>
                <option value="Ingreso de Caja y Flujo de Caja">Ingreso de Caja y Flujo de Caja</option>
                <option value="Personal">Personal</option>
                <option value="Lugares de Trabajo">Lugares de Trabajo</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold" htmlFor="fecha_desde">Fecha Desde</label>
            <input
              id="fecha_desde"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold" htmlFor="fecha_hasta">Fecha Hasta</label>
            <input
              id="fecha_hasta"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold" htmlFor="estado">Estado</label>
            <div className="relative">
              <select
                id="estado"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Cualquier Estado</option>
                <option value="Procesado">Procesado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Error">Error</option>
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
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                  >
                    <td className="p-3 pl-4 sm:pl-6 font-mono text-xs font-bold text-[#0F2547]">{r.id}</td>
                    <td className="p-3 text-slate-600 text-xs font-mono">
                      {r.date.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 font-medium">{r.module}</td>
                    <td className="p-3 max-w-[220px] truncate" title={r.detail}>
                      {r.detail}
                    </td>
                    <td className="p-3 text-slate-700">{r.responsible}</td>
                    <td className="p-3">
                      {r.status === 'Procesado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" /> Procesado
                        </span>
                      )}
                      {r.status === 'Pendiente' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5" /> Pendiente
                        </span>
                      )}
                      {r.status === 'Error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Error
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 sm:pr-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Slideover 1: Programar Envío */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsScheduleOpen(false)}
          />

          <div className="relative w-screen max-w-md bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Programar Envío</span>
              </h3>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {scheduleError && (
                <div className="p-3 bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Nombre de la Programación</label>
                <input
                  type="text"
                  placeholder="Ej. Resumen Semanal de Carga"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Frecuencia</label>
                <select
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="Diario">Diario</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Formato de Salida</label>
                <select
                  value={scheduleFormat}
                  onChange={(e) => setScheduleFormat(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="Excel (.xlsx)">Excel (.xlsx)</option>
                  <option value="CSV (.csv)">CSV (.csv)</option>
                  <option value="PDF (.pdf)">PDF (.pdf)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">
                  Destinatarios (Separados por coma)
                </label>
                <textarea
                  rows={3}
                  placeholder="gerencia@mtslogistica.com, operaciones@mtslogistica.com"
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4] resize-none"
                />
              </div>

              <div className="pt-6 border-t border-[#0F2547]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#0F2547] bg-white border-2 border-transparent hover:border-[#0F2547] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
                >
                  Guardar Programación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slideover 2: Detalle del Registro */}
      {isDetailOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDetailOpen(false)}
          />

          <div className="relative w-screen max-w-md bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span>Detalle del Registro</span>
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Cards */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
              <div className="bg-white border-2 border-[#0F2547] rounded-xl p-4 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID Registro</p>
                <p className="text-xl font-bold font-mono text-[#0F2547] mt-0.5">{selectedReport.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border-2 border-[#0F2547] rounded-xl p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5 font-mono">
                    {selectedReport.date.split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="bg-white border-2 border-[#0F2547] rounded-xl p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Módulo</p>
                  <p className="text-sm font-semibold text-[#0B1C30] mt-0.5 truncate">{selectedReport.module}</p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0F2547] rounded-xl p-4 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detalle del Registro</p>
                <p className="text-sm font-medium text-[#0B1C30] mt-1">{selectedReport.detail}</p>
              </div>

              <div className="bg-white border-2 border-[#0F2547] rounded-xl p-4 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Usuario Responsable</p>
                <p className="text-sm font-bold text-[#0B1C30] mt-1">{selectedReport.responsible}</p>
              </div>

              <div className="bg-white border-2 border-[#0F2547] rounded-xl p-4 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado Operativo</p>
                <div className="mt-1.5">
                  {selectedReport.status === 'Procesado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                      <CheckCircle className="h-4 w-4" /> Procesado Correctamente
                    </span>
                  )}
                  {selectedReport.status === 'Pendiente' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      <Clock className="h-4 w-4" /> Pendiente de Aprobación
                    </span>
                  )}
                  {selectedReport.status === 'Error' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                      <AlertTriangle className="h-4 w-4" /> Error en Proceso
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slideover Footer */}
            <div className="p-5 sm:p-6 border-t border-[#0F2547]/20 flex items-center justify-end gap-3 bg-[#0EA5E9]">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#0F2547] bg-white border-2 border-transparent hover:border-[#0F2547] transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Comprobante</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



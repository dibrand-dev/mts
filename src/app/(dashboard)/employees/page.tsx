'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  Layers,
  FileCheck2,
  CheckCircle2,
  Eye,
  Building2,
  MapPin,
  Briefcase,
  User,
  Filter,
} from 'lucide-react';
import {
  getEmployees,
  getPositions,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAuditShifts,
  getAllEmployeesHoursSummary,
  EmployeeRow,
  PositionRow,
  EmployeeHoursSummary,
} from '@/lib/services/employees';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<'none' | 'q1' | 'q2' | 'month'>('none');

  // Hours summary by employee (for the active date range)
  const [hoursSummaryMap, setHoursSummaryMap] = useState<
    Record<string, { total_hours: number; regular_hours: number; ot50_hours: number; ot100_hours: number; shifts_count: number }>
  >({});
  const [loadingHoursSummary, setLoadingHoursSummary] = useState(false);

  // Audit Modal State
  const [auditEmployee, setAuditEmployee] = useState<EmployeeRow | null>(null);
  const [auditSummary, setAuditSummary] = useState<EmployeeHoursSummary | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFromDate, setAuditFromDate] = useState('');
  const [auditToDate, setAuditToDate] = useState('');

  // Form & Modal state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    national_id: '',
    full_name: '',
    file_number: '',
    tax_id: '',
    default_position_id: '',
    phone_number: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [empData, posData] = await Promise.all([getEmployees(), getPositions()]);
      setEmployees(empData);
      setPositions(posData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch hours summary for all employees when fromDate or toDate changes
  useEffect(() => {
    if (fromDate || toDate) {
      loadHoursSummary();
    } else {
      setHoursSummaryMap({});
    }
  }, [fromDate, toDate]);

  const loadHoursSummary = async () => {
    try {
      setLoadingHoursSummary(true);
      const summary = await getAllEmployeesHoursSummary(fromDate, toDate);
      setHoursSummaryMap(summary);
    } catch (err: any) {
      console.error('Error loading employees hours summary:', err);
    } finally {
      setLoadingHoursSummary(false);
    }
  };

  // Preset Date range helpers
  const handleSetPreset = (preset: 'q1' | 'q2' | 'month' | 'clear') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    if (preset === 'q1') {
      setActiveDatePreset('q1');
      setFromDate(`${year}-${month}-01`);
      setToDate(`${year}-${month}-15`);
    } else if (preset === 'q2') {
      setActiveDatePreset('q2');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setFromDate(`${year}-${month}-16`);
      setToDate(`${year}-${month}-${lastDay}`);
    } else if (preset === 'month') {
      setActiveDatePreset('month');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setFromDate(`${year}-${month}-01`);
      setToDate(`${year}-${month}-${lastDay}`);
    } else {
      setActiveDatePreset('none');
      setFromDate('');
      setToDate('');
    }
  };

  const handleOpenAudit = async (emp: EmployeeRow) => {
    setAuditEmployee(emp);
    const initialFrom = fromDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const initialTo = toDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`;
    setAuditFromDate(initialFrom);
    setAuditToDate(initialTo);
    await loadAuditDetails(emp.id, initialFrom, initialTo);
  };

  const loadAuditDetails = async (empId: string, from: string, to: string) => {
    try {
      setLoadingAudit(true);
      const summary = await getEmployeeAuditShifts(empId, from, to);
      setAuditSummary(summary);
    } catch (err: any) {
      console.error('Error fetching audit shifts:', err);
      alert(`Error al cargar auditoría: ${err.message}`);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleAuditDateChange = (type: 'from' | 'to', val: string) => {
    if (!auditEmployee) return;
    const newFrom = type === 'from' ? val : auditFromDate;
    const newTo = type === 'to' ? val : auditToDate;
    if (type === 'from') setAuditFromDate(val);
    if (type === 'to') setAuditToDate(val);
    loadAuditDetails(auditEmployee.id, newFrom, newTo);
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      national_id: '',
      full_name: '',
      file_number: '',
      tax_id: '',
      default_position_id: positions[0]?.id || '',
      phone_number: '',
      status: 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeRow) => {
    setEditingEmployee(emp);
    setFormData({
      national_id: emp.national_id || '',
      full_name: emp.full_name || '',
      file_number: emp.file_number || '',
      tax_id: emp.tax_id || '',
      default_position_id: emp.default_position_id || '',
      phone_number: emp.phone_number || '',
      status: emp.status || 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setFormError('El nombre completo es requerido.');
      return;
    }
    if (!formData.national_id.trim()) {
      setFormError('El DNI es requerido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        full_name: formData.full_name.trim(),
        national_id: formData.national_id.trim(),
        file_number: formData.file_number.trim() || null,
        tax_id: formData.tax_id.trim() || null,
        default_position_id: formData.default_position_id || null,
        phone_number: formData.phone_number.trim() || null,
        status: formData.status,
      };

      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, payload);
        setEmployees((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createEmployee(payload);
        setEmployees((prev) => [created, ...prev]);
      }

      setIsSlideoverOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al guardar el empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      setIsDeleting(true);
      await deleteEmployee(deletingEmployee.id);
      setEmployees((prev) => prev.filter((item) => item.id !== deletingEmployee.id));
      setDeletingEmployee(null);
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter (name or national_id or file_number)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        emp.full_name.toLowerCase().includes(query) ||
        emp.national_id.toLowerCase().includes(query) ||
        (emp.file_number && emp.file_number.toLowerCase().includes(query));

      // Position filter
      const matchesPosition = !selectedPositionId || emp.default_position_id === selectedPositionId;

      // Status filter
      const matchesStatus = !selectedStatus || emp.status === selectedStatus;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [employees, searchQuery, selectedPositionId, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Activo
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Vacaciones / Lic.
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Inactivo
          </span>
        );
    }
  };

  const isDateRangeActive = Boolean(fromDate || toDate);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 relative pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Gestión de Personal y Auditoría</h1>
          <p className="text-slate-500 text-sm mt-1">
            Administración de empleados, auditoría de horas quincenales y cotejo de liquidación con operarios.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-[#1E5BB4] text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#004392] transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Empleado</span>
        </button>
      </header>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto underline text-xs font-semibold hover:text-red-900 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Section 1: Filters Card with Date Range (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda y Rango Temporal
          </h2>

          {/* Quick Presets for Quincenal Audit */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-sky-100 font-medium mr-1">Período:</span>
            <button
              type="button"
              onClick={() => handleSetPreset('q1')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                activeDatePreset === 'q1' ? 'bg-amber-300 text-amber-950 shadow-xs' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              1ª Quincena (1-15)
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('q2')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                activeDatePreset === 'q2' ? 'bg-amber-300 text-amber-950 shadow-xs' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              2ª Quincena (16-Fin)
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('month')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                activeDatePreset === 'month' ? 'bg-amber-300 text-amber-950 shadow-xs' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Mes Completo
            </button>
            {isDateRangeActive && (
              <button
                type="button"
                onClick={() => handleSetPreset('clear')}
                className="text-xs px-2 py-1 rounded-full bg-red-500/80 hover:bg-red-600 text-white font-medium transition-colors cursor-pointer"
              >
                Limpiar Fechas
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search">
              Buscar Empleado
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2547]" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, DNI o Legajo..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Position Dropdown */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="puesto">
              Puesto
            </label>
            <div className="relative w-full">
              <select
                id="puesto"
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="estado">
              Estado
            </label>
            <div className="relative w-full">
              <select
                id="estado"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="on_leave">Vacaciones / Lic.</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Fecha Desde */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActiveDatePreset('none');
              }}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActiveDatePreset('none');
              }}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Data Table with Shift Audit Indicator */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1C30]">
              {filteredEmployees.length} empleados listados
            </span>
            {isDateRangeActive && (
              <span className="bg-blue-100 text-[#1E5BB4] px-2.5 py-0.5 rounded-full font-bold">
                📅 Rango activo: {fromDate || 'Inicio'} al {toDate || 'Hoy'}
              </span>
            )}
          </div>
          {loadingHoursSummary && (
            <span className="text-slate-400 animate-pulse">Calculando horas del período...</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
            <p className="text-sm font-medium">Cargando personal...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron empleados</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando los filtros de búsqueda o agrega un nuevo empleado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6 whitespace-nowrap">
                    DNI
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Nombre Completo
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Legajo / CUIL
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Puesto
                  </th>
                  {isDateRangeActive && (
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center bg-blue-50/50 text-[#1E5BB4] whitespace-nowrap">
                      Hs. en Período
                    </th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right pr-6 whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredEmployees.map((emp, index) => {
                  const empSummary = hoursSummaryMap[emp.id];
                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-[#0F2547] font-semibold">
                        {emp.national_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{emp.full_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {emp.file_number ? `Leg: ${emp.file_number}` : '-'}
                        {emp.tax_id ? ` / CUIL: ${emp.tax_id}` : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                        {emp.default_position?.name || 'Sin especificar'}
                      </td>
                      {isDateRangeActive && (
                        <td className="px-4 py-3 text-center whitespace-nowrap bg-blue-50/20">
                          {empSummary && empSummary.total_hours > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-bold text-xs text-[#1E5BB4]">
                                {empSummary.total_hours} hs
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({empSummary.shifts_count} turnos)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {emp.phone_number || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(emp.status)}</td>
                      <td className="px-4 py-3 pr-6 text-right whitespace-nowrap space-x-1">
                        {/* Botón Auditoría de Horas */}
                        <button
                          onClick={() => handleOpenAudit(emp)}
                          className="bg-sky-50 text-[#1E5BB4] hover:bg-[#1E5BB4] hover:text-white p-1.5 rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Auditar turnos y horas registradas para liquidación quincenal"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Auditar Horas</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEmployee(emp)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal / Slide-over: Auditoría de Horas y Turnos por Operario */}
      {auditEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-[#1E5BB4] bg-blue-50 px-2.5 py-1 rounded-md">
                    Auditoría de Horas Operativas
                  </span>
                  <h3 className="text-xl font-bold text-[#0B1C30]">{auditEmployee.full_name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  DNI: <strong className="text-slate-700 font-mono">{auditEmployee.national_id}</strong>
                  {auditEmployee.file_number ? ` | Legajo: ${auditEmployee.file_number}` : ''} | Puesto Habitual:{' '}
                  <span className="font-semibold text-slate-700">
                    {auditEmployee.default_position?.name || 'General'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Imprimir Planilla de Auditoría"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setAuditEmployee(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sub-header: Date range selectors inside audit view */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#1E5BB4]" />
                  Período Quincenal:
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={auditFromDate}
                    onChange={(e) => handleAuditDateChange('from', e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-700 focus:outline-none focus:border-[#1E5BB4]"
                  />
                  <span className="text-slate-400">al</span>
                  <input
                    type="date"
                    value={auditToDate}
                    onChange={(e) => handleAuditDateChange('to', e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-700 focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    setAuditFromDate(`${year}-${month}-01`);
                    setAuditToDate(`${year}-${month}-15`);
                    loadAuditDetails(auditEmployee.id, `${year}-${month}-01`, `${year}-${month}-15`);
                  }}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  1ª Quincena
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
                    setAuditFromDate(`${year}-${month}-16`);
                    setAuditToDate(`${year}-${month}-${lastDay}`);
                    loadAuditDetails(auditEmployee.id, `${year}-${month}-16`, `${year}-${month}-${lastDay}`);
                  }}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  2ª Quincena
                </button>
              </div>
            </div>

            {loadingAudit ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
                <p className="text-sm font-medium">Buscando turnos registrados...</p>
              </div>
            ) : !auditSummary || auditSummary.shifts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">
                  No se registran turnos trabajados en este período.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Verifica que las novedades de este operario hayan sido imputadas en Carga Diaria de Horas.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-100 p-3 rounded-xl">
                    <div className="text-slate-500 text-xs font-semibold uppercase">Turnos</div>
                    <div className="text-lg font-bold font-mono text-[#0B1C30]">
                      {auditSummary.shifts_count}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <div className="text-emerald-700 text-xs font-semibold uppercase">Hs. Normales</div>
                    <div className="text-lg font-bold font-mono text-emerald-800">
                      {auditSummary.regular_hours} hs
                    </div>
                  </div>
                  <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl">
                    <div className="text-sky-700 text-xs font-semibold uppercase">Hs. 50%</div>
                    <div className="text-lg font-bold font-mono text-sky-800">
                      {auditSummary.overtime_50_hours} hs
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <div className="text-amber-700 text-xs font-semibold uppercase">Hs. 100%</div>
                    <div className="text-lg font-bold font-mono text-amber-800">
                      {auditSummary.overtime_100_hours} hs
                    </div>
                  </div>
                  <div className="bg-[#0B1C30] text-white p-3 rounded-xl col-span-2 sm:col-span-1">
                    <div className="text-slate-300 text-xs font-semibold uppercase">Total Horas</div>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {auditSummary.total_hours} hs
                    </div>
                  </div>
                </div>

                {/* Shifts Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#1E5BB4]" />
                    Detalle de Turnos Trabajados (Orden Cronológico)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3 pl-4">Fecha</th>
                          <th className="py-2.5 px-3">Cliente / Servicio</th>
                          <th className="py-2.5 px-3">Lugar / Muelle</th>
                          <th className="py-2.5 px-3 text-center font-mono">Horario</th>
                          <th className="py-2.5 px-3 text-center font-mono text-emerald-700">Norm</th>
                          <th className="py-2.5 px-3 text-center font-mono text-sky-700">50%</th>
                          <th className="py-2.5 px-3 text-center font-mono text-amber-700">100%</th>
                          <th className="py-2.5 px-3 text-center font-mono font-bold text-[#0B1C30]">
                            Total Hs
                          </th>
                          <th className="py-2.5 px-3 pr-4 text-right font-mono">Plus ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {auditSummary.shifts.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 pl-4 font-mono font-bold text-slate-700">
                              {s.work_date}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#0B1C30]">{s.client_name}</td>
                            <td className="py-2.5 px-3 text-slate-500">{s.location_name}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {s.shift_start_time.slice(0, 5)} - {s.shift_end_time.slice(0, 5)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-700">
                              {s.regular_hours}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-sky-700">
                              {s.overtime_50_hours}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-700">
                              {s.overtime_100_hours}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-[#0B1C30] bg-yellow-50/50">
                              {s.total_hours}
                            </td>
                            <td className="py-2.5 px-3 pr-4 text-right font-mono text-slate-600">
                              {s.plus_delta_amount > 0 ? `$ ${s.plus_delta_amount.toLocaleString('es-AR')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-[#0B1C30]">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-3 pl-4 text-right uppercase text-slate-500">
                            Totales Liquidación:
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-emerald-800">
                            {auditSummary.regular_hours} hs
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-sky-800">
                            {auditSummary.overtime_50_hours} hs
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-800">
                            {auditSummary.overtime_100_hours} hs
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono bg-yellow-100 text-[#0B1C30]">
                            {auditSummary.total_hours} hs
                          </td>
                          <td className="py-2.5 px-3 pr-4 text-right font-mono">
                            {auditSummary.plus_amount > 0
                              ? `$ ${auditSummary.plus_amount.toLocaleString('es-AR')}`
                              : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAuditEmployee(null)}
                className="px-5 py-2.5 bg-[#0B1C30] hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over (Alta / Edición de Personal) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 space-y-4">
              {formError && (
                <div className="p-3 bg-red-600/90 text-white rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ej: Carlos Ruiz"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">DNI *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="Ej: 28456789"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Nº Legajo</label>
                  <input
                    type="text"
                    value={formData.file_number}
                    onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                    placeholder="Ej: L-042"
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">CUIL</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="Ej: 20-28456789-8"
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puesto Habitual</label>
                <select
                  value={formData.default_position_id}
                  onChange={(e) => setFormData({ ...formData, default_position_id: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="">Seleccionar Puesto...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Ej: +54 9 11 4567-8900"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="active">Activo</option>
                  <option value="on_leave">Vacaciones / Licencia</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#0B1C30]">¿Eliminar empleado?</h3>
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-[#0B1C30]">{deletingEmployee.full_name}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg cursor-pointer"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

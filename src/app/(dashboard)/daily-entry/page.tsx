'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  User,
  Users,
  Moon,
  Car,
  Utensils,
  DollarSign,
  Calculator,
  RefreshCw,
  Search,
  Filter,
  XCircle,
} from 'lucide-react';
import { getClients, ClientRow } from '@/lib/services/clients';
import { getLocations, LocationRow } from '@/lib/services/locations';
import { getEmployees, EmployeeRow } from '@/lib/services/employees';
import { getPositions, PositionRow } from '@/lib/services/rates';
import {
  getDailyWorkLogs,
  getOrCreateDailyWorkLog,
  addStaffEntryToWorkLog,
  updateStaffEntry,
  deleteStaffEntry,
  calculateShiftHours,
  DailyWorkLogWithEntries,
} from '@/lib/services/daily-entries';

interface FlatDailyStaffEntry {
  id: string;
  daily_work_log_id: string;
  work_date: string;
  client_id: string;
  client_name: string;
  location_id: string | null;
  location_name: string;
  employee_id: string;
  employee_name: string;
  employee_file_number: string | null;
  employee_national_id: string | null;
  position_id: string;
  position_name: string;
  shift_start_date: string;
  shift_start_time: string;
  shift_end_date: string;
  shift_end_time: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  shuttles_count: number;
  meal_allowance_count: number;
  is_day_off: boolean;
  advance_payment_amount: number;
  plus_delta_amount: number;
  bonus_applied_amount: number;
}

export default function DailyEntryPage() {
  // Catalogs
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);

  // Filter Bar State (Optional Filters for the Table)
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterLocationId, setFilterLocationId] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Loaded Work Logs & Flattened Entries State
  const [workLogs, setWorkLogs] = useState<DailyWorkLogWithEntries[]>([]);
  const [, setLoadingCatalogs] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [submittingEntry, setSubmittingEntry] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [slideoverSuccess, setSlideoverSuccess] = useState<string | null>(null);

  // Slideover & Form State
  const [isSlideoverOpen, setIsSlideoverOpen] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Slideover Shift Context (Día, Cliente, Ubicación)
  const [formWorkDate, setFormWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formClientId, setFormClientId] = useState<string>('');
  const [formLocationId, setFormLocationId] = useState<string>('');
  const [formIsHoliday] = useState<boolean>(false);

  // Slideover Operario & Hours State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('06:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [isOvernight, setIsOvernight] = useState<boolean>(false);

  // Automatic vs Manual Hours Calculation
  const [regularHours, setRegularHours] = useState<string>('8');
  const [ot50Hours, setOt50Hours] = useState<string>('0');
  const [ot100Hours, setOt100Hours] = useState<string>('0');
  const [isManualHoursMode, setIsManualHoursMode] = useState<boolean>(false);

  // Concepts & Extras
  const [shuttlesCount, setShuttlesCount] = useState<string>('0');
  const [mealAllowanceCount, setMealAllowanceCount] = useState<string>('0');
  const [isDayOff, setIsDayOff] = useState<boolean>(false);
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState<string>('0');
  const [plusDeltaAmount, setPlusDeltaAmount] = useState<string>('0');

  // Auto-detect overnight shift if endTime < startTime
  useEffect(() => {
    if (endTime && startTime && endTime < startTime) {
      setIsOvernight(true);
    } else {
      setIsOvernight(false);
    }
  }, [startTime, endTime]);

  // Compute calculated end date for the form
  const formShiftEndDate = useMemo(() => {
    if (!isOvernight || !formWorkDate) return formWorkDate;
    const d = new Date(`${formWorkDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [formWorkDate, isOvernight]);

  // Determine day type for the slideover day
  const slideoverDayInfo = useMemo(() => {
    if (!formWorkDate) return { dayName: 'Día Hábil', isSunday: false, isSaturday: false, description: 'Lunes a Viernes (8 hs normales, exceso al 50%)' };
    const d = new Date(`${formWorkDate}T12:00:00`);
    const day = d.getDay();
    if (day === 0) return { dayName: 'Domingo', isSunday: true, isSaturday: false, description: 'Domingo (100% de las horas)' };
    if (day === 6) return { dayName: 'Sábado', isSunday: false, isSaturday: true, description: 'Sábado (Hasta 13:00 normal/50%, post 13:00 al 100%)' };
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return { dayName: names[day], isSunday: false, isSaturday: false, description: `${names[day]} (8 hs normales, exceso al 50%)` };
  }, [formWorkDate]);

  // Automatic real-time calculation of shift hours for the form
  const liveCalculation = useMemo(() => {
    return calculateShiftHours(formWorkDate, startTime, formShiftEndDate, endTime, formIsHoliday);
  }, [formWorkDate, startTime, formShiftEndDate, endTime, formIsHoliday]);

  // Automatically synchronize hours unless user toggles manual mode
  useEffect(() => {
    if (!isManualHoursMode) {
      setRegularHours(liveCalculation.regular_hours.toString());
      setOt50Hours(liveCalculation.overtime_50_hours.toString());
      setOt100Hours(liveCalculation.overtime_100_hours.toString());
    }
  }, [liveCalculation, isManualHoursMode]);

  // Load catalogs on mount
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Whenever filters change, reload work logs from Supabase
  useEffect(() => {
    loadLogs();
  }, [filterDate, filterClientId]);

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const [clientsData, locationsData, employeesData, positionsData] = await Promise.all([
        getClients(),
        getLocations(),
        getEmployees(),
        getPositions(),
      ]);

      setClients(clientsData);
      setLocations(locationsData);
      setEmployees(employeesData);
      setPositions(positionsData);

      if (clientsData.length > 0 && !formClientId) {
        setFormClientId(clientsData[0].id);
      }
      if (locationsData.length > 0 && !formLocationId) {
        setFormLocationId(locationsData[0].id);
      }
      if (positionsData.length > 0 && !selectedPositionId) {
        setSelectedPositionId(positionsData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading catalogs:', err);
      setNotification({ type: 'error', message: err.message || 'Error al cargar catálogos.' });
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await getDailyWorkLogs({
        date: filterDate || undefined,
        clientId: filterClientId || undefined,
      });
      setWorkLogs(logs);
    } catch (err: any) {
      console.error('Error loading daily work logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Flatten all entries from all loaded logs for the table
  const allEntries = useMemo(() => {
    const list: FlatDailyStaffEntry[] = [];
    for (const log of workLogs) {
      if (filterLocationId && log.location_id !== filterLocationId) {
        continue;
      }
      const logLocationName = log.location ? `${log.location.name} ${log.location.code ? `(${log.location.code})` : ''}` : '-';
      const logClientName = log.client?.company_name || 'Cliente';

      for (const entry of log.entries || []) {
        list.push({
          id: entry.id,
          daily_work_log_id: log.id,
          work_date: entry.shift_start_date || log.work_date,
          client_id: log.client_id,
          client_name: logClientName,
          location_id: log.location_id,
          location_name: logLocationName,
          employee_id: entry.employee_id,
          employee_name: entry.employee?.full_name || 'Empleado',
          employee_file_number: entry.employee?.file_number || null,
          employee_national_id: entry.employee?.national_id || null,
          position_id: entry.position_id,
          position_name: entry.position?.name || 'Puesto',
          shift_start_date: entry.shift_start_date || log.work_date,
          shift_start_time: entry.shift_start_time,
          shift_end_date: entry.shift_end_date || log.work_date,
          shift_end_time: entry.shift_end_time,
          regular_hours: Number(entry.regular_hours || 0),
          overtime_50_hours: Number(entry.overtime_50_hours || 0),
          overtime_100_hours: Number(entry.overtime_100_hours || 0),
          shuttles_count: Number(entry.shuttles_count || 0),
          meal_allowance_count: Number(entry.meal_allowance_count || 0),
          is_day_off: Boolean(entry.is_day_off),
          advance_payment_amount: Number(entry.advance_payment_amount || 0),
          plus_delta_amount: Number(entry.plus_delta_amount || 0),
          bonus_applied_amount: Number(entry.bonus_applied_amount || 0),
        });
      }
    }
    return list;
  }, [workLogs, filterLocationId]);

  // Filter entries in table by search term
  const filteredTableEntries = useMemo(() => {
    if (!tableSearch) return allEntries;
    const term = tableSearch.toLowerCase();
    return allEntries.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(term) ||
        (e.employee_file_number && e.employee_file_number.toLowerCase().includes(term)) ||
        (e.employee_national_id && e.employee_national_id.includes(term)) ||
        e.client_name.toLowerCase().includes(term) ||
        e.position_name.toLowerCase().includes(term) ||
        e.location_name.toLowerCase().includes(term)
    );
  }, [allEntries, tableSearch]);

  // Summaries of visible entries in the table
  const totals = useMemo(() => {
    return filteredTableEntries.reduce(
      (acc, curr) => {
        return {
          count: acc.count + 1,
          totalHours: acc.totalHours + curr.regular_hours + curr.overtime_50_hours + curr.overtime_100_hours,
          regularHours: acc.regularHours + curr.regular_hours,
          ot50Hours: acc.ot50Hours + curr.overtime_50_hours,
          ot100Hours: acc.ot100Hours + curr.overtime_100_hours,
          remises: acc.remises + curr.shuttles_count,
          viandas: acc.viandas + curr.meal_allowance_count,
          anticipos: acc.anticipos + curr.advance_payment_amount,
          pluses: acc.pluses + curr.plus_delta_amount,
        };
      },
      { count: 0, totalHours: 0, regularHours: 0, ot50Hours: 0, ot100Hours: 0, remises: 0, viandas: 0, anticipos: 0, pluses: 0 }
    );
  }, [filteredTableEntries]);

  // Open Slideover to Add New Staff Hours
  const handleOpenNewEntry = () => {
    setEditingEntryId(null);
    setFormWorkDate(filterDate || new Date().toISOString().split('T')[0]);
    if (filterClientId) setFormClientId(filterClientId);
    else if (clients.length > 0) setFormClientId(clients[0].id);
    if (filterLocationId) setFormLocationId(filterLocationId);
    else if (locations.length > 0) setFormLocationId(locations[0].id);

    setSelectedEmployeeId('');
    setEmployeeSearchTerm('');
    if (positions.length > 0 && !selectedPositionId) {
      setSelectedPositionId(positions[0].id);
    }
    setPlusDeltaAmount('0');
    setShuttlesCount('0');
    setMealAllowanceCount('0');
    setIsDayOff(false);
    setAdvancePaymentAmount('0');
    setIsManualHoursMode(false);
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp && emp.default_position_id) {
      setSelectedPositionId(emp.default_position_id);
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setIsManualHoursMode(false);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    setIsManualHoursMode(false);
  };

  // Open Slideover in Edit Mode
  const handleEditEntry = (entry: FlatDailyStaffEntry) => {
    setEditingEntryId(entry.id);
    setFormWorkDate(entry.work_date);
    setFormClientId(entry.client_id);
    setFormLocationId(entry.location_id || '');
    setSelectedEmployeeId(entry.employee_id);
    setSelectedPositionId(entry.position_id);
    setStartTime(entry.shift_start_time ? entry.shift_start_time.slice(0, 5) : '06:00');
    setEndTime(entry.shift_end_time ? entry.shift_end_time.slice(0, 5) : '14:00');
    setRegularHours(String(entry.regular_hours || 0));
    setOt50Hours(String(entry.overtime_50_hours || 0));
    setOt100Hours(String(entry.overtime_100_hours || 0));
    setIsManualHoursMode(true);
    setPlusDeltaAmount(String(entry.plus_delta_amount || 0));
    setShuttlesCount(String(entry.shuttles_count || 0));
    setMealAllowanceCount(String(entry.meal_allowance_count || 0));
    setIsDayOff(Boolean(entry.is_day_off));
    setAdvancePaymentAmount(String(entry.advance_payment_amount || 0));
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  // Save Staff Entry
  const handleSaveStaffEntry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formClientId) {
      setFormError('Por favor selecciona un cliente para el turno.');
      return;
    }
    if (!formWorkDate) {
      setFormError('Por favor selecciona la fecha del turno.');
      return;
    }
    if (!selectedEmployeeId) {
      setFormError('Por favor selecciona un operario.');
      return;
    }
    if (!selectedPositionId) {
      setFormError('Por favor selecciona una función / puesto.');
      return;
    }

    try {
      setSubmittingEntry(true);
      setFormError(null);

      // Get or create daily work log for (formWorkDate, formClientId, formLocationId)
      const workLog = await getOrCreateDailyWorkLog(formWorkDate, formClientId, formLocationId || null);

      const reg = parseFloat(regularHours) || 0;
      const ot50 = parseFloat(ot50Hours) || 0;
      const ot100 = parseFloat(ot100Hours) || 0;
      const plus = parseFloat(plusDeltaAmount) || 0;
      const shuttles = parseInt(shuttlesCount, 10) || 0;
      const meals = parseInt(mealAllowanceCount, 10) || 0;
      const advance = parseFloat(advancePaymentAmount) || 0;

      const payload = {
        employee_id: selectedEmployeeId,
        position_id: selectedPositionId,
        shift_start_date: formWorkDate,
        shift_start_time: startTime,
        shift_end_date: formShiftEndDate,
        shift_end_time: endTime,
        regular_hours: reg,
        overtime_50_hours: ot50,
        overtime_100_hours: ot100,
        plus_delta_amount: plus,
        shuttles_count: shuttles,
        meal_allowance_count: meals,
        advance_payment_amount: advance,
        is_day_off: isDayOff,
        bonus_applied_amount: 0,
      };

      if (editingEntryId) {
        await updateStaffEntry(editingEntryId, payload);
        const successMsg = 'Registro de personal actualizado correctamente.';
        setNotification({
          type: 'success',
          message: successMsg,
        });
        setSlideoverSuccess(successMsg);
        setEditingEntryId(null);
        setSelectedEmployeeId('');
        setEmployeeSearchTerm('');
        setPlusDeltaAmount('0');
        setShuttlesCount('0');
        setMealAllowanceCount('0');
        setIsDayOff(false);
        setAdvancePaymentAmount('0');
        setIsManualHoursMode(false);
      } else {
        await addStaffEntryToWorkLog(workLog.id, payload);
        const empObj = employees.find((e) => e.id === selectedEmployeeId);
        const empName = empObj ? empObj.full_name : 'Personal';
        const successMsg = `¡Horas cargadas exitosamente para ${empName}! Puedes continuar cargando otro personal.`;
        setNotification({
          type: 'success',
          message: `Horas cargadas exitosamente para ${empName}.`,
        });
        setSlideoverSuccess(successMsg);

        // Reset employee fields & keep slideover open for next employee
        setSelectedEmployeeId('');
        setEmployeeSearchTerm('');
        setPlusDeltaAmount('0');
        setShuttlesCount('0');
        setMealAllowanceCount('0');
        setIsDayOff(false);
        setAdvancePaymentAmount('0');
        setIsManualHoursMode(false);
      }

      await loadLogs();
    } catch (err: any) {
      console.error('Error saving staff entry:', err);
      setFormError(`Error al guardar: ${err.message}`);
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('¿Deseas eliminar este registro de personal del turno?')) return;
    try {
      await deleteStaffEntry(entryId);
      setNotification({ type: 'success', message: 'Registro eliminado correctamente.' });
      await loadLogs();
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setNotification({ type: 'error', message: `Error al eliminar: ${err.message}` });
    }
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterClientId('');
    setFilterLocationId('');
    setTableSearch('');
  };

  // Filtered employees for slideover search
  const filteredEmployeesForSelect = useMemo(() => {
    if (!employeeSearchTerm) return employees;
    const term = employeeSearchTerm.toLowerCase();
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(term) ||
        (e.file_number && e.file_number.toLowerCase().includes(term)) ||
        (e.national_id && e.national_id.includes(term))
    );
  }, [employees, employeeSearchTerm]);

  const hasActiveFilters = Boolean(filterDate || filterClientId || filterLocationId || tableSearch);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Carga Diaria de Horas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registro, control y liquidación operativa de turnos y jornales de personal.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenNewEntry}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Cargar Horas</span>
          </button>
        </div>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xs border animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Section 1: Filter Bar (Optional Filters for the View) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-[#1E5BB4] rounded-lg">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0B1C30]">Filtros de Visualización</h2>
              <p className="text-xs text-slate-500">Filtra la planilla por fecha, cliente o locación (o visualiza todos los registros)</p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Fecha */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#1E5BB4]" />
              Fecha (Día)
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Mostrar todas las fechas"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-[#1E5BB4]" />
              Cliente
            </label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="w-full p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all"
            >
              <option value="">Todos los Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Lugar de Trabajo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#1E5BB4]" />
              Lugar / Muelle
            </label>
            <select
              value={filterLocationId}
              onChange={(e) => setFilterLocationId(e.target.value)}
              className="w-full p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all"
            >
              <option value="">Todas las Ubicaciones</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.code ? `(${l.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda de Personal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-[#1E5BB4]" />
              Búsqueda Rápida
            </label>
            <input
              type="text"
              placeholder="Buscar operario, legajo..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* KPI Summary Badges for Visible Rows */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs border-t border-slate-100">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Resumen:</span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold">
            👥 {totals.count} Registros
          </span>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-bold">
            ⏱️ {totals.regularHours.toFixed(1)} hs Norm.
          </span>
          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-md font-bold">
            ⚡ {totals.ot50Hours.toFixed(1)} hs 50%
          </span>
          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md font-bold">
            🔥 {totals.ot100Hours.toFixed(1)} hs 100%
          </span>
          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md font-bold">
            🚗 {totals.remises} Remises
          </span>
          <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-1 rounded-md font-bold">
            🥪 {totals.viandas} Viandas
          </span>
          {totals.anticipos > 0 && (
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-bold font-mono">
              Anticipos: $ {totals.anticipos.toLocaleString('es-AR')}
            </span>
          )}
          {totals.pluses > 0 && (
            <span className="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md font-bold font-mono">
              Pluses: $ {totals.pluses.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </section>

      {/* Section 2: Shift Staff Entries List (Table Section) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B1C30] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1E5BB4]" />
              <span>Planilla de Novedades de Horas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filterDate ? `Mostrando turnos del día ${filterDate}` : 'Mostrando todo el historial de turnos'}
              {filterClientId ? ` • ${clients.find((c) => c.id === filterClientId)?.company_name}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewEntry}
            className="px-4 py-2 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cargar Horas</span>
          </button>
        </div>

        {loadingLogs ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-7 w-7 text-[#1E5BB4] animate-spin" />
            <p className="text-sm font-medium">Cargando registros de horas...</p>
          </div>
        ) : filteredTableEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-sky-50 text-[#1E5BB4] rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">No se encontraron registros de horas</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasActiveFilters
                  ? 'Prueba modificando o limpiando los filtros para ver otros días o clientes.'
                  : 'Comienza cargando las horas y novedades del personal operativo.'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Ver Todo el Historial
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenNewEntry}
                className="px-5 py-2 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Cargar Horas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3 pl-4">Fecha</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Legajo / Operario</th>
                  <th className="p-3">Puesto</th>
                  <th className="p-3 text-center">Horario</th>
                  <th className="p-3 text-center bg-slate-50 text-emerald-800">Hs. Norm</th>
                  <th className="p-3 text-center bg-slate-50 text-sky-800">Hs. 50%</th>
                  <th className="p-3 text-center bg-slate-50 text-amber-800">Hs. 100%</th>
                  <th className="p-3 text-center">Remises</th>
                  <th className="p-3 text-center">Viandas</th>
                  <th className="p-3 text-center">Franco</th>
                  <th className="p-3 text-right">Anticipo</th>
                  <th className="p-3 text-right">Plus Delta</th>
                  <th className="p-3 pr-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredTableEntries.map((entry) => {
                  const isCrossDate =
                    entry.shift_start_date &&
                    entry.shift_end_date &&
                    entry.shift_start_date !== entry.shift_end_date;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="p-3 pl-4 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        {entry.work_date}
                      </td>
                      <td className="p-3 font-semibold text-[#0B1C30] text-xs">
                        <div>{entry.client_name}</div>
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {entry.location_name}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#0B1C30]">
                        <div>{entry.employee_name}</div>
                        <span className="text-[11px] font-mono text-slate-400 block font-normal">
                          {entry.employee_file_number ? `Leg. ${entry.employee_file_number}` : ''}
                          {entry.employee_national_id ? ` (DNI ${entry.employee_national_id})` : ''}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs font-medium">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {entry.position_name}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                        <span>{entry.shift_start_time ? entry.shift_start_time.slice(0, 5) : '-'}</span>
                        <span className="text-slate-400 mx-1">a</span>
                        <span>{entry.shift_end_time ? entry.shift_end_time.slice(0, 5) : '-'}</span>
                        {isCrossDate && (
                          <span className="text-[10px] text-amber-600 font-bold ml-1" title="Finaliza al día siguiente">
                            (+1)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold bg-slate-50/50 text-emerald-700">
                        {entry.regular_hours.toFixed(1)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold bg-slate-50/50 text-sky-700">
                        {entry.overtime_50_hours > 0 ? (
                          entry.overtime_50_hours.toFixed(1)
                        ) : (
                          <span className="text-slate-300 font-normal">0.0</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold bg-slate-50/50 text-amber-700">
                        {entry.overtime_100_hours > 0 ? (
                          entry.overtime_100_hours.toFixed(1)
                        ) : (
                          <span className="text-slate-300 font-normal">0.0</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-xs">
                        {entry.shuttles_count > 0 ? (
                          <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                            {entry.shuttles_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-xs">
                        {entry.meal_allowance_count > 0 ? (
                          <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                            {entry.meal_allowance_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-xs">
                        {entry.is_day_off ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Sí
                          </span>
                        ) : (
                          <span className="text-slate-300">No</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-slate-700">
                        {entry.advance_payment_amount > 0 ? `$ ${entry.advance_payment_amount.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-slate-700">
                        {entry.plus_delta_amount > 0 ? `$ ${entry.plus_delta_amount.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-1.5 text-slate-400 hover:text-[#1E5BB4] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar operario"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-[#0B1C30]">
                <tr>
                  <td colSpan={5} className="p-3.5 pl-4 text-right uppercase tracking-wider text-slate-600">
                    Totales Planilla:
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-emerald-800 bg-slate-200/60">
                    {totals.regularHours.toFixed(1)} hs
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-sky-800 bg-slate-200/60">
                    {totals.ot50Hours.toFixed(1)} hs
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-amber-800 bg-slate-200/60">
                    {totals.ot100Hours.toFixed(1)} hs
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-purple-800">
                    {totals.remises}
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-amber-900">
                    {totals.viandas}
                  </td>
                  <td className="p-3.5 text-center text-slate-400">-</td>
                  <td className="p-3.5 text-right font-mono text-sm text-slate-900">
                    $ {totals.anticipos.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-sm text-slate-900">
                    $ {totals.pluses.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3.5 pr-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Slideover (Drawer Lateral de Carga / Edición de Personal) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => !submittingEntry && setIsSlideoverOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-screen max-w-lg bg-white shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Slideover Header */}
            <div className="bg-[#0B1C30] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#0F2547]">
              <div>
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-sky-400" />
                  <span>{editingEntryId ? 'Editar Personal en el Turno' : 'Ingresar Personal al Turno'}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  📅 {formWorkDate} • {clients.find((c) => c.id === formClientId)?.company_name || 'Cliente'}
                </p>
              </div>
              <button
                onClick={() => !submittingEntry && setIsSlideoverOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Slideover Body */}
            <form onSubmit={handleSaveStaffEntry} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Group 0: Parámetros del Turno (Día, Cliente, Ubicación) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#1E5BB4]" />
                    Turno y Cliente
                  </h4>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {slideoverDayInfo.dayName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#1E5BB4]" />
                      Día / Fecha del Turno *
                    </label>
                    <input
                      type="date"
                      value={formWorkDate}
                      onChange={(e) => {
                        setFormWorkDate(e.target.value);
                        setIsManualHoursMode(false);
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-[#1E5BB4]" />
                      Cliente *
                    </label>
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs"
                      required
                    >
                      <option value="">Seleccionar Cliente...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#1E5BB4]" />
                    Lugar de Trabajo / Muelle
                  </label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs"
                  >
                    <option value="">Seleccionar Ubicación...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.code ? `(${l.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group 1: Empleado & Puesto */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#1E5BB4]" />
                  Datos del Operario
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Empleado *</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs font-medium"
                    required
                  >
                    <option value="">Seleccionar Empleado...</option>
                    {filteredEmployeesForSelect.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.file_number ? `[Leg. ${emp.file_number}] ` : ''}
                        {emp.full_name} {emp.national_id ? `(DNI: ${emp.national_id})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Función / Puesto *</label>
                  <select
                    value={selectedPositionId}
                    onChange={(e) => setSelectedPositionId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs font-medium"
                    required
                  >
                    <option value="">Seleccionar Función...</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group 2: Horarios del Turno */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#1E5BB4]" />
                    Horario Trabajado
                  </h4>
                  {isOvernight && (
                    <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Moon className="h-3 w-3" /> Turno Noche (+1 día)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Hora Inicio (Desde)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Hora Fin (Hasta)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:border-transparent transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Auto-Calculation Card */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#004392] uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-[#1E5BB4]" />
                    Liquidación Automática de Horas
                  </h4>
                  {isManualHoursMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualHoursMode(false);
                        setRegularHours(liveCalculation.regular_hours.toString());
                        setOt50Hours(liveCalculation.overtime_50_hours.toString());
                        setOt100Hours(liveCalculation.overtime_100_hours.toString());
                      }}
                      className="text-[11px] bg-white hover:bg-sky-100 text-[#1E5BB4] border border-sky-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="Volver a cálculo automático"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Auto-calcular
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Calculado según convenio ({slideoverDayInfo.dayName}) entre {startTime} y {endTime}:
                </p>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase">Hs. Normales</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={regularHours}
                      onChange={(e) => {
                        setRegularHours(e.target.value);
                        setIsManualHoursMode(true);
                      }}
                      className="w-full text-center font-bold text-base text-emerald-700 bg-transparent focus:outline-none focus:bg-emerald-50 rounded"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase">Hs. 50%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={ot50Hours}
                      onChange={(e) => {
                        setOt50Hours(e.target.value);
                        setIsManualHoursMode(true);
                      }}
                      className="w-full text-center font-bold text-base text-sky-700 bg-transparent focus:outline-none focus:bg-sky-50 rounded"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase">Hs. 100%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={ot100Hours}
                      onChange={(e) => {
                        setOt100Hours(e.target.value);
                        setIsManualHoursMode(true);
                      }}
                      className="w-full text-center font-bold text-base text-amber-700 bg-transparent focus:outline-none focus:bg-amber-50 rounded"
                    />
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  Total hs turno:{' '}
                  <span className="font-bold text-[#0B1C30]">
                    {(parseFloat(regularHours || '0') + parseFloat(ot50Hours || '0') + parseFloat(ot100Hours || '0')).toFixed(1)} hs
                  </span>
                </div>
              </div>

              {/* Group 4: Conceptos Operativos y Adicionales */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-[#1E5BB4]" />
                  Conceptos y Adicionales
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-purple-600" />
                      Remises
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={shuttlesCount}
                      onChange={(e) => setShuttlesCount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Utensils className="h-3.5 w-3.5 text-amber-600" />
                      Viandas
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={mealAllowanceCount}
                      onChange={(e) => setMealAllowanceCount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Anticipo ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={advancePaymentAmount}
                      onChange={(e) => setAdvancePaymentAmount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Plus Delta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={plusDeltaAmount}
                      onChange={(e) => setPlusDeltaAmount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
                    />
                  </div>
                </div>

                {/* Franco switch / checkbox */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={isDayOff}
                      onChange={(e) => setIsDayOff(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#1E5BB4] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800 block">Día de Franco Trabajado</span>
                      <span className="text-[11px] text-slate-500">Marca si el operario cumplió guardia en día libre</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEntry}
                  className="px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submittingEntry ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : editingEntryId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>
                    {submittingEntry
                      ? 'Guardando...'
                      : editingEntryId
                      ? 'Guardar Cambios'
                      : 'Guardar Horas'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

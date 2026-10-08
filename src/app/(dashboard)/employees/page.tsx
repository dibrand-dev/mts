'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Layers,
  Briefcase,
  Filter,
  Eye,
  Download,
  DollarSign,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from '@tanstack/react-table';
import { queryKeys } from '@/lib/queries/queryKeys';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import {
  getEmployees,
  getPositions,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAuditShifts,
  getAllEmployeesHoursSummary,
  EmployeeRow,
  EmployeeHoursSummary,
} from '@/lib/services/employees';
import {
  exportLiquidationFlatCSV,
  LiquidationFlatRecord,
} from '@/lib/services/payroll';


export default function EmployeesPage() {
  const queryClient = useQueryClient();

  const {
    data: mainData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: async () => {
      const [empData, posData] = await Promise.all([getEmployees(), getPositions()]);
      return { employees: empData, positions: posData };
    },
  });

  const employees = mainData?.employees || [];
  const positions = mainData?.positions || [];

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<'none' | 'q1' | 'q2' | 'month'>('none');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, selectedPositionId, selectedStatus, fromDate, toDate]);

  // Hours summary by employee (for the active date range)
  const { data: hoursSummaryMap = {}, isLoading: loadingHoursSummary } = useQuery({
    queryKey: queryKeys.employees.withHours(fromDate, toDate),
    queryFn: () => getAllEmployeesHoursSummary(fromDate, toDate),
    enabled: Boolean(fromDate && toDate),
  });

  // Audit Modal State
  const [auditEmployee, setAuditEmployee] = useState<EmployeeRow | null>(null);
  const [auditSummary, setAuditSummary] = useState<EmployeeHoursSummary | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFromDate, setAuditFromDate] = useState('');
  const [auditToDate, setAuditToDate] = useState('');

  // Form & Modal state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRow | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    national_id: '',
    full_name: '',
    file_number: '',
    tax_id: '',
    default_position_id: '',
    phone_number: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    hourly_rate_regular: '',
    hourly_rate_overtime_50: '',
    hourly_rate_overtime_100: '',
    salary_effective_from: '',
  });
  const [salaryAutoCalc, setSalaryAutoCalc] = useState(true);

  // Quick Employee Salary Modal State
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [activeEmployeeForSalary, setActiveEmployeeForSalary] = useState<EmployeeRow | null>(null);
  const [quickSalaryRegular, setQuickSalaryRegular] = useState('');
  const [quickSalaryOt50, setQuickSalaryOt50] = useState('');
  const [quickSalaryOt100, setQuickSalaryOt100] = useState('');
  const [quickSalaryEffectiveFrom, setQuickSalaryEffectiveFrom] = useState('');
  const [quickSalaryAutoCalc, setQuickSalaryAutoCalc] = useState(true);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      setIsSlideoverOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al guardar el empleado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      setIsSlideoverOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al guardar el empleado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      setDeletingEmployee(null);
    },
    onError: (err: any) => {
      alert(`Error al eliminar: ${err.message}`);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

    const initialFrom = fromDate || `${year}-${month}-01`;
    const initialTo = toDate || `${year}-${month}-${lastDay}`;
    setAuditFromDate(initialFrom);
    setAuditToDate(initialTo);
    await loadAuditDetails(emp.id, initialFrom, initialTo);
  };

  const handleAuditPreset = (preset: 'q1' | 'q2' | 'month') => {
    if (!auditEmployee) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    let newFrom = '';
    let newTo = '';

    if (preset === 'q1') {
      newFrom = `${year}-${month}-01`;
      newTo = `${year}-${month}-15`;
    } else if (preset === 'q2') {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      newFrom = `${year}-${month}-16`;
      newTo = `${year}-${month}-${lastDay}`;
    } else if (preset === 'month') {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      newFrom = `${year}-${month}-01`;
      newTo = `${year}-${month}-${lastDay}`;
    }

    setAuditFromDate(newFrom);
    setAuditToDate(newTo);
    loadAuditDetails(auditEmployee.id, newFrom, newTo);
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

  const handleExportLiquidation = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

      const activeFrom = fromDate || `${year}-${month}-01`;
      const activeTo = toDate || `${year}-${month}-${lastDay}`;

      // Ensure hours summary is available
      let summary = hoursSummaryMap;
      if (!isDateRangeActive || Object.keys(summary).length === 0) {
        summary = await getAllEmployeesHoursSummary(activeFrom, activeTo);
      }

      const flatRecords: LiquidationFlatRecord[] = filteredEmployees.map((emp) => {
        const empSummary = summary[emp.id] || {
          regular_hours: 0,
          ot50_hours: 0,
          ot100_hours: 0,
          plus_amount: 0,
          total_hours: 0,
          shifts_count: 0,
        };

        return {
          employeeName: emp.full_name,
          regularHours: empSummary.regular_hours,
          overtime50Hours: empSummary.ot50_hours,
          overtime100Hours: empSummary.ot100_hours,
          vehicleBonus: empSummary.plus_amount,
        };
      });

      exportLiquidationFlatCSV(flatRecords, `${activeFrom}_al_${activeTo}`);
    } catch (err: any) {
      console.error('Error al exportar liquidación:', err);
      alert(`Error al exportar liquidación: ${err.message}`);
    }
  };


  const handleOpenCreate = () => {
    setEditingEmployee(null);
    const firstPos = positions[0];
    const isEnc = firstPos?.name?.toLowerCase().includes('encargado');
    const defaultReg = isEnc ? '10777.06' : '8983.68';
    const defaultOt50 = isEnc ? '16165.60' : '13475.53';
    const defaultOt100 = isEnc ? '21554.13' : '17967.37';

    setFormData({
      national_id: '',
      full_name: '',
      file_number: '',
      tax_id: '',
      default_position_id: firstPos?.id || '',
      phone_number: '',
      status: 'active',
      hourly_rate_regular: firstPos?.hourly_rate_regular ? String(firstPos.hourly_rate_regular) : defaultReg,
      hourly_rate_overtime_50: firstPos?.hourly_rate_overtime_50 ? String(firstPos.hourly_rate_overtime_50) : defaultOt50,
      hourly_rate_overtime_100: firstPos?.hourly_rate_overtime_100 ? String(firstPos.hourly_rate_overtime_100) : defaultOt100,
      salary_effective_from: new Date().toISOString().split('T')[0],
    });
    setSalaryAutoCalc(true);
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeRow) => {
    setEditingEmployee(emp);
    const isEnc = emp.default_position?.name?.toLowerCase().includes('encargado');
    const defaultReg = isEnc ? '10777.06' : '8983.68';
    const defaultOt50 = isEnc ? '16165.60' : '13475.53';
    const defaultOt100 = isEnc ? '21554.13' : '17967.37';

    setFormData({
      national_id: emp.national_id || '',
      full_name: emp.full_name || '',
      file_number: emp.file_number || '',
      tax_id: emp.tax_id || '',
      default_position_id: emp.default_position_id || '',
      phone_number: emp.phone_number || '',
      status: emp.status || 'active',
      hourly_rate_regular: emp.hourly_rate_regular ? String(emp.hourly_rate_regular) : defaultReg,
      hourly_rate_overtime_50: emp.hourly_rate_overtime_50 ? String(emp.hourly_rate_overtime_50) : defaultOt50,
      hourly_rate_overtime_100: emp.hourly_rate_overtime_100 ? String(emp.hourly_rate_overtime_100) : defaultOt100,
      salary_effective_from: emp.salary_effective_from || new Date().toISOString().split('T')[0],
    });
    setSalaryAutoCalc(true);
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handlePositionSelectChange = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    const isEnc = pos?.name?.toLowerCase().includes('encargado');
    const defaultReg = isEnc ? '10777.06' : '8983.68';
    const defaultOt50 = isEnc ? '16165.60' : '13475.53';
    const defaultOt100 = isEnc ? '21554.13' : '17967.37';

    setFormData((prev) => ({
      ...prev,
      default_position_id: posId,
      hourly_rate_regular: pos?.hourly_rate_regular ? String(pos.hourly_rate_regular) : defaultReg,
      hourly_rate_overtime_50: pos?.hourly_rate_overtime_50 ? String(pos.hourly_rate_overtime_50) : defaultOt50,
      hourly_rate_overtime_100: pos?.hourly_rate_overtime_100 ? String(pos.hourly_rate_overtime_100) : defaultOt100,
    }));
  };

  const handleRegularSalaryChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && salaryAutoCalc) {
      setFormData((prev) => ({
        ...prev,
        hourly_rate_regular: val,
        hourly_rate_overtime_50: (Math.round(num * 1.5 * 100) / 100).toFixed(2),
        hourly_rate_overtime_100: (Math.round(num * 2.0 * 100) / 100).toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        hourly_rate_regular: val,
      }));
    }
  };

  const handleOpenQuickSalaryModal = (emp: EmployeeRow) => {
    setActiveEmployeeForSalary(emp);
    const isEnc = emp.default_position?.name?.toLowerCase().includes('encargado');
    const defaultReg = isEnc ? 10777.06 : 8983.68;
    const defaultOt50 = isEnc ? 16165.60 : 13475.53;
    const defaultOt100 = isEnc ? 21554.13 : 17967.37;

    const reg = emp.hourly_rate_regular || defaultReg;
    const ot50 = emp.hourly_rate_overtime_50 || defaultOt50;
    const ot100 = emp.hourly_rate_overtime_100 || defaultOt100;

    setQuickSalaryRegular(String(reg));
    setQuickSalaryOt50(String(ot50));
    setQuickSalaryOt100(String(ot100));
    setQuickSalaryEffectiveFrom(emp.salary_effective_from || new Date().toISOString().split('T')[0]);
    setQuickSalaryAutoCalc(true);
    setIsSalaryModalOpen(true);
  };

  const handleQuickRegularSalaryChange = (val: string) => {
    setQuickSalaryRegular(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && quickSalaryAutoCalc) {
      setQuickSalaryOt50((Math.round(num * 1.5 * 100) / 100).toFixed(2));
      setQuickSalaryOt100((Math.round(num * 2.0 * 100) / 100).toFixed(2));
    }
  };

  const handleSaveQuickSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployeeForSalary) return;

    const regNum = parseFloat(quickSalaryRegular);
    const ot50Num = parseFloat(quickSalaryOt50);
    const ot100Num = parseFloat(quickSalaryOt100);

    if (isNaN(regNum) || regNum < 0) {
      alert('El valor de la hora normal de sueldo debe ser válido.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: activeEmployeeForSalary.id,
        payload: {
          hourly_rate_regular: regNum,
          hourly_rate_overtime_50: !isNaN(ot50Num) ? ot50Num : Math.round(regNum * 1.5 * 100) / 100,
          hourly_rate_overtime_100: !isNaN(ot100Num) ? ot100Num : Math.round(regNum * 2.0 * 100) / 100,
          salary_effective_from: quickSalaryEffectiveFrom || new Date().toISOString().split('T')[0],
        },
      });
      setIsSalaryModalOpen(false);
      setActiveEmployeeForSalary(null);
    } catch (err: any) {
      alert(`Error al actualizar el sueldo del colaborador: ${err.message}`);
    }
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

    setFormError(null);

    const reg = parseFloat(formData.hourly_rate_regular) || 8983.68;
    const ot50 = parseFloat(formData.hourly_rate_overtime_50) || Math.round(reg * 1.5 * 100) / 100;
    const ot100 = parseFloat(formData.hourly_rate_overtime_100) || Math.round(reg * 2.0 * 100) / 100;

    const payload = {
      full_name: formData.full_name.trim(),
      national_id: formData.national_id.trim(),
      file_number: formData.file_number.trim() || null,
      tax_id: formData.tax_id.trim() || null,
      default_position_id: formData.default_position_id || null,
      phone_number: formData.phone_number.trim() || null,
      status: formData.status,
      hourly_rate_regular: reg,
      hourly_rate_overtime_50: ot50,
      hourly_rate_overtime_100: ot100,
      salary_effective_from: formData.salary_effective_from || new Date().toISOString().split('T')[0],
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingEmployee) return;
    deleteMutation.mutate(deletingEmployee.id);
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

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(() => {
    const cols: ColumnDef<EmployeeRow>[] = [
      {
        accessorKey: 'national_id',
        header: 'DNI',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-[#0F2547] font-semibold">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Nombre Completo',
        cell: ({ getValue }) => <span className="font-semibold">{getValue<string>()}</span>,
      },
      {
        id: 'file_tax',
        header: 'Legajo / CUIL',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 font-mono">
            {row.original.file_number ? `Leg: ${row.original.file_number}` : '-'}
            {row.original.tax_id ? ` / CUIL: ${row.original.tax_id}` : ''}
          </span>
        ),
      },
      {
        id: 'position',
        header: 'Puesto Habitual',
        cell: ({ row }) => {
          const pos = row.original.default_position;
          if (!pos?.name) {
            return <span className="text-xs text-slate-400 italic">Sin puesto asignado</span>;
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#004392] border border-blue-200 w-fit">
              <Briefcase className="h-3 w-3 text-[#1E5BB4]" />
              {pos.name}
            </span>
          );
        },
      },
      {
        id: 'employee_salary',
        header: 'Valores de Sueldo del Trabajador',
        cell: ({ row }) => {
          const emp = row.original;
          const isEnc = emp.default_position?.name?.toLowerCase().includes('encargado');
          const defaultReg = isEnc ? 10777.06 : 8983.68;
          const defaultOt50 = isEnc ? 16165.60 : 13475.53;
          const defaultOt100 = isEnc ? 21554.13 : 17967.37;

          const reg = Number(emp.hourly_rate_regular) || defaultReg;
          const ot50 = Number(emp.hourly_rate_overtime_50) || defaultOt50;
          const ot100 = Number(emp.hourly_rate_overtime_100) || defaultOt100;

          return (
            <div className="flex flex-col gap-1 min-w-[210px]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#0B1C30]">
                  Normal: ${reg.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  data-testid="employees-btn-edit-salary"
                  onClick={() => handleOpenQuickSalaryModal(emp)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Editar valor hora de sueldo para este empleado"
                >
                  <DollarSign className="h-3 w-3 text-emerald-700" />
                  <span>Editar Sueldo</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>50%: ${ot50.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                <span>•</span>
                <span>100%: ${ot100.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        },
      },
    ];

    if (isDateRangeActive) {
      cols.push({
        id: 'periodHours',
        header: () => (
          <span className="text-center block text-[#1E5BB4]">Hs. en Período</span>
        ),
        cell: ({ row }) => {
          const empSummary = hoursSummaryMap[row.original.id];
          return (
            <div className="text-center">
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
            </div>
          );
        },
      });
    }

    cols.push(
      {
        accessorKey: 'phone_number',
        header: 'Teléfono',
        cell: ({ getValue }) => (
          <span className="text-slate-500 font-mono text-xs">
            {getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ getValue }) => getStatusBadge(getValue<string>()),
      },
      {
        id: 'actions',
        header: () => <span className="text-right block pr-2">Acciones</span>,
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="text-right space-x-1 whitespace-nowrap pr-2">
              <button
                data-testid="employees-btn-auditar-horas"
                onClick={() => handleOpenAudit(emp)}
                className="text-[#1E5BB4] hover:text-[#004392] p-1.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center"
                title="Auditar Horas (Vista Rápida)"
                aria-label="Auditar Horas"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                data-testid="employees-btn-edit"
                onClick={() => handleOpenEdit(emp)}
                className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                data-testid="employees-btn-delete"
                onClick={() => setDeletingEmployee(emp)}
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      }
    );

    return cols;
  }, [isDateRangeActive, hoursSummaryMap]);

  const table = useReactTable({
    data: filteredEmployees,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="employees-btn-export-payroll"
            onClick={handleExportLiquidation}
            disabled={filteredEmployees.length === 0}
            className="bg-white hover:bg-slate-50 text-[#0F2547] border border-slate-300 font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-[#1E5BB4]" />
            <span>Exportar Liquidación</span>
          </button>
          <Link
            href="/positions"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Briefcase className="h-4 w-4 text-[#1E5BB4]" />
            <span>Puestos y Valores de Sueldo</span>
          </Link>
          <button
            type="button"
            data-testid="employees-btn-nuevo-empleado"
            onClick={handleOpenCreate}
            className="bg-[#1E5BB4] text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#004392] transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </header>


      {/* Error alert */}
      {queryError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{(queryError as any).message}</span>
          <button
            onClick={() => refetch()}
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
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider first:pl-6 last:pr-6 whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-slate-50/50' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 first:pl-6 last:pr-6 whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination table={table} />
          </>
        )}
      </section>

      {/* Slide-over: Vista de Auditoría Rápida de Horas y Turnos por Operario */}
      {auditEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setAuditEmployee(null)}
          />
          <div
            data-testid="employees-slideover-audit"
            className="relative w-screen max-w-2xl bg-white text-[#0B1C30] shadow-2xl z-50 flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="p-6 bg-[#0F2547] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-sky-300">
                  Vista de Auditoría Rápida (Slideover)
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{auditEmployee.full_name}</h3>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                  <span>DNI: <strong className="text-white font-mono">{auditEmployee.national_id}</strong></span>
                  {auditEmployee.file_number && (
                    <span>| Legajo: <strong className="text-white font-mono">{auditEmployee.file_number}</strong></span>
                  )}
                  {auditEmployee.default_position?.name && (
                    <span>| Puesto: <span className="text-sky-200 font-semibold">{auditEmployee.default_position.name}</span></span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Imprimir Planilla"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAuditEmployee(null)}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cerrar panel"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex-1 space-y-6">
              {/* Date Filter Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <Calendar className="h-4 w-4 text-[#1E5BB4]" />
                    <span>Período Auditado:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAuditPreset('q1')}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      1ª Quincena
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuditPreset('q2')}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      2ª Quincena
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuditPreset('month')}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      Mes Completo
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={auditFromDate}
                    onChange={(e) => handleAuditDateChange('from', e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-md font-mono text-slate-700 focus:outline-none focus:border-[#1E5BB4]"
                  />
                  <span className="text-slate-400 font-medium">al</span>
                  <input
                    type="date"
                    value={auditToDate}
                    onChange={(e) => handleAuditDateChange('to', e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-md font-mono text-slate-700 focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              {loadingAudit ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
                  <p className="text-sm font-medium">Cargando turnos e historial del operario...</p>
                </div>
              ) : !auditSummary || auditSummary.shifts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    No se registran turnos trabajados en este período.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Verifica que las novedades de este operario hayan sido imputadas en Carga Diaria.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Acumulados (DoD: Horas Normales, 50%, 100% y Plus) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#1E5BB4]" />
                      Acumulado de Horas y Plus
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                        <div className="text-emerald-700 text-xs font-bold uppercase">Hs. Normales</div>
                        <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                          {auditSummary.regular_hours} hs
                        </div>
                      </div>
                      <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-center">
                        <div className="text-sky-700 text-xs font-bold uppercase">Hs. Extras 50%</div>
                        <div className="text-xl font-bold font-mono text-sky-900 mt-1">
                          {auditSummary.overtime_50_hours} hs
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                        <div className="text-amber-700 text-xs font-bold uppercase">Hs. Extras 100%</div>
                        <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                          {auditSummary.overtime_100_hours} hs
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
                        <div className="text-purple-700 text-xs font-bold uppercase">Plus</div>
                        <div className="text-xl font-bold font-mono text-purple-900 mt-1">
                          {auditSummary.plus_amount > 0
                            ? `$ ${auditSummary.plus_amount.toLocaleString('es-AR')}`
                            : '$ 0'}
                        </div>
                      </div>
                    </div>
                    {/* Summary row for total hours and shifts count */}
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">
                        Total Turnos: <strong className="text-[#0B1C30]">{auditSummary.shifts_count}</strong>
                      </span>
                      <span className="text-slate-600 font-medium">
                        Total Horas: <strong className="text-[#1E5BB4] font-mono text-sm">{auditSummary.total_hours} hs</strong>
                      </span>
                    </div>
                  </div>

                  {/* Historial de Turnos */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-[#1E5BB4]" />
                      Historial de Turnos ({auditSummary.shifts.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-600">
                            <tr>
                              <th className="py-2.5 px-3 pl-3">Fecha</th>
                              <th className="py-2.5 px-3">Cliente / Muelle</th>
                              <th className="py-2.5 px-2 text-center font-mono">Horario</th>
                              <th className="py-2.5 px-2 text-center font-mono text-emerald-700">Norm</th>
                              <th className="py-2.5 px-2 text-center font-mono text-sky-700">50%</th>
                              <th className="py-2.5 px-2 text-center font-mono text-amber-700">100%</th>
                              <th className="py-2.5 px-2 text-center font-mono font-bold text-[#0B1C30]">Total</th>
                              <th className="py-2.5 px-3 pr-3 text-right font-mono text-purple-700">Plus ($)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {auditSummary.shifts.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 pl-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                                  {s.work_date}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-[#0B1C30]">{s.client_name}</div>
                                  <div className="text-[11px] text-slate-400">{s.location_name}</div>
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-slate-600 whitespace-nowrap">
                                  {s.shift_start_time.slice(0, 5)} - {s.shift_end_time.slice(0, 5)}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-700">
                                  {s.regular_hours}h
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-semibold text-sky-700">
                                  {s.overtime_50_hours > 0 ? `${s.overtime_50_hours}h` : '-'}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-700">
                                  {s.overtime_100_hours > 0 ? `${s.overtime_100_hours}h` : '-'}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0B1C30] bg-yellow-50/50">
                                  {s.total_hours}h
                                </td>
                                <td className="py-2.5 px-3 pr-3 text-right font-mono text-purple-700 whitespace-nowrap">
                                  {s.plus_delta_amount > 0 ? `$ ${s.plus_delta_amount.toLocaleString('es-AR')}` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-[#0B1C30]">
                            <tr>
                              <td colSpan={3} className="py-2.5 px-3 pl-3 text-right uppercase text-slate-500">
                                Totales:
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-emerald-800">
                                {auditSummary.regular_hours}h
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-sky-800">
                                {auditSummary.overtime_50_hours}h
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-amber-800">
                                {auditSummary.overtime_100_hours}h
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono bg-yellow-100 text-[#0B1C30]">
                                {auditSummary.total_hours}h
                              </td>
                              <td className="py-2.5 px-3 pr-3 text-right font-mono text-purple-900 whitespace-nowrap">
                                {auditSummary.plus_amount > 0
                                  ? `$ ${auditSummary.plus_amount.toLocaleString('es-AR')}`
                                  : '$ 0'}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Slideover Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setAuditEmployee(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
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
                  data-testid="employees-input-fullname"
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
                  data-testid="employees-input-dni"
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
                    data-testid="employees-input-file-number"
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
                    data-testid="employees-input-tax-id"
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
                  data-testid="employees-select-position"
                  onChange={(e) => handlePositionSelectChange(e.target.value)}
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

              {/* Valores de Sueldo Asignados al Trabajador */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-400/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span>Valores de Sueldo (Asignación Directa)</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-emerald-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={salaryAutoCalc}
                      onChange={(e) => setSalaryAutoCalc(e.target.checked)}
                      className="h-3 w-3 text-emerald-500 rounded"
                    />
                    <span>Auto 1.5x / 2.0x</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-white block mb-1">Hora Normal ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate_regular}
                      onChange={(e) => handleRegularSalaryChange(e.target.value)}
                      placeholder="Ej: 8983.68"
                      className="w-full p-2 bg-white rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-white block mb-1">Extra 50% ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate_overtime_50}
                      onChange={(e) => setFormData({ ...formData, hourly_rate_overtime_50: e.target.value })}
                      placeholder="Ej: 13475.53"
                      className="w-full p-2 bg-white rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-white block mb-1">Extra 100% ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate_overtime_100}
                      onChange={(e) => setFormData({ ...formData, hourly_rate_overtime_100: e.target.value })}
                      placeholder="Ej: 17967.37"
                      className="w-full p-2 bg-white rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Teléfono de Contacto</label>
                <input
                  type="text"
                  data-testid="employees-input-phone"
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
                  data-testid="employees-select-status"
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
                  data-testid="employees-btn-guardar"
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

      {/* Quick Salary Modal for Employee */}
      {isSalaryModalOpen && activeEmployeeForSalary && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1C30]">
                    Valores de Sueldo: {activeEmployeeForSalary.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asignación directa de básicos de bolsillo por hora para este colaborador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickSalary} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">
                  Cálculo automático de extras:
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickSalaryAutoCalc}
                    onChange={(e) => setQuickSalaryAutoCalc(e.target.checked)}
                    className="h-3.5 w-3.5 text-emerald-600 rounded"
                  />
                  <span>50% = x1.5, 100% = x2.0</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Hora Normal ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickSalaryRegular}
                    onChange={(e) => handleQuickRegularSalaryChange(e.target.value)}
                    placeholder="Ej: 10777.06"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Hora Extra 50% ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickSalaryOt50}
                    onChange={(e) => setQuickSalaryOt50(e.target.value)}
                    placeholder="Ej: 16165.60"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Hora Extra 100% ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickSalaryOt100}
                    onChange={(e) => setQuickSalaryOt100(e.target.value)}
                    placeholder="Ej: 21554.13"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Fecha de Vigencia
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={quickSalaryEffectiveFrom}
                    onChange={(e) => setQuickSalaryEffectiveFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800">
                ℹ️ Estos importes quedan asignados directamente a <b>{activeEmployeeForSalary.full_name}</b> y se usarán para todas sus jornadas en <b>Cálculo de Sueldos</b>.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Guardar Sueldo de Colaborador</span>
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

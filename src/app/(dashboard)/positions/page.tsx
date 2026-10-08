'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  DollarSign,
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
  ExternalLink,
  ShieldAlert,
  Car
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  getPositionsWithDetails,
  createPosition,
  updatePosition,
  updatePositionSalaryRates,
  deletePosition,
  getAllEmployeesForPositionAssignment,
  bulkAssignEmployeesToPosition,
  assignPositionClientRate,
  removePositionClientRate,
  PositionWithDetails,
} from '@/lib/services/positions';
import { getClients } from '@/lib/services/rates';

export default function PositionsPage() {
  const queryClient = useQueryClient();

  const {
    data: positionsData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.positions.withDetails,
    queryFn: async () => {
      const [posData, empData, clientsData] = await Promise.all([
        getPositionsWithDetails(),
        getAllEmployeesForPositionAssignment(),
        getClients(),
      ]);
      return {
        positions: posData,
        allEmployees: empData,
        clients: clientsData,
      };
    },
  });

  const positions = positionsData?.positions || [];
  const allEmployees = positionsData?.allEmployees || [];
  const clients = positionsData?.clients || [];

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleBonusFilter, setVehicleBonusFilter] = useState(''); // '' | 'yes' | 'no'
  const [staffFilter, setStaffFilter] = useState(''); // '' | 'with_staff' | 'without_staff'

  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, vehicleBonusFilter, staffFilter]);

  // Position Create/Edit Slide-over State
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithDetails | null>(null);
  const [posName, setPosName] = useState('');
  const [posRequiresVehicleBonus, setPosRequiresVehicleBonus] = useState(false);

  // Personnel Assignment Modal State
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [activePositionForStaff, setActivePositionForStaff] = useState<PositionWithDetails | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [initialStaffIds, setInitialStaffIds] = useState<string[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [savingStaff, setSavingStaff] = useState(false);

  // Client Rates Modal State
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [activePositionForRates, setActivePositionForRates] = useState<PositionWithDetails | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [deletingRate, setDeletingRate] = useState(false);

  // Rate Form fields inside the modal
  const [rateClientId, setRateClientId] = useState('');
  const [rateEffectiveFrom, setRateEffectiveFrom] = useState('');
  const [rateRegular, setRateRegular] = useState<string>('');
  const [rateOvertime50, setRateOvertime50] = useState<string>('');
  const [rateOvertime100, setRateOvertime100] = useState<string>('');
  const [rateAutoCalc, setRateAutoCalc] = useState(true);

  // Salary Rates Modal State (Valores de Sueldo del Personal)
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [activePositionForSalary, setActivePositionForSalary] = useState<PositionWithDetails | null>(null);
  const [salaryRegular, setSalaryRegular] = useState<string>('');
  const [salaryOvertime50, setSalaryOvertime50] = useState<string>('');
  const [salaryOvertime100, setSalaryOvertime100] = useState<string>('');
  const [salaryEffectiveFrom, setSalaryEffectiveFrom] = useState<string>('');
  const [salaryAutoCalc, setSalaryAutoCalc] = useState(true);
  const [savingSalary, setSavingSalary] = useState(false);

  // Form fields inside slideover for position salary rates
  const [posRegularRate, setPosRegularRate] = useState<string>('');
  const [posOt50Rate, setPosOt50Rate] = useState<string>('');
  const [posOt100Rate, setPosOt100Rate] = useState<string>('');
  const [posSalaryEffectiveFrom, setPosSalaryEffectiveFrom] = useState<string>('');
  const [posSalaryAutoCalc, setPosSalaryAutoCalc] = useState(true);

  // Delete Position Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<PositionWithDetails | null>(null);

  const fetchData = async () => {
    await refetch();
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ----------------------------------------------------
  // Salary Modal Handlers
  // ----------------------------------------------------
  const handleOpenSalaryModal = (pos: PositionWithDetails) => {
    setError(null);
    setActivePositionForSalary(pos);
    const isEnc = pos.name.toLowerCase().includes('encargado');
    const defaultReg = isEnc ? 10777.06 : 8983.68;
    const defaultOt50 = isEnc ? 16165.60 : 13475.53;
    const defaultOt100 = isEnc ? 21554.13 : 17967.37;

    const reg = pos.hourly_rate_regular || defaultReg;
    const ot50 = pos.hourly_rate_overtime_50 || defaultOt50;
    const ot100 = pos.hourly_rate_overtime_100 || defaultOt100;

    setSalaryRegular(String(reg));
    setSalaryOvertime50(String(ot50));
    setSalaryOvertime100(String(ot100));
    setSalaryEffectiveFrom(pos.salary_effective_from || new Date().toISOString().split('T')[0]);
    setSalaryAutoCalc(true);
    setIsSalaryModalOpen(true);
  };

  const handleSalaryRegularChange = (val: string) => {
    setSalaryRegular(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && salaryAutoCalc) {
      setSalaryOvertime50((Math.round(num * 1.5 * 100) / 100).toFixed(2));
      setSalaryOvertime100((Math.round(num * 2.0 * 100) / 100).toFixed(2));
    }
  };

  const handlePosRegularChange = (val: string) => {
    setPosRegularRate(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && posSalaryAutoCalc) {
      setPosOt50Rate((Math.round(num * 1.5 * 100) / 100).toFixed(2));
      setPosOt100Rate((Math.round(num * 2.0 * 100) / 100).toFixed(2));
    }
  };

  const handleSaveSalaryRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePositionForSalary) return;

    const regNum = parseFloat(salaryRegular);
    const ot50Num = parseFloat(salaryOvertime50);
    const ot100Num = parseFloat(salaryOvertime100);

    if (isNaN(regNum) || regNum < 0) {
      setError('El valor de la hora normal de sueldo debe ser válido.');
      return;
    }

    try {
      setSavingSalary(true);
      setError(null);
      await updatePositionSalaryRates(activePositionForSalary.id, {
        hourly_rate_regular: regNum,
        hourly_rate_overtime_50: !isNaN(ot50Num) ? ot50Num : Math.round(regNum * 1.5 * 100) / 100,
        hourly_rate_overtime_100: !isNaN(ot100Num) ? ot100Num : Math.round(regNum * 2.0 * 100) / 100,
        salary_effective_from: salaryEffectiveFrom || new Date().toISOString().split('T')[0],
      });
      showNotification(`Valores de sueldo actualizados para "${activePositionForSalary.name}".`);
      setIsSalaryModalOpen(false);
      setActivePositionForSalary(null);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving salary rates:', err);
      setError(err.message || 'Error al actualizar los valores de sueldo.');
    } finally {
      setSavingSalary(false);
    }
  };

  // ----------------------------------------------------
  // CRUD Slideover Handlers
  // ----------------------------------------------------
  const handleOpenSlideover = (pos?: PositionWithDetails) => {
    setError(null);
    if (pos) {
      setEditingPosition(pos);
      setPosName(pos.name);
      setPosRequiresVehicleBonus(pos.requires_vehicle_bonus);

      const isEnc = pos.name.toLowerCase().includes('encargado');
      const defaultReg = isEnc ? 10777.06 : 8983.68;
      const defaultOt50 = isEnc ? 16165.60 : 13475.53;
      const defaultOt100 = isEnc ? 21554.13 : 17967.37;

      setPosRegularRate(String(pos.hourly_rate_regular || defaultReg));
      setPosOt50Rate(String(pos.hourly_rate_overtime_50 || defaultOt50));
      setPosOt100Rate(String(pos.hourly_rate_overtime_100 || defaultOt100));
      setPosSalaryEffectiveFrom(pos.salary_effective_from || new Date().toISOString().split('T')[0]);
      setPosSalaryAutoCalc(true);
    } else {
      setEditingPosition(null);
      setPosName('');
      setPosRequiresVehicleBonus(false);
      setPosRegularRate('8983.68');
      setPosOt50Rate('13475.53');
      setPosOt100Rate('17967.37');
      setPosSalaryEffectiveFrom(new Date().toISOString().split('T')[0]);
      setPosSalaryAutoCalc(true);
    }
    setIsSlideoverOpen(true);
  };

  const handleCloseSlideover = () => {
    setIsSlideoverOpen(false);
    setEditingPosition(null);
    setPosName('');
    setPosRequiresVehicleBonus(false);
    setPosRegularRate('');
    setPosOt50Rate('');
    setPosOt100Rate('');
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posName.trim()) {
      setError('El nombre del puesto de trabajo es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const reg = parseFloat(posRegularRate) || 8983.68;
      const ot50 = parseFloat(posOt50Rate) || Math.round(reg * 1.5 * 100) / 100;
      const ot100 = parseFloat(posOt100Rate) || Math.round(reg * 2.0 * 100) / 100;

      if (editingPosition) {
        await updatePosition(editingPosition.id, {
          name: posName.trim(),
          requires_vehicle_bonus: posRequiresVehicleBonus,
          hourly_rate_regular: reg,
          hourly_rate_overtime_50: ot50,
          hourly_rate_overtime_100: ot100,
          salary_effective_from: posSalaryEffectiveFrom || new Date().toISOString().split('T')[0],
        });
        showNotification(`Puesto "${posName.trim()}" actualizado correctamente.`);
      } else {
        await createPosition({
          name: posName.trim(),
          requires_vehicle_bonus: posRequiresVehicleBonus,
          hourly_rate_regular: reg,
          hourly_rate_overtime_50: ot50,
          hourly_rate_overtime_100: ot100,
          salary_effective_from: posSalaryEffectiveFrom || new Date().toISOString().split('T')[0],
        });
        showNotification(`Puesto "${posName.trim()}" creado correctamente.`);
      }

      handleCloseSlideover();
      await fetchData();
    } catch (err: any) {
      console.error('Error saving position:', err);
      setError(err.message || 'Error al guardar el puesto de trabajo.');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // Delete Modal Handlers
  // ----------------------------------------------------
  const handleOpenDeleteModal = (pos: PositionWithDetails) => {
    setPositionToDelete(pos);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await deletePosition(positionToDelete.id);
      setIsDeleteModalOpen(false);
      setPositionToDelete(null);
      showNotification('Puesto de trabajo eliminado exitosamente.');
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting position:', err);
      setError(err.message || 'Error al eliminar el puesto.');
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // ----------------------------------------------------
  // Personnel Assignment Handlers
  // ----------------------------------------------------
  const handleOpenAssignStaff = (pos: PositionWithDetails) => {
    setActivePositionForStaff(pos);
    const assignedIds = pos.assigned_employees.map((e) => e.id);
    setSelectedStaffIds(assignedIds);
    setInitialStaffIds(assignedIds);
    setStaffSearchQuery('');
    setIsAssignStaffModalOpen(true);
  };

  const handleToggleStaff = (empId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveStaffAssignments = async () => {
    if (!activePositionForStaff) return;

    try {
      setSavingStaff(true);
      setError(null);
      await bulkAssignEmployeesToPosition(
        activePositionForStaff.id,
        selectedStaffIds,
        initialStaffIds
      );
      showNotification(`Personal asignado correctamente a "${activePositionForStaff.name}".`);
      setIsAssignStaffModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving staff assignments:', err);
      setError(err.message || 'Error al asignar el personal al puesto.');
    } finally {
      setSavingStaff(false);
    }
  };

  // ----------------------------------------------------
  // Client Commercial Rates Modal Handlers
  // ----------------------------------------------------
  const handleOpenRatesModal = (pos: PositionWithDetails) => {
    setActivePositionForRates(pos);
    const today = new Date().toISOString().split('T')[0];
    setRateClientId(clients[0]?.id || '');
    setRateEffectiveFrom(today);
    setRateRegular('');
    setRateOvertime50('');
    setRateOvertime100('');
    setRateAutoCalc(true);
    setIsRatesModalOpen(true);
  };

  const handleRegularRateChange = (val: string) => {
    setRateRegular(val);
    if (rateAutoCalc) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        setRateOvertime50((num * 1.5).toFixed(2));
        setRateOvertime100((num * 2.0).toFixed(2));
      } else {
        setRateOvertime50('');
        setRateOvertime100('');
      }
    }
  };

  const handleSaveClientRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePositionForRates) return;
    if (!rateClientId) {
      setError('Debes seleccionar un cliente.');
      return;
    }
    if (!rateEffectiveFrom) {
      setError('Debes indicar la fecha de vigencia.');
      return;
    }
    const regNum = parseFloat(rateRegular);
    const ot50Num = parseFloat(rateOvertime50);
    const ot100Num = parseFloat(rateOvertime100);

    if (isNaN(regNum) || regNum < 0) {
      setError('La tarifa normal debe ser un número válido mayor o igual a cero.');
      return;
    }
    if (isNaN(ot50Num) || ot50Num < 0) {
      setError('La tarifa 50% debe ser un número válido.');
      return;
    }
    if (isNaN(ot100Num) || ot100Num < 0) {
      setError('La tarifa 100% debe ser un número válido.');
      return;
    }

    try {
      setSavingRate(true);
      setError(null);
      await assignPositionClientRate({
        client_id: rateClientId,
        position_id: activePositionForRates.id,
        effective_from: rateEffectiveFrom,
        rate_regular: regNum,
        rate_overtime_50: ot50Num,
        rate_overtime_100: ot100Num,
      });

      showNotification('Tarifa comercial asignada exitosamente al cliente.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.positions.withDetails });
      const refreshedPositions = await getPositionsWithDetails();
      const updatedActive = refreshedPositions.find((p) => p.id === activePositionForRates.id);
      if (updatedActive) {
        setActivePositionForRates(updatedActive);
      }

      // Reset form fields
      setRateRegular('');
      setRateOvertime50('');
      setRateOvertime100('');
    } catch (err: any) {
      console.error('Error saving client rate:', err);
      setError(err.message || 'Error al guardar la tarifa comercial.');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteClientRate = async (clientId: string, effectiveFrom: string) => {
    if (!activePositionForRates) return;
    try {
      setDeletingRate(true);
      setError(null);
      await removePositionClientRate(clientId, activePositionForRates.id, effectiveFrom);
      showNotification('Tarifa comercial eliminada.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.positions.withDetails });
      const refreshedPositions = await getPositionsWithDetails();
      const updatedActive = refreshedPositions.find((p) => p.id === activePositionForRates.id);
      if (updatedActive) {
        setActivePositionForRates(updatedActive);
      }
    } catch (err: any) {
      console.error('Error deleting client rate:', err);
      setError(err.message || 'Error al eliminar la tarifa.');
    } finally {
      setDeletingRate(false);
    }
  };

  // ----------------------------------------------------
  // Filtered Positions List
  // ----------------------------------------------------
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBonus =
        !vehicleBonusFilter ||
        (vehicleBonusFilter === 'yes' && p.requires_vehicle_bonus) ||
        (vehicleBonusFilter === 'no' && !p.requires_vehicle_bonus);

      const matchStaff =
        !staffFilter ||
        (staffFilter === 'with_staff' && p.employees_count > 0) ||
        (staffFilter === 'without_staff' && p.employees_count === 0);

      return matchSearch && matchBonus && matchStaff;
    });
  }, [positions, searchTerm, vehicleBonusFilter, staffFilter]);

  const columns = useMemo<ColumnDef<PositionWithDetails>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Puesto Operativo',
        cell: ({ row }) => {
          const pos = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#1E5BB4] rounded-lg shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="font-bold text-[#0B1C30] text-sm">
                {pos.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'requires_vehicle_bonus',
        header: 'Bonificación Vehicular',
        cell: ({ row }) => {
          const pos = row.original;
          return (
            <div>
              {pos.requires_vehicle_bonus ? (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                  title="Aplica escala salarial de bonificación vehicular por jornada según convenio CCT"
                >
                  <Car className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Plus Vehicular CCT</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <span>Tarifa Plana</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'assigned_staff',
        header: 'Personal Asignado',
        cell: ({ row }) => {
          const pos = row.original;
          const hasAssignedStaff = pos.employees_count > 0;
          return (
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  hasAssignedStaff
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {pos.employees_count} {pos.employees_count === 1 ? 'colaborador' : 'colaboradores'}
              </span>

              <button
                type="button"
                data-testid="positions-btn-assign-staff"
                onClick={() => handleOpenAssignStaff(pos)}
                className="bg-white hover:bg-slate-50 text-[#1E5BB4] hover:text-[#004392] border border-slate-300 font-semibold text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Ver Personal</span>
              </button>
            </div>
          );
        },
      },
      {
        id: 'salary_rates',
        header: 'Valores de Sueldo (Personal)',
        cell: ({ row }) => {
          const pos = row.original;
          const reg = Number(pos.hourly_rate_regular) || 0;
          const ot50 = Number(pos.hourly_rate_overtime_50) || 0;
          const ot100 = Number(pos.hourly_rate_overtime_100) || 0;

          return (
            <div className="flex flex-col gap-1 min-w-[210px]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#0B1C30]">
                  Normal: ${reg.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  data-testid="positions-btn-edit-salary"
                  onClick={() => handleOpenSalaryModal(pos)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Actualizar valores hora de sueldo para este puesto"
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
      {
        id: 'client_rates',
        header: 'Facturación Clientes (Tarifario)',
        cell: ({ row }) => {
          const pos = row.original;
          const hasRates = pos.rates_count > 0;
          return (
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  hasRates
                    ? 'bg-sky-100 text-[#004392] border border-sky-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {pos.rates_count} {pos.rates_count === 1 ? 'cliente con tarifa' : 'clientes con tarifa'}
              </span>

              <button
                type="button"
                data-testid="positions-btn-view-rates"
                onClick={() => handleOpenRatesModal(pos)}
                className="bg-white hover:bg-slate-50 text-[#1E5BB4] hover:text-[#004392] border border-slate-300 font-semibold text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Ver Tarifario</span>
              </button>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Acciones</span>,
        cell: ({ row }) => {
          const pos = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                data-testid="positions-btn-edit"
                onClick={() => handleOpenSlideover(pos)}
                className="p-1.5 text-slate-500 hover:text-[#1E5BB4] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Editar puesto"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                data-testid="positions-btn-delete"
                onClick={() => handleOpenDeleteModal(pos)}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                title="Eliminar puesto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredPositions,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Filtered employees for the assignment modal
  const filteredEmployeesForAssignment = useMemo(() => {
    if (!staffSearchQuery.trim()) return allEmployees;
    const q = staffSearchQuery.toLowerCase();
    return allEmployees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.national_id.toLowerCase().includes(q) ||
        (e.file_number && e.file_number.toLowerCase().includes(q))
    );
  }, [allEmployees, staffSearchQuery]);

  // Global KPIs
  const totalPositionsCount = positions.length;
  const totalAssignedStaffCount = positions.reduce((acc, p) => acc + p.employees_count, 0);
  const vehicleBonusPositionsCount = positions.filter((p) => p.requires_vehicle_bonus).length;
  const positionsWithRatesCount = positions.filter((p) => p.rates_count > 0).length;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 relative pb-12">
      {/* Top Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && !isSlideoverOpen && !isAssignStaffModalOpen && !isRatesModalOpen && !isDeleteModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">
              Gestión de Puestos de Trabajo
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Operaciones & Tarifario
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Administración de cargos operativos, asignación del personal y vinculación al tarifario comercial por cliente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/rates"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <DollarSign className="h-4 w-4 text-[#1E5BB4]" />
            <span>Tarifario Comercial</span>
          </Link>
          <button
            onClick={() => handleOpenSlideover()}
            data-testid="positions-btn-nuevo-puesto"
            className="bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Puesto</span>
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Puestos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Puestos Totales</p>
            <p className="text-2xl font-bold text-[#0B1C30] mt-1">{totalPositionsCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cargos registrados</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#1E5BB4] rounded-lg">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Personal Asignado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Personal Asignado</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAssignedStaffCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Colaboradores vinculados</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Bonificación Vehicular */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Plus Vehicular (CCT)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{vehicleBonusPositionsCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Aplica escala de vehículos</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Cobertura en Tarifario */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Tarifas Activas</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{positionsWithRatesCount} / {totalPositionsCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Puestos con precio en clientes</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Banner explicativo: Separación Sueldos vs Tarifario Comercial */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-sm text-emerald-900">
              Valores Oficiales de Sueldo del Personal Precargados (MTS)
            </p>
            <p className="text-emerald-800 mt-0.5">
              Los básicos para el cálculo de sueldos de <b>Encargado ($10.777,06)</b> y <b>Apuntador ($8.983,68)</b> están asignados al puesto y desacoplados de la facturación comercial a clientes.
            </p>
          </div>
        </div>
        <Link
          href="/payroll"
          className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
        >
          <span>Ir a Cálculo de Sueldos</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Section: Filters (Celeste B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center">
        {/* Input Search */}
        <div className="w-full lg:w-1/3 flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search-pos">
            Buscar Puesto
          </label>
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-pos"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Encargado, Apuntador, Conductor..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>
        </div>

        {/* Dropdown Vehicle Bonus */}
        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="bonus-filter">
            Plus Vehicular
          </label>
          <div className="relative w-full">
            <select
              id="bonus-filter"
              value={vehicleBonusFilter}
              onChange={(e) => setVehicleBonusFilter(e.target.value)}
              className="w-full bg-white border border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todos los Puestos</option>
              <option value="yes">Requiere Plus Vehicular</option>
              <option value="no">Tarifa Plana (Sin Plus)</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
          </div>
        </div>

        {/* Dropdown Staff Filter */}
        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="staff-filter">
            Asignación de Personal
          </label>
          <div className="relative w-full">
            <select
              id="staff-filter"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-white border border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todos</option>
              <option value="with_staff">Con Personal Asignado</option>
              <option value="without_staff">Sin Personal Asignado</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full lg:w-auto lg:ml-auto">
          <button
            onClick={() => handleOpenSlideover()}
            className="w-full lg:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Puesto</span>
          </button>
        </div>
      </section>

      {/* Section: Positions Table (White Card) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium">Cargando puestos de trabajo y relaciones...</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Briefcase className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-[#0B1C30]">No se encontraron puestos de trabajo</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              {searchTerm || vehicleBonusFilter || staffFilter
                ? 'No hay puestos que coincidan con los filtros aplicados.'
                : 'Crea tu primer puesto de trabajo para comenzar a asignar personal y configurar tarifas.'}
            </p>
            <button
              onClick={() => handleOpenSlideover()}
              className="mt-4 bg-[#1E5BB4] hover:bg-[#004392] text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Nuevo Puesto</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider"
                    >
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="py-3.5 px-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-4 px-4 align-top">
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

      {/* ======================================================== */}
      {/* SLIDE-OVER: CREAR / EDITAR PUESTO                         */}
      {/* ======================================================== */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={handleCloseSlideover}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 bg-[#0F2547] text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {editingPosition ? 'Editar Puesto de Trabajo' : 'Nuevo Puesto de Trabajo'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {editingPosition
                      ? 'Modifica las propiedades del rol operativo'
                      : 'Define un nuevo puesto operativo para el personal y tarifas'}
                  </p>
                </div>
                <button
                  onClick={handleCloseSlideover}
                  className="p-1 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSavePosition} className="flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="p-6 space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Nombre del Puesto */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1C30] mb-1.5" htmlFor="pos-name">
                      Nombre del Puesto <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pos-name"
                      type="text"
                      required
                      data-testid="positions-input-name"
                      value={posName}
                      onChange={(e) => setPosName(e.target.value)}
                      placeholder="Ej: Encargado, Apuntador, Chofer, Capataz"
                      className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Identificador único del rol para carga diaria, recibos y facturación.
                    </p>
                  </div>

                  {/* Bonificación por Vehículos (Plus Vehicular) */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="vehicle-bonus"
                        type="checkbox"
                        data-testid="positions-checkbox-vehicle-bonus"
                        checked={posRequiresVehicleBonus}
                        onChange={(e) => setPosRequiresVehicleBonus(e.target.checked)}
                        className="h-4 w-4 mt-0.5 text-[#1E5BB4] border-[#0F2547] rounded focus:ring-[#1E5BB4] cursor-pointer"
                      />
                      <label htmlFor="vehicle-bonus" className="text-sm font-bold text-[#0B1C30] cursor-pointer select-none">
                        Requiere Bonificación por Vehículos (Plus Turno)
                      </label>
                    </div>
                    <p className="text-xs text-slate-600 pl-7">
                      Al activarse, las jornadas cumplidas en este puesto aplicarán la escala salarial de bonificación
                      por vehículos computados en el parte de operaciones según convenio colectivo (CCT).
                    </p>
                  </div>

                  {/* Valores de Sueldo del Personal (Hora Hombre) */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                        <DollarSign className="h-4 w-4 text-emerald-700" />
                        <span>Valores de Sueldo del Personal (Bolsillo)</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={posSalaryAutoCalc}
                          onChange={(e) => setPosSalaryAutoCalc(e.target.checked)}
                          className="h-3.5 w-3.5 text-emerald-600 rounded"
                        />
                        <span>Auto 1.5x / 2.0x</span>
                      </label>
                    </div>

                    <p className="text-[11px] text-emerald-800">
                      Importes de bolsillo para el cálculo de sueldos de los colaboradores (desvinculados de las tarifas a clientes).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1C30] mb-1" htmlFor="pos-salary-reg">
                          Hora Normal ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pos-salary-reg"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={posRegularRate}
                          onChange={(e) => handlePosRegularChange(e.target.value)}
                          placeholder="Ej: 8983.68"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1C30] mb-1" htmlFor="pos-salary-ot50">
                          Extra 50% ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pos-salary-ot50"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={posOt50Rate}
                          onChange={(e) => setPosOt50Rate(e.target.value)}
                          placeholder="Ej: 13475.53"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1C30] mb-1" htmlFor="pos-salary-ot100">
                          Extra 100% ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pos-salary-ot100"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={posOt100Rate}
                          onChange={(e) => setPosOt100Rate(e.target.value)}
                          placeholder="Ej: 17967.37"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Information Box */}
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-[#1E5BB4]" />
                      Integración del Puesto de Trabajo:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Podrás asignar colaboradores a este puesto desde la columna <b>Personal Asignado</b>.</li>
                      <li>Podrás definir la tarifa horaria por cliente (Normal, 50% y 100%) desde <b>Tarifario Comercial</b>.</li>
                      <li>Aparecerá disponible en la <b>Carga Diaria de Horas</b> y cálculo de sueldos.</li>
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseSlideover}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    data-testid="positions-btn-guardar"
                    disabled={saving}
                    className="bg-[#1E5BB4] hover:bg-[#004392] disabled:opacity-50 text-white font-bold text-sm px-6 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{editingPosition ? 'Guardar Cambios' : 'Crear Puesto'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASIGNAR PERSONAL AL PUESTO                        */}
      {/* ======================================================== */}
      {isAssignStaffModalOpen && activePositionForStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-5 bg-[#0F2547] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Asignar Personal al Puesto</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500 text-white">
                    {activePositionForStaff.name}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Marca los colaboradores que tendrán asignado este cargo por defecto
                </p>
              </div>
              <button
                onClick={() => setIsAssignStaffModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter / Search inside Modal */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, DNI o legajo..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-semibold text-slate-600">
                  {selectedStaffIds.length} seleccionados
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredEmployeesForAssignment.map((e) => e.id);
                      setSelectedStaffIds(Array.from(new Set([...selectedStaffIds, ...allIds])));
                    }}
                    className="text-xs text-[#1E5BB4] hover:underline font-medium cursor-pointer"
                  >
                    Marcar filtrados
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffIds([])}
                    className="text-xs text-slate-500 hover:underline font-medium cursor-pointer"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>
            </div>

            {/* Staff List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
              {filteredEmployeesForAssignment.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No se encontraron colaboradores con el término de búsqueda.
                </div>
              ) : (
                filteredEmployeesForAssignment.map((emp) => {
                  const isChecked = selectedStaffIds.includes(emp.id);
                  const isAssignedToOther =
                    emp.default_position_id &&
                    emp.default_position_id !== activePositionForStaff.id;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleStaff(emp.id)}
                      className={`pt-2.5 pb-2 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-sky-50/70 border border-sky-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by row click
                          className="h-4 w-4 text-[#1E5BB4] border-slate-300 rounded focus:ring-[#1E5BB4] cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#0B1C30]">
                              {emp.full_name}
                            </span>
                            {emp.status === 'inactive' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>DNI: {emp.national_id}</span>
                            {emp.file_number && <span>• Legajo: {emp.file_number}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Current Position Tag */}
                      <div className="text-right">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004392] bg-blue-100 px-2 py-0.5 rounded">
                            <UserCheck className="h-3 w-3" />
                            Asignado a {activePositionForStaff.name}
                          </span>
                        ) : isAssignedToOther ? (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Puesto actual: {emp.default_position_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin puesto asignado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAssignStaffModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingStaff}
                onClick={handleSaveStaffAssignments}
                className="bg-[#1E5BB4] hover:bg-[#004392] disabled:opacity-50 text-white font-bold text-sm px-6 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {savingStaff && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Guardar Asignaciones ({selectedStaffIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TARIFARIO COMERCIAL POR CLIENTE                   */}
      {/* ======================================================== */}
      {isRatesModalOpen && activePositionForRates && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 bg-[#0F2547] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Tarifario Comercial por Cliente</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500 text-white">
                    {activePositionForRates.name}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Precios por hora comercial facturables a cada cliente para este puesto de trabajo
                </p>
              </div>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Existing Rates Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1C30]">
                    Tarifas Activas ({activePositionForRates.client_rates.length})
                  </h3>
                  <Link
                    href="/rates"
                    target="_blank"
                    className="text-xs text-[#1E5BB4] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Ver Tarifario General</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {activePositionForRates.client_rates.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <DollarSign className="h-8 w-8 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-[#0B1C30]">
                      No hay tarifas configuradas para este puesto
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completa el formulario inferior para asignar el valor por hora a un cliente.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Vigencia</th>
                          <th className="py-2.5 px-3 text-right">Hora Normal</th>
                          <th className="py-2.5 px-3 text-right">Extra 50%</th>
                          <th className="py-2.5 px-3 text-right">Extra 100%</th>
                          <th className="py-2.5 px-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activePositionForRates.client_rates.map((rate) => (
                          <tr key={`${rate.client_id}_${rate.effective_from}`} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-[#0B1C30]">
                              {rate.client_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {rate.effective_from}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                              ${rate.rate_regular.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                              ${rate.rate_overtime_50.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                              ${rate.rate_overtime_100.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={deletingRate}
                                onClick={() => handleDeleteClientRate(rate.client_id, rate.effective_from)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                                title="Eliminar tarifa para este cliente"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Form: Add / Update Client Rate */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1C30] flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-[#1E5BB4]" />
                    <span>Asignar o Actualizar Tarifa por Cliente</span>
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rateAutoCalc}
                      onChange={(e) => setRateAutoCalc(e.target.checked)}
                      className="h-3.5 w-3.5 text-[#1E5BB4] rounded"
                    />
                    <span>Cálculo automático (50% = x1.5, 100% = x2)</span>
                  </label>
                </div>

                <form onSubmit={handleSaveClientRate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Selector de Cliente */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#0B1C30] mb-1" htmlFor="client-rate-select">
                        Cliente <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="client-rate-select"
                          required
                          value={rateClientId}
                          onChange={(e) => setRateClientId(e.target.value)}
                          className="w-full bg-white border border-[#0F2547] rounded-lg px-3 py-2 text-xs text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
                        >
                          <option value="">Seleccione un cliente...</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.company_name} ({c.tax_id})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
                      </div>
                    </div>

                    {/* Fecha de Vigencia */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#0B1C30] mb-1" htmlFor="rate-effective-date">
                        Fecha de Vigencia <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="rate-effective-date"
                          type="date"
                          required
                          value={rateEffectiveFrom}
                          onChange={(e) => setRateEffectiveFrom(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rate Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Hora Normal */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="rate-regular">
                        Hora Normal ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="rate-regular"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Ej: 10777.06"
                        value={rateRegular}
                        onChange={(e) => handleRegularRateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                      />
                    </div>

                    {/* Hora Extra 50% */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="rate-ot50">
                        Hora Extra 50% ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="rate-ot50"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Ej: 16165.60"
                        value={rateOvertime50}
                        onChange={(e) => setRateOvertime50(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                      />
                    </div>

                    {/* Hora Extra 100% */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="rate-ot100">
                        Hora Extra 100% ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="rate-ot100"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Ej: 21554.13"
                        value={rateOvertime100}
                        onChange={(e) => setRateOvertime100(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-semibold text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingRate}
                      className="bg-[#1E5BB4] hover:bg-[#004392] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      {savingRate && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Guardar Tarifa Comercial</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Las tarifas guardadas se aplicarán automáticamente a las proformas y partes diarios.
              </span>
              <button
                type="button"
                onClick={() => setIsRatesModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ACTUALIZAR VALORES DE SUELDO (HORA HOMBRE)        */}
      {/* ======================================================== */}
      {isSalaryModalOpen && activePositionForSalary && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1C30]">
                    Valores de Sueldo: {activePositionForSalary.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Básicos de bolsillo por hora para liquidación del personal
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

            <form onSubmit={handleSaveSalaryRates} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">
                  Cálculo automático de horas extras:
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={salaryAutoCalc}
                    onChange={(e) => setSalaryAutoCalc(e.target.checked)}
                    className="h-3.5 w-3.5 text-emerald-600 rounded"
                  />
                  <span>50% = x1.5, 100% = x2.0</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="salary-modal-reg">
                    Hora Normal ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="salary-modal-reg"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salaryRegular}
                    onChange={(e) => handleSalaryRegularChange(e.target.value)}
                    placeholder="Ej: 10777.06"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="salary-modal-ot50">
                    Hora Extra 50% ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="salary-modal-ot50"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salaryOvertime50}
                    onChange={(e) => setSalaryOvertime50(e.target.value)}
                    placeholder="Ej: 16165.60"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="salary-modal-ot100">
                    Hora Extra 100% ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="salary-modal-ot100"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salaryOvertime100}
                    onChange={(e) => setSalaryOvertime100(e.target.value)}
                    placeholder="Ej: 21554.13"
                    className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1" htmlFor="salary-modal-date">
                  Fecha de Vigencia
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="salary-modal-date"
                    type="date"
                    value={salaryEffectiveFrom}
                    onChange={(e) => setSalaryEffectiveFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-xs text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800">
                ℹ️ Estos valores se aplican directamente al motor de liquidación en <b>Cálculo de Sueldos</b> para todos los colaboradores con el puesto <b>{activePositionForSalary.name}</b>. Son independientes de las tarifas comerciales facturadas a los clientes.
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
                  disabled={savingSalary}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {savingSalary && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Guardar Valores de Sueldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN                       */}
      {/* ======================================================== */}
      {isDeleteModalOpen && positionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1C30] text-center">
                ¿Eliminar puesto "{positionToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500 text-center mt-2">
                Esta acción eliminará el puesto del catálogo.
              </p>

              {positionToDelete.employees_count > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  ⚠️ <b>{positionToDelete.employees_count} colaborador(es)</b> tienen asignado este puesto.
                  Al eliminarlo, quedarán sin puesto asignado.
                </div>
              )}

              {positionToDelete.rates_count > 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  ⚠️ Se eliminarán <b>{positionToDelete.rates_count} tarifas comerciales</b> configuradas para este puesto en clientes.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Eliminar Puesto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

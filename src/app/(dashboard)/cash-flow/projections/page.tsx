'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  getFinancialProjections,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
  ProjectedMovement,
  CashMovementRow,
} from '@/lib/services/projections';

function getEndOfCurrentMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

function getEndOfNextMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return lastDay.toISOString().split('T')[0];
}

function getNextFortnight(): string {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (day < 15) {
    return new Date(year, month, 15).toISOString().split('T')[0];
  } else {
    return new Date(year, month + 1, 0).toISOString().split('T')[0];
  }
}

function getPlusDays(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString().split('T')[0];
}

export default function ProjectionsPage() {
  const queryClient = useQueryClient();

  // Target projection date filter ("Saldo para fecha X"), default is end of current month
  const [targetDate, setTargetDate] = useState<string>(getEndOfCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Slideover & Form state for movements
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<{ id: string; row?: CashMovementRow } | null>(null);
  const [formDate, setFormDate] = useState<string>(getEndOfCurrentMonth());
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formArea, setFormArea] = useState<string>('ARCA');
  const [formDetail, setFormDetail] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [movementToDelete, setMovementToDelete] = useState<ProjectedMovement | null>(null);

  // Main projections query
  const {
    data: projectionData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.projections.byDate(targetDate),
    queryFn: () => getFinancialProjections(targetDate),
  });

  // Mutations (Unified with cash_movements)
  const createMutation = useMutation({
    mutationFn: createCashMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.all });
      showNotification('success', `Nuevo ${formType === 'income' ? 'ingreso' : 'egreso'} registrado exitosamente.`);
      setIsSlideoverOpen(false);
    },
    onError: (err: unknown) => {
      console.error('Error creating movement:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el movimiento.';
      setFormError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCashMovement>[1] }) =>
      updateCashMovement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.all });
      showNotification('success', 'Movimiento actualizado correctamente.');
      setIsSlideoverOpen(false);
    },
    onError: (err: unknown) => {
      console.error('Error updating movement:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el movimiento.';
      setFormError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCashMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.all });
      showNotification('success', 'Movimiento eliminado correctamente.');
      setMovementToDelete(null);
    },
    onError: (err: unknown) => {
      console.error('Error deleting movement:', err);
      const msg = err instanceof Error ? err.message : 'Error al eliminar el movimiento.';
      showNotification('error', msg);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Filtered movements based on category dropdown
  const filteredMovements = useMemo(() => {
    if (!projectionData) return [];
    if (selectedCategory === 'all') return projectionData.movements;
    return projectionData.movements.filter(
      (m) => m.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [projectionData, selectedCategory]);

  const formatCurrency = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleOpenNew = (type: 'income' | 'expense' = 'expense', defaultArea: string = 'ARCA') => {
    setEditingMovement(null);
    setFormDate(targetDate || getEndOfCurrentMonth());
    setFormType(type);
    setFormArea(type === 'income' ? 'Cobros' : defaultArea);
    setFormDetail('');
    setFormAmount('');
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (mov: ProjectedMovement) => {
    if (!mov.movementId) return;
    setEditingMovement({ id: mov.movementId });
    setFormDate(mov.date);
    setFormType(mov.type);
    setFormArea(mov.category);
    setFormDetail(mov.concept);
    setFormAmount(String(mov.amount));
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      setFormError('Por favor selecciona la fecha del movimiento.');
      return;
    }
    if (!formDetail.trim()) {
      setFormError('Por favor ingresa el detalle o concepto.');
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor ingresa un importe válido mayor a 0.');
      return;
    }

    setFormError(null);

    if (editingMovement) {
      updateMutation.mutate({
        id: editingMovement.id,
        payload: {
          movement_date: formDate,
          type: formType,
          area: formArea,
          detail: formDetail.trim(),
          amount: parsedAmount,
        },
      });
    } else {
      createMutation.mutate({
        movement_date: formDate,
        type: formType,
        area: formArea,
        detail: formDetail.trim(),
        amount: parsedAmount,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!movementToDelete || !movementToDelete.movementId) return;
    deleteMutation.mutate(movementToDelete.movementId);
  };

  // Columns definition (Ascending order)
  const columns = useMemo<ColumnDef<ProjectedMovement>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-slate-700">
            {formatDateDisplay(String(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const isIngreso = getValue() === 'income';
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isIngreso
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isIngreso ? 'Ingreso (+)' : 'Egreso (-)'}
            </span>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Área / Concepto',
        cell: ({ getValue }) => {
          const cat = String(getValue());
          let colorStyle = 'bg-slate-100 text-slate-800';
          if (cat === 'Facturación' || cat === 'Cobros') colorStyle = 'bg-blue-100 text-blue-800';
          else if (cat === 'Sueldos') colorStyle = 'bg-amber-100 text-amber-800';
          else if (cat === 'ARCA' || cat === 'ARBA' || cat === 'IVA' || cat === 'Impuestos') colorStyle = 'bg-purple-100 text-purple-800';
          else if (cat === 'Comisiones') colorStyle = 'bg-teal-100 text-teal-800';

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${colorStyle}`}>
              {cat}
            </span>
          );
        },
      },
      {
        accessorKey: 'concept',
        header: 'Detalle',
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div>
              <span className="font-medium text-[#0B1C30] block">{m.concept}</span>
              <span className="text-[11px] text-slate-500">
                {m.source === 'invoice'
                  ? 'Factura emitida pendiente de cobro'
                  : m.source === 'proforma'
                  ? 'Proforma aprobada en facturación'
                  : 'Movimiento de caja'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: () => <span className="block text-right">Importe</span>,
        cell: ({ row }) => {
          const isIngreso = row.original.type === 'income';
          const amt = Number(row.original.amount);
          return (
            <span
              className={`block text-right font-mono font-bold whitespace-nowrap ${
                isIngreso ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {isIngreso ? `+${formatCurrency(amt)}` : `-${formatCurrency(amt)}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'balanceAfter',
        header: () => <span className="block text-right">SALDO</span>,
        cell: ({ getValue }) => {
          const bal = Number(getValue() || 0);
          return (
            <span
              className={`block text-right font-mono font-bold whitespace-nowrap ${
                bal >= 0 ? 'text-[#0B1C30]' : 'text-red-600'
              }`}
            >
              {formatCurrency(bal)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="block text-center pr-2">Acciones</span>,
        cell: ({ row }) => {
          const m = row.original;
          if (!m.isManualMovement) {
            return (
              <span className="block text-center text-[11px] text-slate-400 italic">
                Automático
              </span>
            );
          }
          return (
            <div className="text-center whitespace-nowrap space-x-1 pr-2">
              <button
                onClick={() => handleOpenEdit(m)}
                className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar Movimiento"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMovementToDelete(m)}
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar Movimiento"
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
    data: filteredMovements,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Return to Cash Flow Link & Breadcrumb */}
      <div>
        <Link
          href="/cash-flow"
          data-testid="projections-btn-volver"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1E5BB4] hover:text-[#004392] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Flujo de Caja</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Proyecciones de Flujo de Caja</h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-100 text-[#004392] rounded-full">
              Estimación a Fecha de Corte
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Visualización proyectada de ingresos (Facturación) y egresos (Sueldos, ARCA, ARBA, IVA, Comisiones)
          </p>
        </div>

        {/* Quick action buttons matching /cash-flow standard */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenNew('income')}
            data-testid="projections-btn-nuevo-ingreso"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Ingreso</span>
          </button>
          <button
            onClick={() => handleOpenNew('expense')}
            data-testid="projections-btn-nuevo-movimiento"
            className="bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-4 py-2 text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Egreso</span>
          </button>
        </div>
      </header>

      {/* Notifications Alert */}
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

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Ingresos Proyectados */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Ingresos Proyectados</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div>
            <p
              data-testid="projections-kpi-ingresos"
              className="text-2xl font-bold font-mono text-emerald-700"
            >
              {formatCurrency(projectionData?.projectedIncome || 0)}
            </p>
            <span className="text-[11px] text-slate-400">Facturación y cobros hasta la fecha</span>
          </div>
        </article>

        {/* Card 2: Egresos Proyectados */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Egresos Proyectados</span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div>
            <p
              data-testid="projections-kpi-egresos"
              className="text-2xl font-bold font-mono text-red-600"
            >
              {formatCurrency(projectionData?.projectedExpense || 0)}
            </p>
            <span className="text-[11px] text-slate-400">Sueldos, ARCA, ARBA, IVA, comisiones</span>
          </div>
        </article>

        {/* Card 3: Saldo Proyectado Final a Fecha X */}
        <article className="bg-[#004392] text-white rounded-xl p-4 shadow-md flex flex-col justify-between h-28 border border-[#002d67]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Saldo Proyectado al {formatDateDisplay(targetDate)}
            </span>
            <span className="p-1.5 bg-white/10 text-white rounded-lg">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div>
            <p
              data-testid="projections-kpi-saldo-proyectado"
              className={`text-2xl font-bold font-mono ${
                (projectionData?.projectedBalance || 0) >= 0 ? 'text-white' : 'text-red-300'
              }`}
            >
              {formatCurrency(projectionData?.projectedBalance || 0)}
            </p>
            <span className="text-[11px] text-blue-200">Saldo estimado de caja resultante</span>
          </div>
        </article>
      </section>

      {/* Filters Section (Sky Blue B2B Card per Stitch standard) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Selector de Fechas (Criterio DoD: "Saldo para fecha X") */}
          <div className="lg:col-span-4 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Saldo para fecha X (Fecha de Corte)</span>
            </label>
            <input
              type="date"
              required
              data-testid="projections-input-target-date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2 text-sm text-[#0B1C30] font-semibold focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="lg:col-span-5 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Atajos Rápidos de Fecha</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="projections-preset-fin-mes"
                onClick={() => setTargetDate(getEndOfCurrentMonth())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetDate === getEndOfCurrentMonth()
                    ? 'bg-[#0F2547] text-white shadow-xs'
                    : 'bg-white text-[#0F2547] hover:bg-sky-50'
                }`}
              >
                Fin de Mes
              </button>
              <button
                type="button"
                data-testid="projections-preset-quincena"
                onClick={() => setTargetDate(getNextFortnight())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetDate === getNextFortnight()
                    ? 'bg-[#0F2547] text-white shadow-xs'
                    : 'bg-white text-[#0F2547] hover:bg-sky-50'
                }`}
              >
                Próxima Quincena
              </button>
              <button
                type="button"
                data-testid="projections-preset-fin-prox-mes"
                onClick={() => setTargetDate(getEndOfNextMonth())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetDate === getEndOfNextMonth()
                    ? 'bg-[#0F2547] text-white shadow-xs'
                    : 'bg-white text-[#0F2547] hover:bg-sky-50'
                }`}
              >
                Fin Próximo Mes
              </button>
              <button
                type="button"
                data-testid="projections-preset-plus-30"
                onClick={() => setTargetDate(getPlusDays(30))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#0F2547] hover:bg-sky-50 transition-all cursor-pointer"
              >
                +30 Días
              </button>
            </div>
          </div>

          {/* Categoría Filter */}
          <div className="lg:col-span-3 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Filtrar Concepto</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="all">Todos los conceptos</option>
              <option value="Facturación">Facturación (Cobros)</option>
              <option value="Sueldos">Sueldos</option>
              <option value="ARCA">ARCA</option>
              <option value="ARBA">ARBA</option>
              <option value="IVA">IVA</option>
              <option value="Comisiones">Comisiones</option>
              <option value="Proveedores">Proveedores</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        {/* Footer info in filter card */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
          <span className="text-sky-100 flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>
              Mostrando la proyección acumulada en orden cronológico hasta el día{' '}
              <strong className="text-white font-mono">{formatDateDisplay(targetDate)}</strong>
            </span>
          </span>
          {isRefetching && (
            <span className="text-white flex items-center gap-1 text-[11px]">
              <Loader2 className="h-3 w-3 animate-spin" /> Actualizando proyección...
            </span>
          )}
        </div>
      </section>

      {/* Main Projections Table Section (Ordered Ascending) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#1E5BB4]" />
            <span>Calculando proyección de ingresos y egresos...</span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <p className="font-semibold text-slate-700">
              No se encontraron movimientos registrados o previstos comprendidos hasta el {formatDateDisplay(targetDate)}.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Puedes cargar nuevos ingresos o egresos (Sueldos, ARCA, ARBA, IVA, Comisiones) con los botones superiores.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider first:pl-6 last:pr-6 whitespace-nowrap"
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
                      className={`hover:bg-slate-50 transition-colors ${
                        index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3.5 first:pl-6 last:pr-6 whitespace-nowrap"
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

      {/* Slideover for New / Edit Movement */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
          />

          {/* Slideover Panel (Sky Blue matching Stitch B2B standard) */}
          <div className="relative w-screen max-w-md bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="font-bold text-lg sm:text-xl text-white">
                {editingMovement
                  ? 'Editar Movimiento'
                  : formType === 'income'
                  ? 'Nuevo Ingreso Proyectado'
                  : 'Nuevo Egreso Proyectado'}
              </h2>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveMovement} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Fecha */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Fecha</label>
                <input
                  type="date"
                  required
                  data-testid="projections-form-input-date"
                  disabled={isSubmitting}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Tipo de Movimiento</label>
                <select
                  disabled={isSubmitting}
                  value={formType}
                  onChange={(e) => {
                    const newType = e.target.value as 'income' | 'expense';
                    setFormType(newType);
                    if (newType === 'income') {
                      setFormArea('Cobros');
                    } else if (newType === 'expense' && formArea === 'Cobros') {
                      setFormArea('ARCA');
                    }
                  }}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                >
                  <option value="expense">Egreso (-)</option>
                  <option value="income">Ingreso (+)</option>
                </select>
              </div>

              {/* Área / Categoría */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Área / Categoría</label>
                <select
                  required
                  disabled={isSubmitting}
                  data-testid="projections-form-select-category"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                >
                  {formType === 'income' ? (
                    <>
                      <option value="Cobros">Cobros / Facturación</option>
                      <option value="Otros">Otros Ingresos</option>
                    </>
                  ) : (
                    <>
                      <option value="ARCA">ARCA (Impuestos Nacionales)</option>
                      <option value="ARBA">ARBA (Ingresos Brutos Prov. Bs As)</option>
                      <option value="IVA">IVA (Saldo Declaración Jurada)</option>
                      <option value="Sueldos">Sueldos (Nómina y Cargas Sociales)</option>
                      <option value="Comisiones">Comisiones (Logística / Agentes)</option>
                      <option value="Proveedores">Proveedores y Gastos Operativos</option>
                      <option value="Otros">Otros Egresos</option>
                    </>
                  )}
                </select>
              </div>

              {/* Detalle */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Detalle / Concepto</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  data-testid="projections-form-input-title"
                  placeholder="Ej: Anticipo Ganancias ARCA, Sueldos quincena, Factura #1234"
                  value={formDetail}
                  onChange={(e) => setFormDetail(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                />
              </div>

              {/* Importe */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Importe</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isSubmitting}
                    data-testid="projections-form-input-amount"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-white border-2 border-[#0F2547] rounded-lg pl-8 pr-4 py-2.5 text-sm font-mono text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Slideover Footer */}
              <div className="pt-6 border-t border-[#0F2547]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#0F2547] bg-white border-2 border-transparent hover:border-[#0F2547] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="projections-btn-guardar-movimiento"
                  disabled={isSubmitting}
                  className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingMovement ? 'Guardar Cambios' : 'Guardar Movimiento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {movementToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isDeleting && setMovementToDelete(null)}
          />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl z-50 space-y-4 text-slate-800 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Eliminar Movimiento?</h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar el movimiento{' '}
              <strong className="text-slate-900">&quot;{movementToDelete.concept}&quot;</strong> por un importe de{' '}
              <strong className="text-slate-900 font-mono">{formatCurrency(Number(movementToDelete.amount))}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setMovementToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="projections-btn-confirm-delete"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
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
  getCashMovements,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
  CashMovementRow,
} from '@/lib/services/cash-flow';

type CashMovementWithBalance = CashMovementRow & { balanceAfter: number };

export default function CashFlowPage() {
  const queryClient = useQueryClient();

  const {
    data: movements = [],
    isLoading,
  } = useQuery({
    queryKey: queryKeys.cashFlow.all,
    queryFn: getCashMovements,
  });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [fromDate, toDate, selectedArea, selectedType]);

  // Slideover & Form state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<CashMovementRow | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formArea, setFormArea] = useState('Cobros');
  const [formDetail, setFormDetail] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal state
  const [movementToDelete, setMovementToDelete] = useState<CashMovementRow | null>(null);

  // Base balance for ledger calculation
  const initialBaseBalance = 0;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const createMutation = useMutation({
    mutationFn: createCashMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
      showNotification('success', `Nuevo ${formType === 'income' ? 'ingreso' : 'egreso'} registrado exitosamente.`);
      setIsSlideoverOpen(false);
    },
    onError: (err: unknown) => {
      console.error('Error creating movement:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el movimiento en la base de datos.';
      setFormError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCashMovement>[1] }) =>
      updateCashMovement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
      showNotification('success', 'Movimiento de caja actualizado correctamente.');
      setIsSlideoverOpen(false);
    },
    onError: (err: unknown) => {
      console.error('Error updating movement:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el movimiento en la base de datos.';
      setFormError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCashMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow.all });
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

  // KPIs Totals
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const m of movements) {
      const amt = Number(m.amount) || 0;
      if (m.type === 'income') inc += amt;
      else exp += amt;
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
    };
  }, [movements]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // If only fromDate is set, filter STRICTLY for that specific date (no subsequent dates)
      if (fromDate && !toDate && m.movement_date !== fromDate) return false;
      // If only toDate is set, show up to toDate
      if (!fromDate && toDate && m.movement_date > toDate) return false;
      // If both fromDate and toDate are set, show the inclusive range
      if (fromDate && toDate && (m.movement_date < fromDate || m.movement_date > toDate)) return false;

      if (selectedArea && selectedArea !== 'Todas' && m.area.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }
      if (selectedType !== 'all' && m.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [movements, fromDate, toDate, selectedArea, selectedType]);

  // Running balance calculation
  // Order chronologically (ASC) to assign running balance, then reverse to display newest first
  const movementsWithBalance = useMemo(() => {
    const chronological = [...filteredMovements].sort((a, b) => {
      if (a.movement_date !== b.movement_date) {
        return a.movement_date.localeCompare(b.movement_date);
      }
      return (a.created_at || '').localeCompare(b.created_at || '');
    });

    let runningBal = initialBaseBalance;
    const withBal = [];
    for (const m of chronological) {
      const effect = m.type === 'income' ? Number(m.amount) : -Number(m.amount);
      runningBal += effect;
      withBal.push({
        ...m,
        balanceAfter: runningBal,
      });
    }

    return withBal.reverse();
  }, [filteredMovements, initialBaseBalance]);

  const handleOpenNew = (defaultType: 'income' | 'expense' = 'income') => {
    setEditingMovement(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType(defaultType);
    setFormArea(defaultType === 'income' ? 'Cobros' : 'Proveedores');
    setFormDetail('');
    setFormAmount('');
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (m: CashMovementRow) => {
    setEditingMovement(m);
    setFormDate(m.movement_date);
    setFormType(m.type);
    setFormArea(m.area);
    setFormDetail(m.detail);
    setFormAmount(String(m.amount));
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      setFormError('Por favor ingresa la fecha del movimiento.');
      return;
    }
    if (!formArea) {
      setFormError('Por favor selecciona un área.');
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
    if (!movementToDelete) return;
    deleteMutation.mutate(movementToDelete.id);
  };

  const formatCurrency = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const columns = useMemo<ColumnDef<CashMovementWithBalance>[]>(
    () => [
      {
        accessorKey: 'movement_date',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-slate-600">
            {String(getValue()).split('-').reverse().join('/')}
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
              {isIngreso ? 'Ingreso' : 'Egreso'}
            </span>
          );
        },
      },
      {
        accessorKey: 'area',
        header: 'Área',
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-700">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: 'detail',
        header: 'Detalle',
        cell: ({ getValue }) => (
          <span className="font-medium text-[#0B1C30]">{String(getValue())}</span>
        ),
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
        header: () => <span className="block text-right">Saldo</span>,
        cell: ({ getValue }) => (
          <span className="block text-right font-mono font-bold text-[#0B1C30] whitespace-nowrap">
            {formatCurrency(Number(getValue()))}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-center pr-2">Acciones</span>,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="text-center whitespace-nowrap space-x-1 pr-2">
              <button
                onClick={() => handleOpenEdit(m)}
                className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMovementToDelete(m)}
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar"
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
    data: movementsWithBalance,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Flujo de Caja</h1>
          <p className="text-slate-500 text-sm mt-1">Control de ingresos, egresos y saldo operativo en tiempo real</p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenNew('income')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Ingreso</span>
          </button>
          <button
            onClick={() => handleOpenNew('expense')}
            className="bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-4 py-2 text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Ingresos</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700">{formatCurrency(totalIncome)}</p>
        </article>

        {/* Total Egresos */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Egresos</span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-red-600">{formatCurrency(totalExpense)}</p>
        </article>

        {/* Saldo Neto */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Operativo</span>
            <span className="p-1.5 bg-blue-50 text-[#1E5BB4] rounded-lg">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p
            className={`text-2xl font-bold font-mono ${
              netBalance >= 0 ? 'text-[#0B1C30]' : 'text-red-600'
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
        </article>
      </section>

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

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-white">
                {toDate ? 'Fecha Desde' : 'Fecha (Día Exacto)'}
              </label>
              {fromDate && !toDate && (
                <span className="text-[10px] bg-sky-900/60 text-white px-1.5 py-0.5 rounded font-bold">
                  Solo este día
                </span>
              )}
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Fecha Hasta (Opcional p/ Rango)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Tipo de Movimiento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="all">Todos los tipos</option>
              <option value="income">Solo Ingresos (+)</option>
              <option value="expense">Solo Egresos (-)</option>
            </select>
          </div>

          {/* Área Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todas las áreas</option>
              <option value="Cobros">Cobros</option>
              <option value="Sueldos">Sueldos</option>
              <option value="Proveedores">Proveedores</option>
              <option value="Impuestos">Impuestos</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        {(fromDate || toDate || selectedArea || selectedType !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
            <span className="text-sky-100">
              {fromDate && !toDate && `Mostrando exclusivamente los movimientos del día ${fromDate}`}
              {fromDate && toDate && `Mostrando rango del ${fromDate} al ${toDate}`}
              {!fromDate && toDate && `Mostrando movimientos hasta el día ${toDate}`}
            </span>
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedArea('');
                setSelectedType('all');
              }}
              className="text-white hover:underline font-bold cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </section>

      {/* Data Table Section */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#1E5BB4]" />
            <span>Cargando movimientos de flujo de caja...</span>
          </div>
        ) : movementsWithBalance.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No se encontraron movimientos registrados con los filtros seleccionados.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[750px]">
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

      {/* Slideover (Overlay + Panel) */}
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
                {editingMovement ? 'Editar Movimiento' : formType === 'income' ? 'Ingreso de Flujo de Caja' : 'Ingresar Nuevo Egreso'}
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
                    if (newType === 'income' && formArea === 'Proveedores') {
                      setFormArea('Cobros');
                    } else if (newType === 'expense' && formArea === 'Cobros') {
                      setFormArea('Proveedores');
                    }
                  }}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                >
                  <option value="income">Ingreso (+)</option>
                  <option value="expense">Egreso (-)</option>
                </select>
              </div>

              {/* Área */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Área / Categoría</label>
                <select
                  required
                  disabled={isSubmitting}
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100"
                >
                  <option value="">Seleccionar área...</option>
                  <option value="Cobros">Cobros (Facturación)</option>
                  <option value="Sueldos">Sueldos (Nómina)</option>
                  <option value="Proveedores">Proveedores (Gastos operativos)</option>
                  <option value="Impuestos">Impuestos (ARCA / ARBA)</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {/* Detalle */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Detalle / Concepto</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Ej: Factura #1234, Cobro de servicio, etc."
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
              <strong className="text-slate-900">&quot;{movementToDelete.detail}&quot;</strong> por un importe de{' '}
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

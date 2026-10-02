'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Car,
  Layers,
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
  getUnionBonusScales,
  saveUnionBonusScale,
  deleteUnionBonusScale,
  UnionBonusScaleRow,
} from '@/lib/services/union-scales';

interface UnionBonusScalesTabProps {
  onNotify: (msg: string) => void;
  onCountChange?: (count: number) => void;
}

export function UnionBonusScalesTab({ onNotify, onCountChange }: UnionBonusScalesTabProps) {
  const queryClient = useQueryClient();

  // 1. Fetch scales
  const {
    data: scales = [],
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.rates.unionScales,
    queryFn: getUnionBonusScales,
  });

  useEffect(() => {
    if (onCountChange) {
      onCountChange(scales.length);
    }
  }, [scales.length, onCountChange]);

  // 2. Filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm]);

  // 3. Slideover state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<UnionBonusScaleRow | null>(null);
  const [minVehicles, setMinVehicles] = useState('');
  const [maxVehicles, setMaxVehicles] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // 4. Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scaleToDelete, setScaleToDelete] = useState<UnionBonusScaleRow | null>(null);

  // 5. Mutations
  const saveMutation = useMutation({
    mutationFn: saveUnionBonusScale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.unionScales });
      setIsSlideoverOpen(false);
      onNotify(editingScale ? 'Escala salarial actualizada.' : 'Nueva escala registrada con éxito.');
    },
    onError: (err: Error) => {
      console.error('Error saving union bonus scale:', err);
      setFormError(err.message || 'Error al guardar la escala salarial.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnionBonusScale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.unionScales });
      setIsDeleteModalOpen(false);
      setScaleToDelete(null);
      onNotify('Escala salarial eliminada con éxito.');
    },
    onError: (err: Error) => {
      console.error('Error deleting union bonus scale:', err);
      onNotify(`Error al eliminar: ${err.message}`);
    },
  });

  const saving = saveMutation.isPending;
  const deleting = deleteMutation.isPending;

  // Handlers
  const handleOpenSlideover = useCallback((scale?: UnionBonusScaleRow) => {
    setFormError(null);
    if (scale) {
      setEditingScale(scale);
      setMinVehicles(scale.min_vehicles.toString());
      setMaxVehicles(scale.max_vehicles.toString());
      setBonusAmount(scale.bonus_amount.toString());
      setEffectiveFrom(scale.effective_from);
    } else {
      setEditingScale(null);
      // Auto suggest next min based on max of highest existing scale
      const highest = scales.reduce((prev, curr) => (curr.max_vehicles > prev ? curr.max_vehicles : prev), 0);
      setMinVehicles(scales.length > 0 ? (highest + 1).toString() : '0');
      setMaxVehicles(scales.length > 0 ? (highest + 500).toString() : '1499');
      setBonusAmount('');
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
    }
    setIsSlideoverOpen(true);
  }, [scales]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const min = parseInt(minVehicles, 10);
    const max = parseInt(maxVehicles, 10);
    const amt = parseFloat(bonusAmount);

    if (isNaN(min) || min < 0) {
      setFormError('El valor mínimo de unidades debe ser mayor o igual a 0.');
      return;
    }
    if (isNaN(max) || max < 0) {
      setFormError('El valor máximo de unidades debe ser mayor o igual a 0.');
      return;
    }
    if (max < min) {
      setFormError('El valor máximo debe ser mayor o igual al mínimo de unidades.');
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setFormError('Ingrese un monto de bonificación válido.');
      return;
    }
    if (!effectiveFrom) {
      setFormError('Ingrese una fecha de vigencia válida.');
      return;
    }

    saveMutation.mutate({
      ...(editingScale?.id ? { id: editingScale.id } : {}),
      min_vehicles: min,
      max_vehicles: max,
      bonus_amount: amt,
      effective_from: effectiveFrom,
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Filtered rows
  const filteredScales = useMemo(() => {
    if (!searchTerm) return scales;
    const term = searchTerm.toLowerCase();
    return scales.filter((item) => {
      const rangeStr = `${item.min_vehicles} - ${item.max_vehicles}`;
      const amountStr = item.bonus_amount.toString();
      const dateStr = item.effective_from;
      return (
        rangeStr.includes(term) ||
        amountStr.includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [scales, searchTerm]);

  // Columns definition
  const columns = useMemo<ColumnDef<UnionBonusScaleRow>[]>(
    () => [
      {
        accessorKey: 'min_vehicles',
        header: 'Rango de Unidades',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-sky-50 text-[#1E5BB4]">
                <Car className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-[#0B1C30]">
                  {formatNumber(s.min_vehicles)} a {formatNumber(s.max_vehicles)} unidades
                </span>
                <span className="text-[11px] text-slate-400">
                  {s.min_vehicles === 0 ? 'Tramo base' : `Desde ${formatNumber(s.min_vehicles)} u.`}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'bonus_amount',
        header: () => <span className="block text-right">Monto Bonificación ($)</span>,
        cell: ({ getValue }) => (
          <span className="block text-right font-mono font-bold text-emerald-700 text-base">
            {formatCurrency(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: 'effective_from',
        header: 'Vigencia',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
            {String(getValue())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-center pr-2">Acciones</span>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="text-center space-x-1 whitespace-nowrap pr-2">
              <button
                type="button"
                onClick={() => handleOpenSlideover(s)}
                data-testid="union-scales-btn-edit"
                className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar Escala"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setScaleToDelete(s);
                  setIsDeleteModalOpen(true);
                }}
                data-testid="union-scales-btn-delete"
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar Escala"
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
    data: filteredScales,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Banner Explicativo CCT */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-[#1E5BB4] text-white p-2.5 rounded-xl shrink-0 mt-0.5">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1C30]">
              Escala Salarial Dinámica por Unidades Operadas (Convenio CCT)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Configura los rangos de vehículos operados en turnos de buque y el valor monetario asignado a la jornada para los puestos habilitados con plus vehicular (ej. Encargado). El sistema aplica silenciosamente el nivel salarial sin necesidad de tipeo manual en la carga operativa.
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Action Header (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search-scale">
              Buscar Rango o Monto
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-scale"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por unidades (ej: 1800) o importe..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-start md:justify-end">
            <button
              onClick={() => handleOpenSlideover()}
              data-testid="union-scales-btn-nueva-escala"
              className="w-full md:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm py-2.5 px-5 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Rango de Escala</span>
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium">Cargando escalas de bonificación CCT...</p>
          </div>
        ) : filteredScales.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron rangos de escala configurados.</p>
            <p className="text-sm mt-1 text-slate-400">
              Registra los rangos de vehículos y montos para el cálculo salarial de convenio.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-3 px-4 first:pl-6 last:pr-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap"
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
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap"
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

      {/* Slide-over (Alta / Edición de Rango de Escala) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingScale ? 'Editar Rango de Escala CCT' : 'Nuevo Rango de Escala CCT'}
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  Defina el tramo de unidades operadas y el monto monetario asociado.
                </p>
              </div>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 space-y-4">
              {formError && (
                <div className="bg-red-500/20 border border-white/30 text-white p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Rango Desde */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Unidades Operadas: Desde (Mínimo) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 0"
                  value={minVehicles}
                  onChange={(e) => setMinVehicles(e.target.value)}
                  data-testid="union-scales-input-min"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              {/* Rango Hasta */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Unidades Operadas: Hasta (Máximo) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 1499"
                  value={maxVehicles}
                  onChange={(e) => setMaxVehicles(e.target.value)}
                  data-testid="union-scales-input-max"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              {/* Monto de Bonificación */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Monto Monetario de Bonificación ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 88200.48"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  data-testid="union-scales-input-amount"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-mono font-bold focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
                <span className="text-[11px] text-white/80">
                  Importe que se asignará al registro del turno al alcanzar este nivel de vehículos.
                </span>
              </div>

              {/* Fecha de Vigencia */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Fecha de Vigencia *
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  data-testid="union-scales-input-effective-from"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="union-scales-btn-guardar"
                  className="px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar Rango'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {isDeleteModalOpen && scaleToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleting && setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-50 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Eliminar Rango de Escala</h3>
            </div>

            <p className="text-sm text-slate-600">
              ¿Está seguro de que desea eliminar el rango de{' '}
              <strong className="text-slate-900">
                {formatNumber(scaleToDelete.min_vehicles)} a {formatNumber(scaleToDelete.max_vehicles)} unidades
              </strong>{' '}
              (Monto: {formatCurrency(scaleToDelete.bonus_amount)}, Vigencia: {scaleToDelete.effective_from})?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => deleteMutation.mutate(scaleToDelete.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

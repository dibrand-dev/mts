'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Tag,
  Car,
  Truck,
  Utensils,
  CalendarCheck,
  Percent,
  Briefcase,
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
  getClientServiceRates,
  saveClientServiceRate,
  deleteClientServiceRate,
  EnrichedClientServiceRate,
  ClientRow,
} from '@/lib/services/rates';

interface ClientServiceRatesTabProps {
  clients: ClientRow[];
  onNotify: (msg: string) => void;
  onCountChange?: (count: number) => void;
}

interface ServicePreset {
  code: string;
  label: string;
  category: string;
  defaultDescription: string;
}

const SERVICE_PRESETS: ServicePreset[] = [
  {
    code: 'VEHICLE_NORMAL',
    label: 'Vehículo Operado en Horario Hábil',
    category: 'vehicle',
    defaultDescription: 'Vehículo Operado en Horario Hábil'
  },
  {
    code: 'VEHICLE_OVERTIME',
    label: 'Vehículo Operado en Horario Inhábil (+100%)',
    category: 'vehicle',
    defaultDescription: 'Vehículo Operado en Horario Inhábil (+100%)'
  },
  {
    code: 'SHUTTLE',
    label: 'Transporte Remis / Viajes Personal',
    category: 'transport',
    defaultDescription: 'Transporte Remis Delta Dock'
  },
  {
    code: 'SHUTTLE_TRAMO',
    label: 'Transporte Diario Personal (por tramo)',
    category: 'transport',
    defaultDescription: 'Transporte Diario Personal (por tramo)'
  },
  {
    code: 'SHUTTLE_CMP_TZ',
    label: 'Transporte Campana - Terminal Zárate',
    category: 'transport',
    defaultDescription: 'Transporte Viajes Campana - Terminal Zárate'
  },
  {
    code: 'MEAL',
    label: 'Vianda Personal Operativo',
    category: 'meal',
    defaultDescription: 'Vianda Personal Operativo'
  },
  {
    code: 'FIXED_MONTHLY_DEPOSIT_NACIONAL',
    label: 'Abono Mensual Depósito Nacional',
    category: 'fixed_fee',
    defaultDescription: 'Tarifa Mensual Bonificada Depósito Nacional'
  },
  {
    code: 'FIXED_MONTHLY_DEPOSIT_FISCAL',
    label: 'Abono Mensual Depósito Fiscal',
    category: 'fixed_fee',
    defaultDescription: 'Tarifa Mensual Bonificada Depósito Fiscal'
  },
  {
    code: 'COPARTICIPATION_FACTOR',
    label: 'Factor de Coparticipación Expo (0.10 = 10%)',
    category: 'split',
    defaultDescription: 'Factor de Coparticipación Plazoleta / Expo'
  },
  {
    code: 'PLUS_MARKUP',
    label: 'Coeficiente de Costos / Markup Plus (0.52 = 52%)',
    category: 'markup',
    defaultDescription: 'Coeficiente de Costos / Markup Plus'
  }
];

export function ClientServiceRatesTab({ clients, onNotify, onCountChange }: ClientServiceRatesTabProps) {
  const queryClient = useQueryClient();

  const {
    data: rates = [],
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.rates.services,
    queryFn: () => getClientServiceRates(),
  });

  useEffect(() => {
    if (onCountChange) {
      onCountChange(rates.length);
    }
  }, [rates.length, onCountChange]);

  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, clientFilter, categoryFilter]);

  // Slideover & Modal states
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<EnrichedClientServiceRate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<EnrichedClientServiceRate | null>(null);

  // Form Fields
  const [formClientId, setFormClientId] = useState('');
  const [selectedPresetCode, setSelectedPresetCode] = useState('');
  const [formServiceCode, setFormServiceCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('other');
  const [formRateValue, setFormRateValue] = useState('');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('');

  const saveMutation = useMutation({
    mutationFn: saveClientServiceRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.services });
      setIsSlideoverOpen(false);
      onNotify(
        editingRate
          ? 'Servicio complementario actualizado con éxito.'
          : 'Nuevo servicio complementario registrado correctamente.'
      );
    },
    onError: (err: any) => {
      console.error('Error saving client service rate:', err);
      setError(err.message || 'Error al guardar el servicio complementario.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientServiceRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.services });
      setIsDeleteModalOpen(false);
      setRateToDelete(null);
      onNotify('Servicio complementario eliminado con éxito.');
    },
    onError: (err: any) => {
      console.error('Error deleting client service rate:', err);
      setError(err.message || 'Error al eliminar el servicio complementario.');
    },
  });

  const saving = saveMutation.isPending;
  const deleting = deleteMutation.isPending;

  const handleOpenSlideover = (item?: EnrichedClientServiceRate) => {
    setError(null);
    if (item) {
      setEditingRate(item);
      setFormClientId(item.client_id);
      setFormServiceCode(item.service_code);
      setFormDescription(item.description);
      setFormRateValue(item.rate_value.toString());
      setFormEffectiveFrom(item.effective_from);
      
      const cat = item.metadata?.category || 'other';
      setFormCategory(cat);

      // Check if it matches a preset
      const presetMatch = SERVICE_PRESETS.find(p => p.code === item.service_code);
      setSelectedPresetCode(presetMatch ? presetMatch.code : 'CUSTOM');
    } else {
      setEditingRate(null);
      setFormClientId(clients[0]?.id || '');
      setSelectedPresetCode('');
      setFormServiceCode('');
      setFormDescription('');
      setFormCategory('transport');
      setFormRateValue('');
      const today = new Date().toISOString().split('T')[0];
      setFormEffectiveFrom(today);
    }
    setIsSlideoverOpen(true);
  };

  const handlePresetSelect = (code: string) => {
    setSelectedPresetCode(code);
    if (code === 'CUSTOM' || !code) {
      return;
    }
    const preset = SERVICE_PRESETS.find(p => p.code === code);
    if (preset) {
      setFormServiceCode(preset.code);
      setFormDescription(preset.defaultDescription);
      setFormCategory(preset.category);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formClientId) {
      setError('Seleccione un cliente.');
      return;
    }
    if (!formServiceCode.trim()) {
      setError('Ingrese un código de servicio válido (ej. SHUTTLE, MEAL).');
      return;
    }
    if (!formDescription.trim()) {
      setError('Ingrese la descripción del servicio.');
      return;
    }
    if (!formEffectiveFrom) {
      setError('Seleccione la fecha de vigencia.');
      return;
    }

    const numericValue = parseFloat(formRateValue);
    if (isNaN(numericValue) || numericValue < 0) {
      setError('Ingrese un valor monetario o factor numérico válido mayor o igual a 0.');
      return;
    }

    saveMutation.mutate({
      id: editingRate?.id,
      client_id: formClientId,
      service_code: formServiceCode.trim().toUpperCase(),
      description: formDescription.trim(),
      rate_value: numericValue,
      effective_from: formEffectiveFrom,
      metadata: {
        category: formCategory,
        ...(editingRate?.metadata || {}),
      },
    });
  };

  const handleOpenDeleteModal = (item: EnrichedClientServiceRate) => {
    setRateToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!rateToDelete) return;
    deleteMutation.mutate(rateToDelete.id);
  };

  // Filtered rates list
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      const clientName = item.client?.company_name || '';
      const matchSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.service_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClient = !clientFilter || item.client_id === clientFilter;
      const cat = item.metadata?.category || 'other';
      const matchCategory = !categoryFilter || cat === categoryFilter;

      return matchSearch && matchClient && matchCategory;
    });
  }, [rates, searchTerm, clientFilter, categoryFilter]);

  const formatValueDisplay = (val: number, cat?: string) => {
    if (cat === 'split' || cat === 'markup') {
      if (val <= 1) {
        return `${(val * 100).toFixed(0)}% (${val.toFixed(2)})`;
      }
      return `${val.toFixed(2)}x`;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'vehicle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Car className="h-3 w-3" />
            Vehículos
          </span>
        );
      case 'transport':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Truck className="h-3 w-3" />
            Traslados / Remises
          </span>
        );
      case 'meal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Utensils className="h-3 w-3" />
            Viandas
          </span>
        );
      case 'fixed_fee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CalendarCheck className="h-3 w-3" />
            Abono Fijo
          </span>
        );
      case 'split':
      case 'commission':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Percent className="h-3 w-3" />
            Coparticipación
          </span>
        );
      case 'markup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200">
            <Tag className="h-3 w-3" />
            Markup Plus
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Briefcase className="h-3 w-3" />
            Otro Servicio
          </span>
        );
    }
  };

  const columns = useMemo<ColumnDef<EnrichedClientServiceRate>[]>(
    () => [
      {
        id: 'client_name',
        header: 'Cliente',
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap">
            {row.original.client?.company_name || 'Cliente no asignado'}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Categoría',
        cell: ({ row }) => getCategoryBadge(row.original.metadata?.category),
      },
      {
        accessorKey: 'service_code',
        header: 'Código',
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-xs text-slate-700 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded text-[#0F2547] border border-slate-200">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Concepto / Descripción',
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-800">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: 'rate_value',
        header: () => <span className="block text-right">Tarifa / Valor</span>,
        cell: ({ row }) => (
          <span className="block text-right font-mono font-bold text-[#0B1C30] whitespace-nowrap">
            {formatValueDisplay(row.original.rate_value, row.original.metadata?.category)}
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
          const item = row.original;
          return (
            <div className="text-center space-x-1 whitespace-nowrap pr-2">
              <button
                onClick={() => handleOpenSlideover(item)}
                className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar Servicio"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleOpenDeleteModal(item)}
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar Servicio"
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
    data: filteredRates,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar (Sky Blue Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search-service">
              Buscar Servicio
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-service"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cliente, código o descripción..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Client Filter Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="filter-client">
              Cliente
            </label>
            <div className="relative w-full">
              <select
                id="filter-client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="filter-cat">
              Categoría de Servicio
            </label>
            <div className="relative w-full">
              <select
                id="filter-cat"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todas las Categorías</option>
                <option value="vehicle">Vehículos de Embarque</option>
                <option value="transport">Traslados y Remises</option>
                <option value="meal">Viandas de Personal</option>
                <option value="fixed_fee">Abonos Fijos Mensuales</option>
                <option value="split">Coparticipación Plazoleta</option>
                <option value="markup">Markups y Coeficientes</option>
                <option value="other">Otros Conceptos</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-start md:justify-end">
            <button
              onClick={() => handleOpenSlideover()}
              className="w-full md:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm py-2.5 px-5 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Servicio</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium">Cargando servicios complementarios...</p>
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron servicios complementarios.</p>
            <p className="text-sm mt-1 text-slate-400">
              {searchTerm || clientFilter || categoryFilter
                ? 'Pruebe modificando los filtros aplicados.'
                : 'Configure nuevos servicios complementarios (remises, viandas, abonos o vehículos).'}
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

      {/* Slide-over (Alta / Edición de Servicio Complementario) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingRate ? 'Editar Servicio Complementario' : 'Nuevo Servicio Complementario'}
              </h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-white/30 text-white p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Cliente *</label>
                <select
                  value={formClientId}
                  disabled={!!editingRate}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preajustes sugeridos (sólo en creación) */}
              {!editingRate && (
                <div className="flex flex-col gap-1 bg-white/10 p-3 rounded-lg border border-white/20">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Plantilla Rápida de Servicio
                  </label>
                  <select
                    value={selectedPresetCode}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#0F2547] rounded text-xs text-[#0B1C30] focus:outline-none"
                  >
                    <option value="">-- Seleccionar concepto común o definir personalizado --</option>
                    {SERVICE_PRESETS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.label}
                      </option>
                    ))}
                    <option value="CUSTOM">Código personalizado libre...</option>
                  </select>
                </div>
              )}

              {/* Categoría */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Categoría *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="transport">Traslados y Remises (SHUTTLE)</option>
                  <option value="vehicle">Vehículos de Embarque (VEHICLE)</option>
                  <option value="meal">Viandas de Personal (MEAL)</option>
                  <option value="fixed_fee">Abono Fijo Mensual / Quincenal</option>
                  <option value="split">Coparticipación / Split</option>
                  <option value="markup">Markup / Coeficiente</option>
                  <option value="other">Otro Servicio Complementario</option>
                </select>
              </div>

              {/* Código de Servicio */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Código de Servicio * (Identificador único en mayúsculas)
                </label>
                <input
                  type="text"
                  placeholder="ej. SHUTTLE, MEAL, VEHICLE_NORMAL"
                  value={formServiceCode}
                  disabled={!!editingRate}
                  onChange={(e) => setFormServiceCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm font-mono text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Descripción o Concepto Facturable *
                </label>
                <input
                  type="text"
                  placeholder="ej. Transporte Remis Delta Dock"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Tarifa / Valor */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  {formCategory === 'split' || formCategory === 'markup'
                    ? 'Factor o Coeficiente (ej. 0.10 para 10% o 0.52 para 52%) *'
                    : 'Tarifa o Valor Unitario ($) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formCategory === 'split' ? '0.10' : '0.00'}
                  value={formRateValue}
                  onChange={(e) => setFormRateValue(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Fecha de Vigencia */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha de Vigencia *</label>
                <input
                  type="date"
                  value={formEffectiveFrom}
                  disabled={!!editingRate}
                  onChange={(e) => setFormEffectiveFrom(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
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
                  className="px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {isDeleteModalOpen && rateToDelete && (
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
              <h3 className="text-lg font-bold text-slate-900">Eliminar Servicio Complementario</h3>
            </div>

            <p className="text-sm text-slate-600">
              ¿Está seguro de que desea eliminar el servicio complementario{' '}
              <strong className="text-slate-900">
                [{rateToDelete.service_code}] {rateToDelete.description}
              </strong>{' '}
              del cliente <strong className="text-slate-900">{rateToDelete.client?.company_name}</strong>?
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
                onClick={confirmDelete}
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


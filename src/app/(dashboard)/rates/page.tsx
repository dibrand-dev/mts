'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Clock,
  Layers,
  Briefcase
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
  getRates,
  getClients,
  getPositions,
  upsertClientRates,
  deleteClientRates,
  CommercialRateGroup,
} from '@/lib/services/rates';
import { ClientServiceRatesTab } from '@/components/rates/ClientServiceRatesTab';

export default function RatesPage() {
  const queryClient = useQueryClient();

  const {
    data: mainData,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.rates.commercial,
    queryFn: async () => {
      const [ratesData, clientsData, positionsData] = await Promise.all([
        getRates(),
        getClients(),
        getPositions(),
      ]);
      return {
        rates: ratesData,
        clients: clientsData,
        positions: positionsData,
      };
    },
  });

  const rates = mainData?.rates || [];
  const clients = mainData?.clients || [];
  const positions = mainData?.positions || [];

  // Active Tab: hourly vs services
  const [activeTab, setActiveTab] = useState<'hourly' | 'services'>('hourly');
  const [servicesCount, setServicesCount] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDueFilter, setPaymentDueFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, paymentDueFilter, positionFilter]);

  // Slide-over state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CommercialRateGroup | null>(null);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [rateRegular, setRateRegular] = useState<string>('');
  const [rateOvertime50, setRateOvertime50] = useState<string>('');
  const [rateOvertime100, setRateOvertime100] = useState<string>('');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<CommercialRateGroup | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const saveMutation = useMutation({
    mutationFn: upsertClientRates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.commercial });
      setIsSlideoverOpen(false);
      showNotification(
        editingGroup
          ? 'Tarifa actualizada correctamente.'
          : 'Nueva tarifa registrada correctamente.'
      );
    },
    onError: (err: any) => {
      console.error('Error saving rate:', err);
      setError(err.message || 'Error al guardar la tarifa.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ clientId, positionId, effectiveFrom }: { clientId: string; positionId: string; effectiveFrom: string }) =>
      deleteClientRates(clientId, positionId, effectiveFrom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rates.commercial });
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      showNotification('Tarifa eliminada con éxito.');
    },
    onError: (err: any) => {
      console.error('Error deleting rate:', err);
      setError(err.message || 'Error al eliminar la tarifa.');
    },
  });

  const saving = saveMutation.isPending;
  const deleting = deleteMutation.isPending;

  const handleOpenSlideover = (group?: CommercialRateGroup) => {
    setError(null);
    if (group) {
      setEditingGroup(group);
      setClientId(group.client_id);
      setPositionId(group.position_id);
      setEffectiveFrom(group.effective_from);
      setRateRegular(group.rate_regular.toString());
      setRateOvertime50(group.rate_overtime_50.toString());
      setRateOvertime100(group.rate_overtime_100.toString());
      setAutoCalculate(false);
    } else {
      setEditingGroup(null);
      setClientId(clients[0]?.id || '');
      setPositionId(positions[0]?.id || '');
      const today = new Date().toISOString().split('T')[0];
      setEffectiveFrom(today);
      setRateRegular('');
      setRateOvertime50('');
      setRateOvertime100('');
      setAutoCalculate(true);
    }
    setIsSlideoverOpen(true);
  };

  const handleRegularRateChange = (val: string) => {
    setRateRegular(val);
    if (autoCalculate) {
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && numVal >= 0) {
        setRateOvertime50((numVal * 1.5).toFixed(2));
        setRateOvertime100((numVal * 2.0).toFixed(2));
      } else {
        setRateOvertime50('');
        setRateOvertime100('');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError('Seleccione un cliente.');
      return;
    }
    if (!positionId) {
      setError('Seleccione un puesto.');
      return;
    }
    if (!effectiveFrom) {
      setError('Ingrese la fecha de vigencia.');
      return;
    }

    const reg = parseFloat(rateRegular);
    const ot50 = parseFloat(rateOvertime50);
    const ot100 = parseFloat(rateOvertime100);

    if (isNaN(reg) || reg < 0) {
      setError('Ingrese un valor válido para el valor de hora normal.');
      return;
    }
    if (isNaN(ot50) || ot50 < 0) {
      setError('Ingrese un valor válido para el valor de hora al 50%.');
      return;
    }
    if (isNaN(ot100) || ot100 < 0) {
      setError('Ingrese un valor válido para el valor de hora al 100%.');
      return;
    }

    saveMutation.mutate({
      client_id: clientId,
      position_id: positionId,
      effective_from: effectiveFrom,
      rate_regular: reg,
      rate_overtime_50: ot50,
      rate_overtime_100: ot100,
    });
  };

  const handleOpenDeleteModal = (group: CommercialRateGroup) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const ConfirmDelete = () => {
    if (!groupToDelete) return;
    deleteMutation.mutate({
      clientId: groupToDelete.client_id,
      positionId: groupToDelete.position_id,
      effectiveFrom: groupToDelete.effective_from,
    });
  };

  // Filtered rates list
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      const matchSearch =
        item.client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPaymentDue =
        !paymentDueFilter || item.client.payment_due_days.toString() === paymentDueFilter;

      const matchPosition =
        !positionFilter || item.position_id === positionFilter;

      return matchSearch && matchPaymentDue && matchPosition;
    });
  }, [rates, searchTerm, paymentDueFilter, positionFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const columns = useMemo<ColumnDef<CommercialRateGroup>[]>(
    () => [
      {
        accessorKey: 'client.company_name',
        header: 'Cliente',
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.client.company_name}</span>
        ),
      },
      {
        accessorKey: 'position.name',
        header: 'Puesto / Servicio',
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">{row.original.position.name}</span>
        ),
      },
      {
        accessorKey: 'rate_regular',
        header: () => <span className="block text-right">Valor Hora Norm.</span>,
        cell: ({ getValue }) => (
          <span className="block text-right font-mono font-medium">
            {formatCurrency(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: 'rate_overtime_50',
        header: () => <span className="block text-right">Valor Hora 50%</span>,
        cell: ({ getValue }) => (
          <span className="block text-right font-mono text-slate-600">
            {formatCurrency(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: 'rate_overtime_100',
        header: () => <span className="block text-right">Valor Hora 100%</span>,
        cell: ({ getValue }) => (
          <span className="block text-right font-mono font-bold text-[#0B1C30]">
            {formatCurrency(Number(getValue()))}
          </span>
        ),
      },
      {
        id: 'payment_due',
        header: 'Cond. Pago',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 font-mono">
            {row.original.client.payment_due_days} Días
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
          const group = row.original;
          return (
            <div className="text-center space-x-1 whitespace-nowrap pr-2">
              <button
                onClick={() => handleOpenSlideover(group)}
                className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar Tarifa"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleOpenDeleteModal(group)}
                className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar Tarifa"
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
    <div className="w-full max-w-[1600px] mx-auto space-y-6 relative pb-10">
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && !isSlideoverOpen && !isDeleteModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Tarifario Comercial</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión y configuración de tarifas base horarias y servicios complementarios para clientes.</p>
        </div>
        <Link
          href="/positions"
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Briefcase className="h-4 w-4 text-[#1E5BB4]" />
          <span>Gestionar Puestos de Trabajo</span>
        </Link>
      </header>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('hourly')}
          className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'hourly'
              ? 'border-[#1E5BB4] text-[#1E5BB4]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Tarifas Horarias por Puesto</span>
          <span
            className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'hourly'
                ? 'bg-sky-100 text-sky-800 font-bold'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {rates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'services'
              ? 'border-[#1E5BB4] text-[#1E5BB4]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Servicios Complementarios</span>
          {servicesCount !== null && (
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'services'
                  ? 'bg-sky-100 text-sky-800 font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {servicesCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'services' ? (
        <ClientServiceRatesTab
          clients={clients}
          onNotify={showNotification}
          onCountChange={setServicesCount}
        />
      ) : (
        <>
          {/* Filters Section (Sky Blue B2B Card) */}
          <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente o puesto..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Position Filter Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="pos-filter">Puesto Operativo</label>
            <div className="relative w-full">
              <select
                id="pos-filter"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Puestos</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Dropdown Plazo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="plazo">Condición de Pago</label>
            <div className="relative w-full">
              <select
                id="plazo"
                value={paymentDueFilter}
                onChange={(e) => setPaymentDueFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Plazos</option>
                <option value="7">7 Días</option>
                <option value="15">15 Días</option>
                <option value="30">30 Días</option>
                <option value="60">60 Días</option>
                <option value="90">90 Días</option>
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
              <span>Nueva Tarifa</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium">Cargando tarifario comercial...</p>
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron tarifas registradas.</p>
            <p className="text-sm mt-1 text-slate-400">Intente modificar los filtros o registre una nueva tarifa comercial.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
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

      {/* Slide-over (Alta / Edición de Tarifa) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingGroup ? 'Editar Tarifa Comercial' : 'Nueva Tarifa Comercial'}
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
                  value={clientId}
                  disabled={!!editingGroup}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.payment_due_days} Días)
                    </option>
                  ))}
                </select>
              </div>

              {/* Puesto */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puesto / Servicio *</label>
                <select
                  value={positionId}
                  disabled={!!editingGroup}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
                >
                  <option value="">Seleccionar Puesto...</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha de Vigencia */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha de Vigencia *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={effectiveFrom}
                    disabled={!!editingGroup}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] disabled:bg-slate-100 disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Checkbox auto-calcular */}
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="autoCalculate"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  className="h-4 w-4 text-[#1E5BB4] rounded border-[#0F2547]"
                />
                <label htmlFor="autoCalculate" className="text-xs text-white cursor-pointer select-none">
                  Calcular automáticamente horas 50% (1.5x) y 100% (2.0x)
                </label>
              </div>

              {/* Valor Hora Normal */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Valor Hora Normal ($) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={rateRegular}
                    onChange={(e) => handleRegularRateChange(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              {/* Valor Hora 50% */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Valor Hora 50% ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={rateOvertime50}
                  onChange={(e) => setRateOvertime50(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Valor Hora 100% */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Valor Hora 100% ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={rateOvertime100}
                  onChange={(e) => setRateOvertime100(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
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
                  <span>{saving ? 'Guardando...' : 'Guardar Tarifa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {isDeleteModalOpen && groupToDelete && (
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
              <h3 className="text-lg font-bold text-slate-900">Eliminar Tarifa Comercial</h3>
            </div>

            <p className="text-sm text-slate-600">
              ¿Está seguro de que desea eliminar la tarifa para el cliente{' '}
              <strong className="text-slate-900">{groupToDelete.client.company_name}</strong> en el puesto{' '}
              <strong className="text-slate-900">{groupToDelete.position.name}</strong> (Vigencia:{' '}
              {groupToDelete.effective_from})?
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
                onClick={ConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

interface CashMovement {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso';
  area: string;
  detail: string;
  amount: number;
}

const INITIAL_MOVEMENTS: CashMovement[] = [
  {
    id: 'MOV-001',
    date: '2026-10-15',
    type: 'ingreso',
    area: 'Cobros',
    detail: 'Factura #4589 - Cliente A',
    amount: 12500,
  },
  {
    id: 'MOV-002',
    date: '2026-10-14',
    type: 'egreso',
    area: 'Impuestos',
    detail: 'Pago IVA Septiembre',
    amount: 4200,
  },
  {
    id: 'MOV-003',
    date: '2026-10-12',
    type: 'egreso',
    area: 'Sueldos',
    detail: 'Nómina Quincenal',
    amount: 28400,
  },
  {
    id: 'MOV-004',
    date: '2026-10-10',
    type: 'ingreso',
    area: 'Cobros',
    detail: 'Factura #4588 - Cliente B',
    amount: 8900,
  },
  {
    id: 'MOV-005',
    date: '2026-10-08',
    type: 'egreso',
    area: 'Proveedores',
    detail: 'Mantenimiento Flota',
    amount: 5150,
  },
];

export default function CashFlowPage() {
  const [movements, setMovements] = useState<CashMovement[]>(INITIAL_MOVEMENTS);
  const [initialBaseBalance] = useState<number>(140000);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Slideover & Form state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [formArea, setFormArea] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (fromDate && m.date < fromDate) return false;
      if (toDate && m.date > toDate) return false;
      if (selectedArea && selectedArea !== 'Todas' && m.area.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [movements, fromDate, toDate, selectedArea]);

  // Running balance calculation
  const movementsWithBalance = useMemo(() => {
    let current = initialBaseBalance;
    // Calculate reverse cumulative or progressive balance
    return filteredMovements.map((m) => {
      const effect = m.type === 'ingreso' ? m.amount : -m.amount;
      current += effect;
      return {
        ...m,
        balanceAfter: current,
      };
    });
  }, [filteredMovements, initialBaseBalance]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('ingreso');
    setFormArea('Cobros');
    setFormDetail('');
    setFormAmount('');
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (m: CashMovement) => {
    setEditingId(m.id);
    setFormDate(m.date);
    setFormType(m.type);
    setFormArea(m.area);
    setFormDetail(m.detail);
    setFormAmount(String(m.amount));
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Deseas eliminar este movimiento de caja?')) return;
    setMovements((prev) => prev.filter((m) => m.id !== id));
    setNotification({ type: 'success', message: 'Movimiento eliminado correctamente.' });
    setTimeout(() => setNotification(null), 3000);
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

    if (editingId) {
      setMovements((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? {
                ...m,
                date: formDate,
                type: formType,
                area: formArea,
                detail: formDetail.trim(),
                amount: parsedAmount,
              }
            : m
        )
      );
      setNotification({ type: 'success', message: 'Movimiento actualizado correctamente.' });
    } else {
      const newMovement: CashMovement = {
        id: `MOV-${String(movements.length + 1).padStart(3, '0')}`,
        date: formDate,
        type: formType,
        area: formArea,
        detail: formDetail.trim(),
        amount: parsedAmount,
      };
      setMovements((prev) => [newMovement, ...prev]);
      setNotification({ type: 'success', message: 'Nuevo movimiento guardado exitosamente.' });
    }

    setIsSlideoverOpen(false);
    setTimeout(() => setNotification(null), 3500);
  };

  const formatCurrency = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Flujo de Caja</h1>
          <p className="text-slate-500 text-sm mt-1">Control de ingresos, egresos y saldo operativo</p>
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

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Fecha Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Fecha Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Área Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white">Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todas</option>
              <option value="Sueldos">Sueldos</option>
              <option value="Impuestos">Impuestos</option>
              <option value="Cobros">Cobros</option>
              <option value="Proveedores">Proveedores</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleOpenNew}
              className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-5 py-2.5 text-sm shadow-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap pl-6">Fecha</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Área</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider">Detalle</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Importe</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Saldo</th>
                <th className="px-4 py-3 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-center whitespace-nowrap pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              {movementsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron movimientos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                movementsWithBalance.map((m, index) => {
                  const isIngreso = m.type === 'ingreso';
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                    >
                      <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-slate-600">
                        {m.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isIngreso
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isIngreso ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-700">{m.area}</td>
                      <td className="px-4 py-3 font-medium text-[#0B1C30]">{m.detail}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                          isIngreso ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isIngreso ? `+${formatCurrency(m.amount)}` : `-${formatCurrency(m.amount)}`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#0B1C30] whitespace-nowrap">
                        {formatCurrency(m.balanceAfter)}
                      </td>
                      <td className="px-4 py-3 pr-6 text-center whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-xs sm:text-sm bg-slate-50/50">
          <span>Mostrando 1 a {movementsWithBalance.length} de {movements.length} registros</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1" disabled>
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Slideover (Overlay + Panel) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSlideoverOpen(false)}
          />

          {/* Slideover Panel (Sky Blue matching Stitch) */}
          <div className="relative w-screen max-w-md bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="font-bold text-lg sm:text-xl text-white">
                {editingId ? 'Editar Movimiento' : 'Ingresar Nuevo Movimiento'}
              </h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
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
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Tipo</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'ingreso' | 'egreso')}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="ingreso">Ingreso (+)</option>
                  <option value="egreso">Egreso (-)</option>
                </select>
              </div>

              {/* Área */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Área</label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="">Seleccionar área...</option>
                  <option value="Cobros">Cobros</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Proveedores">Proveedores</option>
                  <option value="Impuestos">Impuestos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {/* Detalle */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Detalle</label>
                <input
                  type="text"
                  placeholder="Ej: Factura #1234, Nómina mensual..."
                  value={formDetail}
                  onChange={(e) => setFormDetail(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
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
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-white border-2 border-[#0F2547] rounded-lg pl-8 pr-4 py-2.5 text-sm font-mono text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              {/* Slideover Footer */}
              <div className="pt-6 border-t border-[#0F2547]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#0F2547] bg-white border-2 border-transparent hover:border-[#0F2547] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


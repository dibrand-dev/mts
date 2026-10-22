'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Ship,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { ClientRow } from '@/lib/services/clients';
import { getAllStrategies } from '@/lib/services/invoicing';
import {
  getClientOperations,
  createClientOperation,
  deleteClientOperation,
  ClientOperationRow,
} from '@/lib/services/client-operations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientRow[];
  onOperationsChanged?: () => void;
}

export function ProformaTypesAndOperationsModal({
  isOpen,
  onClose,
  clients,
  onOperationsChanged,
}: Props) {
  const strategies = getAllStrategies();
  const [operations, setOperations] = useState<ClientOperationRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newOpName, setNewOpName] = useState('');
  const [newOpType, setNewOpType] = useState<'vessel' | 'yard' | 'deposit' | 'general'>('vessel');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOps();
      if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [isOpen, clients]);

  const loadOps = async () => {
    try {
      setLoading(true);
      const data = await getClientOperations();
      setOperations(data);
    } catch (e) {
      console.error('Error loading client operations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newOpName.trim()) return;
    try {
      setSaving(true);
      await createClientOperation({
        client_id: selectedClientId,
        name: newOpName.trim().toUpperCase(),
        operation_type: newOpType,
      });
      setNewOpName('');
      await loadOps();
      onOperationsChanged?.();
    } catch (err: any) {
      alert(`Error al guardar operación: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      await deleteClientOperation(id);
      await loadOps();
      onOperationsChanged?.();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const opTypeBadges: Record<string, { label: string; color: string }> = {
    vessel: { label: 'BUQUE', color: 'bg-sky-100 text-[#1E5BB4] border-sky-300' },
    yard: { label: 'PLAZOLETA FISCAL', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    deposit: { label: 'DEPÓSITO DELTA DOCK', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    general: { label: 'INCIDENCIA PLUS / GENERAL', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#0B1C30] text-white flex items-center justify-between border-b border-[#0F2547]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E5BB4] rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Catálogo de Tipos de Proforma, Buques y Depósitos
              </h3>
              <p className="text-xs text-sky-200">
                Administración de modelos oficiales de Proforma Excel y operaciones habilitadas por cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Modelos Oficiales de Plantillas Excel */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1C30] flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-[#107C41]" />
              <span>1. Modelos Oficiales de Tipo de Proforma (Plantillas Excel Activas)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.map((strat) => (
                <div
                  key={strat.type}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-extrabold text-[#0B1C30]">{strat.label}</div>
                    <p className="text-[11px] text-slate-600 leading-snug">{strat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Alta de Buques / Depósitos / Servicios para Proformas y Carga Diaria */}
          <div className="bg-[#0EA5E9] rounded-xl p-5 text-white space-y-4 shadow-xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>2. Cargar Nuevo Buque, Depósito o Servicio Operativo</span>
            </h4>
            <form onSubmit={handleAddOperation} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[11px] font-bold uppercase block">Cliente *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-bold"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-bold uppercase block">Categoría / Tipo *</label>
                <select
                  value={newOpType}
                  onChange={(e) => setNewOpType(e.target.value as any)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-bold"
                >
                  <option value="vessel">BUQUE</option>
                  <option value="yard">PLAZOLETA FISCAL</option>
                  <option value="deposit">DEPÓSITO (NACIONAL / FISCAL / ARROZ)</option>
                  <option value="general">INCIDENCIA PLUS / OTRO</option>
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-bold uppercase block">Nombre (Buque / Depósito) *</label>
                <input
                  type="text"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value.toUpperCase())}
                  placeholder="Ej. GOODWOOD, DEPOSITO FISCAL..."
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-bold uppercase"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving || !newOpName.trim()}
                  className="w-full bg-[#0B1C30] hover:bg-[#1E5BB4] text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{saving ? '...' : 'Agregar'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Listado Actual Cargado */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Listado Activo de Operaciones, Buques y Depósitos ({operations.length})
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-500">Cargando listado...</div>
              ) : operations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No hay operaciones registradas.</div>
              ) : (
                operations.map((op) => {
                  const cl = clients.find((c) => c.id === op.client_id);
                  const badge = opTypeBadges[op.operation_type] || opTypeBadges.general;
                  return (
                    <div key={op.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="font-bold text-[#0B1C30]">{op.name}</span>
                        <span className="text-slate-500">• {cl?.company_name || 'Cliente'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteOperation(op.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                        title="Eliminar del listado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


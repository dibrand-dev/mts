'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Building2,
  Check,
} from 'lucide-react';
import { getClients, ClientRow } from '@/lib/services/clients';
import {
  getInvoicingRecords,
  createTaxInvoiceService,
  updateProformaStatusService,
  deleteProformaService,
  getProformaWithDetails,
  InvoicingRecord,
} from '@/lib/services/invoicing';
import { ProformaDetailModal } from '@/components/invoicing/ProformaDetailModal';
import { CreateProformaSlideover } from '@/components/invoicing/CreateProformaSlideover';

const PROFORMA_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  vessel: { label: 'Buque Ro-Ro', color: 'bg-sky-50 text-[#1E5BB4] border-sky-200' },
  fiscal_yard: { label: 'Plazoleta Fiscal', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  fixed_deposit: { label: 'Abono Depósito', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  shared_expo: { label: 'Coparticipada (10%)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  standard: { label: 'Servicios Directos', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export default function InvoicingPage() {
  const [records, setRecords] = useState<InvoicingRecord[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Slide-overs
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<InvoicingRecord | null>(null);
  const [selectedProformaDetails, setSelectedProformaDetails] = useState<InvoicingRecord | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, clientsData] = await Promise.all([
        getInvoicingRecords(),
        getClients(),
      ]);
      setRecords(recordsData);
      setClients(clientsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailsModal = async (record: InvoicingRecord) => {
    try {
      setIsDetailModalOpen(true);
      const fullProforma = await getProformaWithDetails(record.id);
      setSelectedProformaDetails(fullProforma || record);
    } catch (err: any) {
      console.error('Error fetching proforma details:', err);
      setSelectedProformaDetails(record);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProforma || !invoiceNumberInput.trim()) {
      alert('Por favor ingresa un número de factura válido.');
      return;
    }

    setIsSubmittingInvoice(true);
    try {
      await createTaxInvoiceService({
        proforma_id: selectedProforma.id,
        invoice_number: invoiceNumberInput.trim(),
        invoiced_amount: selectedProforma.total,
        status: 'pending',
        pdf_storage_path: '',
        invoice_date: new Date().toISOString().split('T')[0],
      });

      setIsInvoiceModalOpen(false);
      setSelectedProforma(null);
      setInvoiceNumberInput('');
      await loadData();
    } catch (err: any) {
      alert(`Error al emitir factura: ${err.message}`);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleStatusChange = async (record: InvoicingRecord, newStatus: InvoicingRecord['status']) => {
    try {
      await updateProformaStatusService(record.id, newStatus);
      if (selectedProformaDetails && selectedProformaDetails.id === record.id) {
        setSelectedProformaDetails({
          ...selectedProformaDetails,
          status: newStatus,
        });
      }
      await loadData();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const handleDeleteProforma = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta proforma/factura?')) return;
    try {
      await deleteProformaService(id);
      await loadData();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  // Filtered records logic
  const filteredRecords = records.filter((rec) => {
    const matchesQuery =
      rec.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.proforma_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.invoice?.invoice_number && rec.invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = !statusFilter || rec.status === statusFilter;
    const matchesFromDate = !fromDateFilter || rec.issue_date >= fromDateFilter;
    const matchesToDate = !toDateFilter || rec.issue_date <= toDateFilter;

    return matchesQuery && matchesStatus && matchesFromDate && matchesToDate;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 relative pb-10">
      {/* Header & Action */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Facturación</h1>
          <p className="text-slate-500 text-sm mt-1">
            Motor extensible de proformas comerciales por cliente según horas registradas y tarifario comercial.
          </p>
        </div>
        <button
          onClick={() => setIsSlideoverOpen(true)}
          className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          type="button"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Proforma Comercial</span>
        </button>
      </header>

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters Section (Sky Blue B2B Card) */}
      <section className="bg-[#0EA5E9] rounded-xl p-4 sm:p-6 shadow-sm text-white space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Filtros Búsqueda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Buscador */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Buscador</label>
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cliente, Nro. Proforma, Factura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Fecha Desde</label>
            <input
              type="date"
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Fecha Hasta</label>
            <input
              type="date"
              value={toDateFilter}
              onChange={(e) => setToDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todos los Estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="approved">Aprobada</option>
              <option value="invoiced">Facturada</option>
              <option value="paid">Cobrada</option>
              <option value="overdue">Vencida</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Cargando registros de facturación...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No se encontraron proformas ni facturas.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6">Cliente y Modelo</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Nro. Proforma</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Nro. Factura</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Subtotal</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Total (con IVA)</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-center pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredRecords.map((rec) => {
                  const typeBadge = PROFORMA_TYPE_BADGES[rec.proforma_type] || {
                    label: rec.proforma_type || 'General',
                    color: 'bg-slate-100 text-slate-700 border-slate-300',
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 pl-6 font-semibold">
                        <div>{rec.client_name}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded border ${typeBadge.color}`}>
                            {typeBadge.label}
                          </span>
                          {rec.vessel_name && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E5BB4] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              🚢 {rec.vessel_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{rec.proforma_number}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-[#1E5BB4]">
                        {rec.invoice?.invoice_number || <span className="text-slate-400 font-normal">Sin Factura</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{rec.fortnight_period}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500">
                        $ {rec.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#0B1C30]">
                        $ {rec.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {rec.status === 'paid' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Cobrada
                          </span>
                        )}
                        {rec.status === 'invoiced' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 items-center gap-1">
                            <FileText className="h-3 w-3" /> Facturada
                          </span>
                        )}
                        {rec.status === 'approved' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            Aprobada
                          </span>
                        )}
                        {rec.status === 'sent' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-sky-100 text-sky-800">
                            Enviada
                          </span>
                        )}
                        {rec.status === 'draft' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-slate-100 text-slate-700 items-center gap-1">
                            <Clock className="h-3 w-3" /> Borrador
                          </span>
                        )}
                        {rec.status === 'overdue' && (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-rose-100 text-rose-800 items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Vencida
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 pr-6 text-center space-x-1 whitespace-nowrap">
                        {/* Ver Desglose */}
                        <button
                          onClick={() => handleOpenDetailsModal(rec)}
                          className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-blue-50 transition-colors inline-block cursor-pointer"
                          title="Ver Desglose de Cálculo"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {!rec.invoice && (
                          <button
                            onClick={() => {
                              setSelectedProforma(rec);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="bg-[#1E5BB4] hover:bg-[#004392] text-white text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                            title="Emitir Factura Fiscal"
                          >
                            Facturar
                          </button>
                        )}
                        {rec.status !== 'paid' && (
                          <button
                            onClick={() => handleStatusChange(rec, 'paid')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                            title="Marcar como Cobrada"
                          >
                            Cobrada
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProforma(rec.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors inline-block cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Desglose Polimórfico */}
      <ProformaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        proforma={selectedProformaDetails}
        onStatusChange={handleStatusChange}
        onInvoiceClick={(rec) => {
          setSelectedProforma(rec);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* Slide-over: Alta de Proforma */}
      <CreateProformaSlideover
        isOpen={isSlideoverOpen}
        onClose={() => setIsSlideoverOpen(false)}
        clients={clients}
        onProformaCreated={loadData}
      />

      {/* Modal: Emitir Factura Fiscal */}
      {isInvoiceModalOpen && selectedProforma && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-[#0B1C30] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1E5BB4]" />
                Emitir Factura Fiscal (ARCA)
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Proforma: <strong className="text-[#0B1C30]">{selectedProforma.proforma_number}</strong> ({selectedProforma.client_name})
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between font-medium">
                <span>Importe Proforma:</span>
                <span className="font-mono text-slate-800">${selectedProforma.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Número de Factura Oficial *
                </label>
                <input
                  type="text"
                  placeholder="Ej: A-0001-00004523"
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4] font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoice || !invoiceNumberInput.trim()}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#1E5BB4] hover:bg-[#004392] disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmittingInvoice ? 'Registrando...' : 'Emitir Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

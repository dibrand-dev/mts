'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, X, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getClients, ClientRow } from '@/lib/services/clients';
import {
  getInvoicingRecords,
  createProformaService,
  createTaxInvoiceService,
  updateProformaStatusService,
  deleteProformaService,
  InvoicingRecord
} from '@/lib/services/invoicing';

export default function InvoicingPage() {
  const [records, setRecords] = useState<InvoicingRecord[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Slide-overs
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<InvoicingRecord | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    fortnight_period: '',
    concept_type: 'general_hours' as 'general_hours' | 'shuttles' | 'export_tallymen',
    subtotal: '',
    due_days: '15',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateProforma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.fortnight_period || !formData.subtotal) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotalNum = parseFloat(formData.subtotal);
      const totalNum = subtotalNum * 1.21; // 21% IVA
      const proformaNumber = `PF-${Date.now().toString().slice(-6)}`;
      
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(formData.due_days || '15'));

      await createProformaService({
        proforma_number: proformaNumber,
        client_id: formData.client_id,
        fortnight_period: formData.fortnight_period,
        concept_type: formData.concept_type,
        status: 'draft',
        subtotal: subtotalNum,
        total: totalNum,
        issue_date: issueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
      });

      setIsSlideoverOpen(false);
      setFormData({
        client_id: '',
        fortnight_period: '',
        concept_type: 'general_hours',
        subtotal: '',
        due_days: '15',
      });
      await loadData();
    } catch (err: any) {
      alert(`Error al generar proforma: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProforma || !invoiceNumberInput.trim()) {
      alert('Por favor ingresa un número de factura válido.');
      return;
    }

    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (record: InvoicingRecord, newStatus: InvoicingRecord['status']) => {
    try {
      await updateProformaStatusService(record.id, newStatus);
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
    const matchesFromDate = !fromDate || rec.issue_date >= fromDate;
    const matchesToDate = !toDate || rec.issue_date <= toDate;

    return matchesQuery && matchesStatus && matchesFromDate && matchesToDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header & Action */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Facturación</h1>
          <p className="text-slate-500 text-sm mt-1">Administra proformas y emisión de facturas fiscales.</p>
        </div>
        <button
          onClick={() => setIsSlideoverOpen(true)}
          className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          type="button"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Proforma / Factura</span>
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
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium">Fecha Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6">Cliente</th>
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
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 pl-6 font-semibold">{rec.client_name}</td>
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
                    <td className="px-6 py-4 pr-6 text-center space-x-1">
                      {!rec.invoice && (
                        <button
                          onClick={() => {
                            setSelectedProforma(rec);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="bg-[#1E5BB4] hover:bg-[#004392] text-white text-xs px-2.5 py-1 rounded font-medium transition-colors"
                          title="Emitir Factura Fiscal"
                        >
                          Facturar
                        </button>
                      )}
                      {rec.status !== 'paid' && (
                        <button
                          onClick={() => handleStatusChange(rec, 'paid')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors"
                          title="Marcar como Cobrada"
                        >
                          Cobrada
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProforma(rec.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors inline-block"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Emitir Factura Fiscal */}
      {isInvoiceModalOpen && selectedProforma && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#0B1C30]">Emitir Factura Fiscal</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Proforma: <strong className="text-[#0B1C30]">{selectedProforma.proforma_number}</strong> ({selectedProforma.client_name})
            </p>
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Número de Factura Fiscal</label>
                <input
                  type="text"
                  placeholder="FC-A-0001-0004512"
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Importe Proforma:</span>
                  <span className="font-mono text-slate-800">${selectedProforma.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Facturación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over (Alta de Proforma/Factura) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nueva Proforma</h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProforma} className="p-6 flex-1 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Cliente</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Período Quincenal</label>
                <input
                  type="text"
                  placeholder="2026-08-Q1"
                  value={formData.fortnight_period}
                  onChange={(e) => setFormData({ ...formData, fortnight_period: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Tipo de Concepto</label>
                <select
                  value={formData.concept_type}
                  onChange={(e) => setFormData({ ...formData, concept_type: e.target.value as any })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="general_hours">Horas Generales Operativas</option>
                  <option value="shuttles">Llevadas y Traídas (Shuttles)</option>
                  <option value="export_tallymen">Apuntadores Exportación</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Subtotal (sin IVA)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Días de Vencimiento</label>
                <input
                  type="number"
                  value={formData.due_days}
                  onChange={(e) => setFormData({ ...formData, due_days: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Proforma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

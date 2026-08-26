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
  Calculator,
  Calendar,
  Building2,
  DollarSign,
  Printer,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { getClients, ClientRow } from '@/lib/services/clients';
import {
  getInvoicingRecords,
  createProformaService,
  createTaxInvoiceService,
  updateProformaStatusService,
  deleteProformaService,
  getProformaWithDetails,
  calculateClientProforma,
  InvoicingRecord,
  ProformaCalculationResult
} from '@/lib/services/invoicing';

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
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');

  // Slide-over Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [calcFromDate, setCalcFromDate] = useState('');
  const [calcToDate, setCalcToDate] = useState('');
  const [fortnightPeriod, setFortnightPeriod] = useState('');
  const [conceptType, setConceptType] = useState<'general_hours' | 'shuttles' | 'export_tallymen'>('general_hours');
  const [dueDays, setDueDays] = useState('15');

  // Calculation Result state (100% automated from DB shifts)
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<ProformaCalculationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    initDatePresets();
  }, []);

  const initDatePresets = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // Default to current month Q1 (1st to 15th) or Q2 (16th to end)
    const isFirstHalf = now.getDate() <= 15;
    if (isFirstHalf) {
      setCalcFromDate(`${year}-${month}-01`);
      setCalcToDate(`${year}-${month}-15`);
      setFortnightPeriod(`${year}-${month}-Q1`);
    } else {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setCalcFromDate(`${year}-${month}-16`);
      setCalcToDate(`${year}-${month}-${lastDay}`);
      setFortnightPeriod(`${year}-${month}-Q2`);
    }
  };

  // Trigger automatic calculation whenever client or date range changes while slide-over is open
  useEffect(() => {
    if (isSlideoverOpen && selectedClientId && calcFromDate && calcToDate) {
      runAutoCalculation(selectedClientId, calcFromDate, calcToDate);
    }
  }, [isSlideoverOpen, selectedClientId, calcFromDate, calcToDate]);

  const runAutoCalculation = async (cId: string, from: string, to: string) => {
    try {
      setCalculating(true);
      setError(null);
      const result = await calculateClientProforma(cId, from, to);
      setCalculationResult(result);
    } catch (err: any) {
      console.error('Error auto-calculating proforma:', err);
      setCalculationResult(null);
    } finally {
      setCalculating(false);
    }
  };

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
      if (clientsData.length > 0 && !selectedClientId) {
        setSelectedClientId(clientsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelectionChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    const client = clients.find((c) => c.id === newClientId);
    if (client && client.payment_due_days) {
      setDueDays(client.payment_due_days.toString());
    }
  };

  const handleOpenSlideover = () => {
    setCalculationResult(null);
    initDatePresets();
    if (clients.length > 0) {
      setSelectedClientId(clients[0].id);
      setDueDays(clients[0].payment_due_days?.toString() || '15');
    }
    setIsSlideoverOpen(true);
  };

  const handleCreateProforma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !fortnightPeriod) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!calculationResult || calculationResult.items.length === 0 || calculationResult.subtotal <= 0) {
      alert('No se puede generar la proforma: no existen horas ni turnos transaccionales registrados para este cliente y período.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotalNum = calculationResult.subtotal;
      const totalNum = calculationResult.total;
      const proformaNumber = `PF-${Date.now().toString().slice(-6)}`;

      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(dueDays || '15'));

      const detailsToInsert = calculationResult.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await createProformaService(
        {
          proforma_number: proformaNumber,
          client_id: selectedClientId,
          fortnight_period: fortnightPeriod,
          concept_type: conceptType,
          status: 'draft',
          subtotal: subtotalNum,
          total: totalNum,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
        },
        detailsToInsert
      );

      setIsSlideoverOpen(false);
      setCalculationResult(null);
      await loadData();
    } catch (err: any) {
      alert(`Error al generar proforma: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetailsModal = async (record: InvoicingRecord) => {
    try {
      setLoadingDetails(true);
      setIsDetailModalOpen(true);
      const fullProforma = await getProformaWithDetails(record.id);
      setSelectedProformaDetails(fullProforma || record);
    } catch (err: any) {
      console.error('Error fetching proforma details:', err);
      setSelectedProformaDetails(record);
    } finally {
      setLoadingDetails(false);
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
    const matchesFromDate = !fromDateFilter || rec.issue_date >= fromDateFilter;
    const matchesToDate = !toDateFilter || rec.issue_date <= toDateFilter;

    return matchesQuery && matchesStatus && matchesFromDate && matchesToDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header & Action */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Facturación</h1>
          <p className="text-slate-500 text-sm mt-1">
            Cálculo automático de proformas por cliente según horas registradas y tarifario comercial.
          </p>
        </div>
        <button
          onClick={handleOpenSlideover}
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
                    <td className="px-6 py-4 pr-6 text-center space-x-1 whitespace-nowrap">
                      {/* Ver Desglose */}
                      <button
                        onClick={() => handleOpenDetailsModal(rec)}
                        className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-blue-50 transition-colors inline-block"
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

      {/* Modal: Desglose Completo de la Proforma / Factura */}
      {isDetailModalOpen && selectedProformaDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-[#1E5BB4] bg-blue-50 px-2.5 py-1 rounded-md">
                    Proforma Comercial
                  </span>
                  <h3 className="text-xl font-bold text-[#0B1C30] font-mono">
                    {selectedProformaDetails.proforma_number}
                  </h3>
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  Cliente: <span className="text-[#0B1C30]">{selectedProformaDetails.client_name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Período: {selectedProformaDetails.fortnight_period} | Fecha de Emisión: {selectedProformaDetails.issue_date} | Vto: {selectedProformaDetails.due_date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Imprimir"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center text-slate-500">Cargando desglose de proforma...</div>
            ) : (
              <div className="space-y-6">
                {/* Desglose de Líneas de Facturación */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#1E5BB4]" />
                    Desglose de Conceptos Facturados
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Concepto / Servicio</th>
                          <th className="py-3 px-4 text-center font-mono">Horas / Cant.</th>
                          <th className="py-3 px-4 text-right font-mono">Tarifa Unitaria ($)</th>
                          <th className="py-3 px-4 text-right font-mono pr-4">Subtotal ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProformaDetails.details && selectedProformaDetails.details.length > 0 ? (
                          selectedProformaDetails.details.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-[#0B1C30]">{item.description}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-600">{item.quantity}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                $ {item.unit_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B1C30] pr-4">
                                $ {item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-3 px-4 font-medium text-[#0B1C30]">
                              Servicio de Horas Operativas - {selectedProformaDetails.fortnight_period}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-600">1</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-600">
                              $ {selectedProformaDetails.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B1C30] pr-4">
                              $ {selectedProformaDetails.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen Total */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 max-w-sm ml-auto text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono font-medium">
                      $ {selectedProformaDetails.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (21%):</span>
                    <span className="font-mono font-medium">
                      $ {(selectedProformaDetails.subtotal * 0.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-bold text-[#0B1C30]">
                    <span>Total Factura:</span>
                    <span className="font-mono text-[#1E5BB4]">
                      $ {selectedProformaDetails.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-[#0B1C30] hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Slide-over (Alta Automatizada de Proforma / Factura) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-xl bg-[#0EA5E9] text-white shadow-2xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-amber-300" />
                  Nueva Proforma Comercial
                </h2>
                <p className="text-xs text-sky-100 mt-0.5">
                  Cálculo automático de liquidación según horas y tarifario comercial.
                </p>
              </div>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProforma} className="p-6 flex-1 space-y-4">
              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Cliente *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelectionChange(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.payment_due_days} Días Vto)
                    </option>
                  ))}
                </select>
              </div>

              {/* Rango de Fechas para Liquidar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Desde *</label>
                  <input
                    type="date"
                    value={calcFromDate}
                    onChange={(e) => setCalcFromDate(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Hasta *</label>
                  <input
                    type="date"
                    value={calcToDate}
                    onChange={(e) => setCalcToDate(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                    required
                  />
                </div>
              </div>

              {/* Resumen de Liquidación Automática en Tiempo Real */}
              <div className="pt-1">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Liquidación Transaccional Automática
                  </span>
                  {calculating && (
                    <span className="text-xs text-amber-200 animate-pulse font-semibold">
                      Calculando horas y tarifas...
                    </span>
                  )}
                </div>

                {calculating ? (
                  <div className="bg-[#0B1C30]/50 border border-white/20 rounded-xl p-6 text-center text-sky-100 text-xs">
                    Cruzando turnos de personal con tarifario comercial...
                  </div>
                ) : calculationResult ? (
                  <div className="bg-[#0B1C30]/50 border border-white/25 rounded-xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        {calculationResult.total_shifts} turnos computados
                      </span>
                      <span className="text-xs text-sky-200 font-mono font-bold">
                        Total Horas: {calculationResult.total_hours} hs
                      </span>
                    </div>

                    {/* Resumen de Horas */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-slate-300 text-[11px]">Normales</div>
                        <div className="text-emerald-300 font-bold text-sm">{calculationResult.total_regular_hours} hs</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-slate-300 text-[11px]">Extras 50%</div>
                        <div className="text-sky-300 font-bold text-sm">{calculationResult.total_overtime_50_hours} hs</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-slate-300 text-[11px]">Extras 100%</div>
                        <div className="text-amber-300 font-bold text-sm">{calculationResult.total_overtime_100_hours} hs</div>
                      </div>
                    </div>

                    {/* Ítems calculados */}
                    {calculationResult.items.length > 0 ? (
                      <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                        {calculationResult.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                            <div className="text-slate-200">
                              <span className="font-semibold">{item.description}</span>
                              <span className="text-slate-400 block text-[11px]">
                                {item.quantity} hs/cant × $ {item.unit_price.toLocaleString('es-AR')}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-white whitespace-nowrap ml-2">
                              $ {item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-200 text-center py-3 bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 space-y-1">
                        <p className="font-bold">⚠️ No se encontraron horas cargadas para este cliente y período.</p>
                        <p className="text-[11px] text-amber-300/80">
                          El sistema no permite emitir proformas sin horas registradas en la grilla transaccional. Carga primero las novedades en Carga Diaria.
                        </p>
                      </div>
                    )}

                    {/* Subtotal, IVA y Total Locked */}
                    <div className="pt-2 border-t border-white/20 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-slate-200">
                        <span>Subtotal Liquidado (sin IVA):</span>
                        <span className="font-bold text-sm text-white">
                          $ {calculationResult.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>IVA (21%):</span>
                        <span>$ {calculationResult.tax_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-white/15">
                        <span>Total Proforma:</span>
                        <span className="text-amber-300 text-base">
                          $ {calculationResult.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B1C30]/40 border border-white/20 rounded-xl p-4 text-center text-xs text-sky-100">
                    Selecciona un cliente y rango de fechas para ver la liquidación calculada.
                  </div>
                )}
              </div>

              {/* Período Quincenal Label */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Identificador del Período *</label>
                <input
                  type="text"
                  placeholder="2026-08-Q1"
                  value={fortnightPeriod}
                  onChange={(e) => setFortnightPeriod(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  required
                />
              </div>

              {/* Tipo de Concepto */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Tipo de Concepto</label>
                <select
                  value={conceptType}
                  onChange={(e) => setConceptType(e.target.value as any)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="general_hours">Horas Generales Operativas</option>
                  <option value="shuttles">Llevadas y Traídas (Shuttles)</option>
                  <option value="export_tallymen">Apuntadores Exportación</option>
                </select>
              </div>

              {/* Días de Vencimiento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Días de Vencimiento</label>
                <input
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || calculating || !calculationResult || calculationResult.items.length === 0 || calculationResult.subtotal <= 0}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando Proforma...' : 'Generar Proforma Automática'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

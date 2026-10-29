'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calculator,
  Building2,
  Ship,
  Percent,
  Check,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  Download,
  Settings2,
} from 'lucide-react';
import { ClientRow } from '@/lib/services/clients';
import {
  calculateProforma,
  createProformaService,
  createTaxInvoiceService,
  getAllStrategies,
  getDefaultStrategyForClient,
  ProformaCalculationResult,
  downloadProformaExcel,
} from '@/lib/services/invoicing';
import {
  getClientOperations,
  ClientOperationRow,
} from '@/lib/services/client-operations';
import { ExcelWorkbookPreviewModal } from './ExcelWorkbookPreviewModal';
import { ProformaTypesAndOperationsModal } from './ProformaTypesAndOperationsModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientRow[];
  onProformaCreated: () => void;
}

export function CreateProformaSlideover({
  isOpen,
  onClose,
  clients,
  onProformaCreated,
}: Props) {
  const strategies = getAllStrategies();

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientOperations, setClientOperations] = useState<ClientOperationRow[]>([]);
  const [selectedType, setSelectedType] = useState('vessel');
  const [calcFromDate, setCalcFromDate] = useState('');
  const [calcToDate, setCalcToDate] = useState('');
  const [fortnightPeriod, setFortnightPeriod] = useState('');
  const [vesselNameInput, setVesselNameInput] = useState('');
  const [isCustomVessel, setIsCustomVessel] = useState(false);
  const [discountPercentageInput, setDiscountPercentageInput] = useState('0');
  const [depositSector, setDepositSector] = useState<'both' | 'nacional' | 'fiscal' | 'arroz'>('both');
  const [coparticipationFactor, setCoparticipationFactor] = useState('10');
  const [conceptType, setConceptType] = useState<'general_hours' | 'shuttles' | 'export_tallymen'>('general_hours');
  const [dueDays, setDueDays] = useState('30');
  const [customIssueDate, setCustomIssueDate] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');

  const effectiveIssueDate = customIssueDate || calcToDate || new Date().toISOString().split('T')[0];
  const effectiveDueDate = (() => {
    if (customDueDate) return customDueDate;
    const base = new Date(`${effectiveIssueDate}T12:00:00`);
    const days = parseInt(dueDays || '30', 10) || 0;
    const d = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  })();

  // Full-Screen Excel Modal & Catalog Modal
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [isTypesCatalogOpen, setIsTypesCatalogOpen] = useState(false);

  // Calculation State
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<ProformaCalculationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Initialize dates and client defaults on open
  useEffect(() => {
    if (isOpen) {
      initDatePresets();
      loadOperations();
      setIsCustomVessel(false);
      setVesselNameInput('');
      if (clients.length > 0 && !selectedClientId) {
        handleClientSelectionChange(clients[0].id);
      }
    }
  }, [isOpen, clients]);

  const loadOperations = async () => {
    try {
      const ops = await getClientOperations();
      setClientOperations(ops);
    } catch (e) {
      console.error('Error loading operations in slideover:', e);
    }
  };

  const initDatePresets = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
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

  const handleClientSelectionChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setIsCustomVessel(false);
    setVesselNameInput('');
    const client = clients.find((c) => c.id === newClientId);
    if (client) {
      const cName = client.company_name.toUpperCase();
      const defaultDue = cName.includes('CAT') ? '30' : cName.includes('COOPTACORD') ? '7' : '15';
      setDueDays(client.payment_due_days ? client.payment_due_days.toString() : defaultDue);
      const suggestedType = getDefaultStrategyForClient(client.company_name);
      setSelectedType(suggestedType);

      const isDelta = client.company_name.toUpperCase().includes('DELTA');
      if (isDelta || suggestedType === 'fixed_deposit') {
        setDiscountPercentageInput('0');
      } else {
        setDiscountPercentageInput('3.0');
      }

      const strat = strategies.find((s) => s.type === suggestedType);
      if (strat) {
        setConceptType(strat.defaultConceptType);
      }
    }
  };

  // Re-run reactive calculation whenever inputs change (debounced to avoid typing interference)
  useEffect(() => {
    if (isOpen && selectedClientId && calcFromDate && calcToDate) {
      const timer = setTimeout(() => {
        runCalculation();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    selectedClientId,
    selectedType,
    calcFromDate,
    calcToDate,
    vesselNameInput,
    discountPercentageInput,
    depositSector,
    coparticipationFactor,
  ]);

  const runCalculation = async () => {
    try {
      setCalculating(true);
      setCalcError(null);
      const disc = parseFloat(discountPercentageInput || '0') || 0;
      const factorNum = (parseFloat(coparticipationFactor || '10') || 10) / 100;

      const result = await calculateProforma({
        clientId: selectedClientId,
        fromDate: calcFromDate,
        toDate: calcToDate,
        proformaType: selectedType,
        vesselName: vesselNameInput.trim() || undefined,
        discountPercentage: disc,
        depositSector,
        coparticipationFactor: factorNum,
      });

      setCalculationResult(result);
      if (result.vessel_name && !vesselNameInput && !isCustomVessel && (selectedType === 'vessel' || selectedType === 'barge' || selectedType === 'plus_incidence')) {
        setVesselNameInput(result.vessel_name);
      }
    } catch (err: any) {
      console.error('Error auto-calculating proforma:', err);
      setCalcError(err.message || 'Error al calcular liquidación');
      setCalculationResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !fortnightPeriod) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (!calculationResult || calculationResult.items.length === 0 || calculationResult.total <= 0) {
      alert('No se puede generar la proforma: no existen turnos transaccionales aprobados para este cliente y período.');
      return;
    }

    setIsSubmitting(true);
    try {
      const proformaNumber = `PF-${Date.now().toString().slice(-6)}`;
      const issueDateStr = effectiveIssueDate;
      const dueDateStr = effectiveDueDate;
      const cleanInvNumber = customInvoiceNumber.trim();

      const detailsToInsert = calculationResult.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const payloadWithInvoiceMeta = {
        ...(calculationResult.payload || {}),
        issue_date: issueDateStr,
        due_date: dueDateStr,
        ...(cleanInvNumber ? { invoice_number: cleanInvNumber } : {}),
      };

      const createdProforma = await createProformaService(
        {
          proforma_number: proformaNumber,
          proforma_type: selectedType,
          client_id: selectedClientId,
          fortnight_period: fortnightPeriod,
          concept_type: conceptType,
          status: cleanInvNumber ? 'invoiced' : 'draft',
          subtotal: calculationResult.subtotal,
          total: calculationResult.total,
          issue_date: issueDateStr,
          due_date: dueDateStr,
          vessel_name: vesselNameInput.trim() || calculationResult.vessel_name || null,
          operation_dates: calculationResult.operation_dates || null,
          discount_percentage: calculationResult.discount_percentage,
          discount_amount: calculationResult.discount_amount,
          subtotal_operativa: calculationResult.subtotal_operativa || 0,
          subtotal_encargado: calculationResult.subtotal_encargado || 0,
          subtotal_compensacion: calculationResult.subtotal_compensacion || 0,
          total_neto: calculationResult.total_neto,
          tax_amount: calculationResult.tax_amount,
          calculation_payload: payloadWithInvoiceMeta,
          notes: calculationResult.notes,
        },
        detailsToInsert
      );

      if (cleanInvNumber && createdProforma?.id) {
        try {
          await createTaxInvoiceService({
            proforma_id: createdProforma.id,
            invoice_number: cleanInvNumber,
            invoice_date: issueDateStr,
            invoiced_amount: calculationResult.total,
            status: 'pending',
            pdf_storage_path: '',
          });
        } catch (invErr) {
          console.warn('Could not auto-create tax_invoices row:', invErr);
        }
      }

      onProformaCreated();
      onClose();
    } catch (err: any) {
      alert(`Error al generar proforma: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const vesselOpsForClient = clientOperations.filter(
    (op) => op.client_id === selectedClientId && (op.operation_type === 'vessel' || op.operation_type === 'barge' || op.operation_type === 'general')
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          {/* Header B2B */}
          <div className="p-6 bg-[#0B1C30] text-white flex justify-between items-center shrink-0 border-b border-[#0F2547]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1E5BB4] rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nueva Proforma Comercial</h2>
                <p className="text-xs text-sky-200 mt-0.5">
                  Liquidación oficial alineada a plantillas Excel por tipo de proforma.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTypesCatalogOpen(true)}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 text-sky-200 px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cargar o administrar el listado de tipos de proformas, buques y depósitos"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Cargar Tipos / Buques</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Body with Sky Blue Card */}
          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="bg-[#0EA5E9] rounded-xl p-5 shadow-sm space-y-4 text-white">
              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Cliente *
                </label>
                <select
                  value={selectedClientId}
                  data-testid="invoicing-select-client"
                  onChange={(e) => handleClientSelectionChange(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-medium focus:outline-none focus:border-[#1E5BB4]"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Tipo de Proforma / Modelo */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Tipo de Proforma *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTypesCatalogOpen(true)}
                    className="text-[11px] font-extrabold text-white underline hover:text-sky-100 cursor-pointer flex items-center gap-1"
                  >
                    <Settings2 className="h-3 w-3" />
                    <span>+ Cargar / Editar Listado de Tipos y Buques</span>
                  </button>
                </div>
                <select
                  value={selectedType}
                  data-testid="invoicing-select-model"
                  onChange={(e) => {
                    const newType = e.target.value;
                    setSelectedType(newType);
                    if (newType === 'fixed_deposit') {
                      setDiscountPercentageInput('0');
                    }
                    const strat = strategies.find((s) => s.type === newType);
                    if (strat) setConceptType(strat.defaultConceptType);
                  }}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-bold focus:outline-none focus:border-[#1E5BB4]"
                  required
                >
                  {strategies.map((strat) => (
                    <option key={strat.type} value={strat.type}>
                      {strat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-sky-100 font-medium mt-0.5">
                  {strategies.find((s) => s.type === selectedType)?.description}
                </p>
              </div>

              {/* Parámetros Específicos según el Tipo de Proforma */}
              {(selectedType === 'vessel' || selectedType === 'barge' || selectedType === 'plus_incidence') && (
                <div className="flex flex-col gap-1 animate-in fade-in duration-150">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Ship className="h-3.5 w-3.5" /> {selectedType === 'barge' ? 'Nombre de la Barcaza *' : 'Nombre del Buque / Servicio *'}
                  </label>
                  {vesselOpsForClient.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={
                          isCustomVessel
                            ? 'CUSTOM'
                            : vesselOpsForClient.some((op) => op.name === vesselNameInput)
                            ? vesselNameInput
                            : vesselNameInput
                            ? 'CUSTOM'
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM') {
                            setIsCustomVessel(true);
                            setVesselNameInput('');
                          } else {
                            setIsCustomVessel(false);
                            const chosenName = e.target.value;
                            setVesselNameInput(chosenName);
                            const matchedOp = vesselOpsForClient.find((op) => op.name === chosenName);
                            if (
                              matchedOp?.operation_type === 'barge' ||
                              chosenName.includes('JACKSON') ||
                              chosenName.includes('INQUEBRANTABLE') ||
                              chosenName.includes('BARCAZA')
                            ) {
                              if (selectedType === 'vessel') setSelectedType('barge');
                            }
                          }
                        }}
                        className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-semibold focus:outline-none focus:border-[#1E5BB4]"
                      >
                        <option value="">-- {selectedType === 'barge' ? 'Seleccionar Barcaza' : 'Seleccionar Buque del Cliente'} --</option>
                        {vesselOpsForClient.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.operation_type === 'barge' ? '🚤' : '🚢'} {v.name}
                          </option>
                        ))}
                        <option value="CUSTOM">Otro / Escribir manualmente...</option>
                      </select>
                      {(isCustomVessel ||
                        (!vesselOpsForClient.some((op) => op.name === vesselNameInput) && vesselNameInput !== '')) && (
                        <input
                          type="text"
                          autoFocus={isCustomVessel}
                          value={vesselNameInput}
                          onChange={(e) => setVesselNameInput(e.target.value.toUpperCase())}
                          placeholder={selectedType === 'barge' ? "Escribir nombre de la barcaza (ej. CAP JACKSON, INQUEBRANTABLE)..." : "Escribir nombre del buque (ej. GOODWOOD, BRASILIA HWY)..."}
                          className="w-full p-2 bg-white border-2 border-[#0F2547] rounded-lg text-sm uppercase font-semibold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={vesselNameInput}
                      onChange={(e) => setVesselNameInput(e.target.value.toUpperCase())}
                      placeholder={selectedType === 'barge' ? "Ej. CAP JACKSON, INQUEBRANTABLE..." : "Ej. GOODWOOD, BRASILIA HWY..."}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm uppercase font-semibold text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                    />
                  )}
                </div>
              )}

              {selectedType === 'fixed_deposit' && (
                <div className="flex flex-col gap-1 animate-in fade-in duration-150">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Depósitos a Incluir en la Proforma
                  </label>
                  <select
                    value={depositSector}
                    onChange={(e) => setDepositSector(e.target.value as any)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-bold focus:outline-none focus:border-[#1E5BB4]"
                  >
                    <option value="both">
                      Los Dos Depósitos: Depósito Nacional (Apuntador 1) + Depósito Fiscal (Apuntador 2)
                    </option>
                    <option value="arroz">Depósito Arroz - Despacho Bolsones</option>
                    <option value="nacional">Depósito Nacional Solamente</option>
                    <option value="fiscal">Depósito Fiscal Solamente</option>
                  </select>
                </div>
              )}

              {selectedType === 'shared_expo' && (
                <div className="flex flex-col gap-1 animate-in fade-in duration-150">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5" /> Porcentaje de Coparticipación (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={coparticipationFactor}
                    onChange={(e) => setCoparticipationFactor(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-bold focus:outline-none focus:border-[#1E5BB4]"
                  />
                  <span className="text-[11px] text-sky-100">
                    Se liquidará el {coparticipationFactor}% sobre las horas totales base registradas en la locación.
                  </span>
                </div>
              )}

              {/* Rango de Fechas con Accesos Rápidos de Quincena */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Rango de Liquidación *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const year = calcFromDate ? calcFromDate.split('-')[0] : now.getFullYear().toString();
                        const month = calcFromDate ? calcFromDate.split('-')[1] : String(now.getMonth() + 1).padStart(2, '0');
                        setCalcFromDate(`${year}-${month}-01`);
                        setCalcToDate(`${year}-${month}-15`);
                        setFortnightPeriod(`${year}-${month}-Q1`);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/30 hover:bg-blue-800 hover:text-white transition-colors cursor-pointer"
                    >
                      1° Q (01-15)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const year = calcFromDate ? calcFromDate.split('-')[0] : now.getFullYear().toString();
                        const month = calcFromDate ? calcFromDate.split('-')[1] : String(now.getMonth() + 1).padStart(2, '0');
                        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                        setCalcFromDate(`${year}-${month}-16`);
                        setCalcToDate(`${year}-${month}-${lastDay}`);
                        setFortnightPeriod(`${year}-${month}-Q2`);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/30 hover:bg-blue-800 hover:text-white transition-colors cursor-pointer"
                    >
                      2° Q (16-Fin)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-300">Fecha Desde</label>
                    <input
                      type="date"
                      data-testid="invoicing-input-from-date"
                      value={calcFromDate}
                      onChange={(e) => {
                        const newFrom = e.target.value;
                        setCalcFromDate(newFrom);
                        if (newFrom) {
                          const parts = newFrom.split('-');
                          if (parts.length === 3) {
                            const yyyy = parts[0];
                            const mm = parts[1];
                            const dd = parseInt(parts[2], 10);
                            setFortnightPeriod(`${yyyy}-${mm}-${dd <= 15 ? 'Q1' : 'Q2'}`);
                          }
                        }
                      }}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-300">Fecha Hasta</label>
                    <input
                      type="date"
                      data-testid="invoicing-input-to-date"
                      value={calcToDate}
                      onChange={(e) => setCalcToDate(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Período Quincenal y Bonificación */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Período Quincenal *</label>
                  <input
                    type="text"
                    data-testid="invoicing-input-fortnight-period"
                    value={fortnightPeriod}
                    onChange={(e) => setFortnightPeriod(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Bonificación Comercial (%)</label>
                  {selectedType === 'fixed_deposit' ||
                  clients.find((c) => c.id === selectedClientId)?.company_name.toUpperCase().includes('DELTA') ? (
                    <div className="w-full p-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-xs text-slate-300 italic flex items-center h-[42px]">
                      <span>0% (Sin bonificación para Delta)</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      data-testid="invoicing-input-discount"
                      value={discountPercentageInput}
                      onChange={(e) => setDiscountPercentageInput(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-mono focus:outline-none focus:border-[#1E5BB4]"
                    />
                  )}
                </div>
              </div>

              {/* Nro. de Factura, Fecha de Factura y Fecha de Vencimiento */}
              <div className="space-y-3 pt-2 border-t border-white/20">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Nro. de Factura (Opcional — se imprime en Hoja 1 FACTURA)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1-538 o 0001-00000538 (puede definirse ahora o luego)"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] font-mono font-bold focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Factura</label>
                    <input
                      type="date"
                      value={effectiveIssueDate}
                      onChange={(e) => {
                        setCustomIssueDate(e.target.value);
                        setCustomDueDate('');
                      }}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-mono font-bold focus:outline-none focus:border-[#1E5BB4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-white">Días Vto. ({dueDays}d)</label>
                    <input
                      type="number"
                      min="0"
                      value={dueDays}
                      onChange={(e) => {
                        setDueDays(e.target.value);
                        setCustomDueDate('');
                      }}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-mono font-bold focus:outline-none focus:border-[#1E5BB4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-white">Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={effectiveDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-xs text-[#0B1C30] font-mono font-bold focus:outline-none focus:border-[#1E5BB4]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Reactive Recalculation Preview Banner */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#1E5BB4]" />
                  Previsualización de Liquidación
                </span>
                {calculating && <span className="text-xs font-medium text-sky-600 animate-pulse">Calculando...</span>}
              </div>

              {calcError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{calcError}</span>
                </div>
              )}

              {calculationResult ? (
                <div className="space-y-2.5 text-xs">
                  {calculationResult.total_shifts === 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>No se encontraron turnos aprobados para este cliente en el rango seleccionado (0.0 hs).</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Turnos Aprobados Computados:</span>
                    <span className="font-mono font-bold text-[#0B1C30]">{calculationResult.total_shifts ?? 0} turnos</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Total Horas Registradas:</span>
                    <span className="font-mono text-[#0B1C30]">
                      {calculationResult.total_hours?.toFixed(1) ?? 0} hs
                    </span>
                  </div>

                  {/* Si es Depósitos Delta Dock, mostrar explícitamente los 2 depósitos y su detalle día por día */}
                  {selectedType === 'fixed_deposit' &&
                    Array.isArray(calculationResult.payload?.depositos) &&
                    calculationResult.payload.depositos.map((dep: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sky-950 bg-sky-50/80 rounded-lg border border-sky-200 overflow-hidden"
                      >
                        <div className="flex justify-between items-center px-2.5 py-1.5 bg-sky-100/70 border-b border-sky-200">
                          <span className="font-bold text-[11px]">
                            {dep.title} ({dep.apuntadorLabel} • TTE: {Number(dep.totalTte || 0).toFixed(2)}):
                          </span>
                          <span className="font-mono font-extrabold text-[11px]">
                            $ {Number(dep.importeTotalBlock || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {Array.isArray(dep.turnos) && dep.turnos.length > 0 && (
                          <div className="max-h-36 overflow-y-auto bg-white">
                            <table className="w-full text-[10px] border-collapse">
                              <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
                                <tr>
                                  <th className="p-1 pl-2 text-left">Fecha</th>
                                  <th className="p-1 text-left">Puesto</th>
                                  <th className="p-1 text-left">Apellido y Nombre</th>
                                  <th className="p-1 text-center">Horario</th>
                                  <th className="p-1 text-center">Norm</th>
                                  <th className="p-1 pr-2 text-center text-purple-800">TTE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {dep.turnos.map((t: any, rIdx: number) => {
                                  const isFeriado = Boolean(t.isHoliday) || String(t.apellido || '').toUpperCase() === 'FERIADO';
                                  const rawDate = String(t.fecha || '');
                                  const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                                    ? rawDate.split('-').reverse().join('/')
                                    : rawDate;
                                  return (
                                    <tr key={rIdx} className={isFeriado ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-slate-50'}>
                                      <td className="p-1 pl-2 font-mono whitespace-nowrap">{formattedDate}</td>
                                      <td className="p-1 font-mono text-slate-600 whitespace-nowrap">{t.puesto}</td>
                                      <td className="p-1 font-semibold whitespace-nowrap">{t.apellido}</td>
                                      <td className="p-1 text-center font-mono text-slate-500">{t.desdeHasta}</td>
                                      <td className="p-1 text-center font-mono">{isFeriado ? '-' : t.normales}</td>
                                      <td className="p-1 pr-2 text-center font-mono font-bold text-purple-800">
                                        {isFeriado ? '-' : Number(t.tte || 0).toFixed(t.tte % 1 !== 0 ? 2 : 1)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}

                  {Boolean(calculationResult.payload?.tab_transporte?.viajes) && (
                    <div className="flex justify-between items-center text-purple-900 bg-purple-50/70 px-2.5 py-1.5 rounded-lg border border-purple-200">
                      <span className="font-medium">Transporte Personal (Remises):</span>
                      <span className="font-mono font-bold">
                        {calculationResult.payload.tab_transporte.viajes} viajes • $ {Number(calculationResult.payload.tab_transporte.total_transporte || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Boolean(calculationResult.payload?.transporte?.tramos) && (
                    <div className="flex justify-between items-center text-purple-900 bg-purple-50/70 px-2.5 py-1.5 rounded-lg border border-purple-200">
                      <span className="font-medium">Transporte Diario Personal (Remises):</span>
                      <span className="font-mono font-bold">
                        {Number(calculationResult.payload.transporte.tramos).toFixed(2)} tramos • $ {Number(calculationResult.payload.transporte.total_transporte || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Boolean(calculationResult.payload?.tab_expo?.horas_facturadas?.norm) && (
                    <div className="flex justify-between items-center text-blue-900 bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-200">
                      <span className="font-medium">Control EXPO (Asignación 90%):</span>
                      <span className="font-mono font-bold">
                        $ {Number(calculationResult.payload.tab_expo.importes?.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Neto Servicios:</span>
                    <span data-testid="invoicing-preview-subtotal" className="font-mono font-semibold text-[#0B1C30]">
                      $ {calculationResult.total_neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {calculationResult.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Bonificación ({calculationResult.discount_percentage}%):</span>
                      <span className="font-mono font-medium">
                        - $ {calculationResult.discount_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>IVA (21%):</span>
                    <span className="font-mono font-semibold text-slate-700">
                      $ {calculationResult.tax_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-extrabold text-[#0B1C30] text-sm">
                    <span>TOTAL FACTURA:</span>
                    <span data-testid="invoicing-preview-total" className="font-mono text-base text-[#1E5BB4]">
                      $ {calculationResult.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* PREVISUALIZACIÓN Y DESCARGA DE HOJA EXCEL REAL PARA TODOS LOS MODELOS (BUQUE, PLAZOLETA FISCAL, DEPOSITOS, INCIDENCIA PLUS, ETC.) */}
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      data-testid="invoicing-btn-open-excel-preview"
                      onClick={() => setIsExcelPreviewOpen(true)}
                      className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#107C41] border-2 border-[#107C41] rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="h-4 w-4 shrink-0" />
                      <span>Previsualización Hoja Excel</span>
                    </button>

                    <button
                      type="button"
                      data-testid="invoicing-btn-download-excel-preview"
                      onClick={() =>
                        downloadProformaExcel(calculationResult, {
                          issueDate: effectiveIssueDate,
                          dueDate: effectiveDueDate,
                          invoiceNumber: customInvoiceNumber.trim() || undefined,
                        })
                      }
                      className="w-full py-2.5 px-3 bg-[#107C41] hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Abrir / Descargar Excel (.xls)</span>
                    </button>
                  </div>
                </div>
              ) : (
                !calculating && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Selecciona cliente y fechas para calcular el resumen en tiempo real.
                  </p>
                )
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                data-testid="invoicing-btn-emitir-proforma"
                disabled={isSubmitting || calculating || !calculationResult || calculationResult.total <= 0}
                className="w-full bg-[#1E5BB4] hover:bg-[#004392] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{isSubmitting ? 'Guardando Proforma...' : 'Generar Proforma Oficial'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Hoja Excel a Pantalla Completa */}
      <ExcelWorkbookPreviewModal
        isOpen={isExcelPreviewOpen}
        onClose={() => setIsExcelPreviewOpen(false)}
        source={calculationResult}
        meta={{
          issueDate: effectiveIssueDate,
          dueDate: effectiveDueDate,
          invoiceNumber: customInvoiceNumber.trim() || undefined,
        }}
      />

      {/* Modal de Administración de Tipos de Proforma, Buques y Depósitos */}
      <ProformaTypesAndOperationsModal
        isOpen={isTypesCatalogOpen}
        onClose={() => setIsTypesCatalogOpen(false)}
        clients={clients}
        onOperationsChanged={loadOperations}
      />
    </div>
  );
}

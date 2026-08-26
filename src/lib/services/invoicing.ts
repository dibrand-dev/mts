import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from './daily-entries';

export type ProformaRow = Database['public']['Tables']['proformas']['Row'];
export type ProformaInsert = Database['public']['Tables']['proformas']['Insert'];
export type ProformaUpdate = Database['public']['Tables']['proformas']['Update'];

export type ProformaDetailRow = Database['public']['Tables']['proforma_details']['Row'];
export type ProformaDetailInsert = Database['public']['Tables']['proforma_details']['Insert'];

export type TaxInvoiceRow = Database['public']['Tables']['tax_invoices']['Row'];
export type TaxInvoiceInsert = Database['public']['Tables']['tax_invoices']['Insert'];

export interface InvoicingRecord {
  id: string;
  proforma_number: string;
  client_id: string;
  client_name?: string;
  fortnight_period: string;
  concept_type: 'general_hours' | 'shuttles' | 'export_tallymen';
  status: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue';
  subtotal: number;
  total: number;
  issue_date: string;
  due_date: string;
  invoice?: {
    id: string;
    invoice_number: string;
    pdf_storage_path: string;
    invoiced_amount: number;
    status: 'pending' | 'paid';
    invoice_date: string;
  } | null;
  details?: ProformaDetailRow[];
}

export interface ProformaCalculationItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CalculatedShiftAuditItem extends ClientShiftRecordForBilling {
  regular_rate: number;
  overtime_50_rate: number;
  overtime_100_rate: number;
  calculated_subtotal: number;
}

export interface ProformaCalculationResult {
  client_id: string;
  client_name: string;
  from_date: string;
  to_date: string;
  total_shifts: number;
  total_regular_hours: number;
  total_overtime_50_hours: number;
  total_overtime_100_hours: number;
  total_hours: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  items: ProformaCalculationItem[];
  shift_breakdown: CalculatedShiftAuditItem[];
}

export async function getInvoicingRecords(): Promise<InvoicingRecord[]> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('proformas')
    .select(`
      *,
      clients(company_name),
      tax_invoices(*),
      proforma_details(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoicing records:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    proforma_number: row.proforma_number,
    client_id: row.client_id,
    client_name: row.clients?.company_name || 'Sin Cliente',
    fortnight_period: row.fortnight_period,
    concept_type: row.concept_type,
    status: row.status,
    subtotal: Number(row.subtotal || 0),
    total: Number(row.total || 0),
    issue_date: row.issue_date,
    due_date: row.due_date,
    details: row.proforma_details || [],
    invoice: row.tax_invoices?.[0]
      ? {
          id: row.tax_invoices[0].id,
          invoice_number: row.tax_invoices[0].invoice_number,
          pdf_storage_path: row.tax_invoices[0].pdf_storage_path || '',
          invoiced_amount: Number(row.tax_invoices[0].invoiced_amount || 0),
          status: row.tax_invoices[0].status,
          invoice_date: row.tax_invoices[0].invoice_date,
        }
      : row.tax_invoices && !Array.isArray(row.tax_invoices)
      ? {
          id: row.tax_invoices.id,
          invoice_number: row.tax_invoices.invoice_number,
          pdf_storage_path: row.tax_invoices.pdf_storage_path || '',
          invoiced_amount: Number(row.tax_invoices.invoiced_amount || 0),
          status: row.tax_invoices.status,
          invoice_date: row.tax_invoices.invoice_date,
        }
      : null,
  }));
}

export async function getProformaWithDetails(proformaId: string): Promise<InvoicingRecord | null> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('proformas')
    .select(`
      *,
      clients(company_name, tax_id, billing_email, phone_number),
      tax_invoices(*),
      proforma_details(*)
    `)
    .eq('id', proformaId)
    .single();

  if (error) {
    console.error('Error fetching proforma with details:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    proforma_number: data.proforma_number,
    client_id: data.client_id,
    client_name: data.clients?.company_name || 'Sin Cliente',
    fortnight_period: data.fortnight_period,
    concept_type: data.concept_type,
    status: data.status,
    subtotal: Number(data.subtotal || 0),
    total: Number(data.total || 0),
    issue_date: data.issue_date,
    due_date: data.due_date,
    details: (data.proforma_details || []).map((d: any) => ({
      id: d.id,
      proforma_id: d.proforma_id,
      description: d.description,
      quantity: Number(d.quantity || 0),
      unit_price: Number(d.unit_price || 0),
      subtotal: Number(d.subtotal || 0),
      created_at: d.created_at,
    })),
    invoice: data.tax_invoices?.[0]
      ? {
          id: data.tax_invoices[0].id,
          invoice_number: data.tax_invoices[0].invoice_number,
          pdf_storage_path: data.tax_invoices[0].pdf_storage_path || '',
          invoiced_amount: Number(data.tax_invoices[0].invoiced_amount || 0),
          status: data.tax_invoices[0].status,
          invoice_date: data.tax_invoices[0].invoice_date,
        }
      : null,
  };
}

/**
 * Calculates client billing from recorded shifts in the period, applying exact commercial rates.
 */
export async function calculateClientProforma(
  clientId: string,
  fromDate: string,
  toDate: string
): Promise<ProformaCalculationResult> {
  const supabase = createClient() as any;

  // 1. Fetch client info
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('id', clientId)
    .single();

  if (clientErr) {
    throw new Error(`Error al obtener cliente: ${clientErr.message}`);
  }

  // 2. Fetch client commercial rates
  const { data: ratesData, error: ratesErr } = await supabase
    .from('client_position_rates')
    .select(`
      *,
      position:positions(id, name),
      hour_type:hour_types(id, code)
    `)
    .eq('client_id', clientId);

  if (ratesErr) {
    throw new Error(`Error al obtener tarifario comercial: ${ratesErr.message}`);
  }

  // Map rates by positionId -> { REGULAR: number, OVERTIME_50: number, OVERTIME_100: number }
  const ratesMap = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();
  for (const r of ratesData || []) {
    const posId = r.position_id;
    if (!ratesMap.has(posId)) {
      ratesMap.set(posId, { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 });
    }
    const current = ratesMap.get(posId)!;
    const code = r.hour_type?.code as 'REGULAR' | 'OVERTIME_50' | 'OVERTIME_100';
    if (code && typeof current[code] !== 'undefined') {
      current[code] = Number(r.hourly_rate || 0);
    }
  }

  // 3. Fetch staff shift entries in the date range
  const shifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate);

  // 4. Calculate for each shift and accumulate by position and type
  const positionSummaryMap = new Map<
    string,
    {
      position_name: string;
      regular_hours: number;
      regular_rate: number;
      overtime_50_hours: number;
      overtime_50_rate: number;
      overtime_100_hours: number;
      overtime_100_rate: number;
      plus_amount: number;
    }
  >();

  let total_regular_hours = 0;
  let total_overtime_50_hours = 0;
  let total_overtime_100_hours = 0;
  let total_pluses = 0;

  const shift_breakdown: CalculatedShiftAuditItem[] = [];

  for (const shift of shifts) {
    const posId = shift.position_id;
    const posRates = ratesMap.get(posId) || { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 };

    const regRate = posRates.REGULAR;
    const ot50Rate = posRates.OVERTIME_50;
    const ot100Rate = posRates.OVERTIME_100;

    const regAmt = shift.regular_hours * regRate;
    const ot50Amt = shift.overtime_50_hours * ot50Rate;
    const ot100Amt = shift.overtime_100_hours * ot100Rate;
    const plusAmt = shift.plus_delta_amount + shift.bonus_applied_amount;
    const shiftSubtotal = regAmt + ot50Amt + ot100Amt + plusAmt;

    shift_breakdown.push({
      ...shift,
      regular_rate: regRate,
      overtime_50_rate: ot50Rate,
      overtime_100_rate: ot100Rate,
      calculated_subtotal: Math.round(shiftSubtotal * 100) / 100,
    });

    total_regular_hours += shift.regular_hours;
    total_overtime_50_hours += shift.overtime_50_hours;
    total_overtime_100_hours += shift.overtime_100_hours;
    total_pluses += plusAmt;

    if (!positionSummaryMap.has(posId)) {
      positionSummaryMap.set(posId, {
        position_name: shift.position_name,
        regular_hours: 0,
        regular_rate: regRate,
        overtime_50_hours: 0,
        overtime_50_rate: ot50Rate,
        overtime_100_hours: 0,
        overtime_100_rate: ot100Rate,
        plus_amount: 0,
      });
    }

    const posSummary = positionSummaryMap.get(posId)!;
    posSummary.regular_hours += shift.regular_hours;
    posSummary.overtime_50_hours += shift.overtime_50_hours;
    posSummary.overtime_100_hours += shift.overtime_100_hours;
    posSummary.plus_amount += plusAmt;
  }

  // 5. Build consolidated line items (Proforma Details)
  const items: ProformaCalculationItem[] = [];
  let calculatedSubtotal = 0;

  for (const [, summary] of positionSummaryMap.entries()) {
    if (summary.regular_hours > 0) {
      const lineSubtotal = Math.round(summary.regular_hours * summary.regular_rate * 100) / 100;
      items.push({
        description: `Servicio ${summary.position_name} - Horas Normales`,
        quantity: Math.round(summary.regular_hours * 100) / 100,
        unit_price: summary.regular_rate,
        subtotal: lineSubtotal,
      });
      calculatedSubtotal += lineSubtotal;
    }

    if (summary.overtime_50_hours > 0) {
      const lineSubtotal = Math.round(summary.overtime_50_hours * summary.overtime_50_rate * 100) / 100;
      items.push({
        description: `Servicio ${summary.position_name} - Horas Extras (50%)`,
        quantity: Math.round(summary.overtime_50_hours * 100) / 100,
        unit_price: summary.overtime_50_rate,
        subtotal: lineSubtotal,
      });
      calculatedSubtotal += lineSubtotal;
    }

    if (summary.overtime_100_hours > 0) {
      const lineSubtotal = Math.round(summary.overtime_100_hours * summary.overtime_100_rate * 100) / 100;
      items.push({
        description: `Servicio ${summary.position_name} - Horas Extras (100% Domingos / Feriados)`,
        quantity: Math.round(summary.overtime_100_hours * 100) / 100,
        unit_price: summary.overtime_100_rate,
        subtotal: lineSubtotal,
      });
      calculatedSubtotal += lineSubtotal;
    }

    if (summary.plus_amount > 0) {
      items.push({
        description: `Adicionales / Pluses Operativos - ${summary.position_name}`,
        quantity: 1,
        unit_price: Math.round(summary.plus_amount * 100) / 100,
        subtotal: Math.round(summary.plus_amount * 100) / 100,
      });
      calculatedSubtotal += summary.plus_amount;
    }
  }

  const tax_rate = 0.21;
  const tax_amount = Math.round(calculatedSubtotal * tax_rate * 100) / 100;
  const total = Math.round((calculatedSubtotal + tax_amount) * 100) / 100;

  return {
    client_id: clientId,
    client_name: clientData.company_name,
    from_date: fromDate,
    to_date: toDate,
    total_shifts: shifts.length,
    total_regular_hours: Math.round(total_regular_hours * 100) / 100,
    total_overtime_50_hours: Math.round(total_overtime_50_hours * 100) / 100,
    total_overtime_100_hours: Math.round(total_overtime_100_hours * 100) / 100,
    total_hours: Math.round((total_regular_hours + total_overtime_50_hours + total_overtime_100_hours) * 100) / 100,
    subtotal: Math.round(calculatedSubtotal * 100) / 100,
    tax_rate,
    tax_amount,
    total,
    items,
    shift_breakdown,
  };
}

export async function createProformaService(
  proforma: ProformaInsert,
  details?: Omit<ProformaDetailInsert, 'proforma_id'>[]
): Promise<ProformaRow> {
  const supabase = createClient() as any;

  // 1. Insert proforma header
  const { data: proformaData, error: proformaError } = await supabase
    .from('proformas')
    .insert(proforma)
    .select('*')
    .single();

  if (proformaError) {
    console.error('Error creating proforma:', proformaError);
    throw new Error(proformaError.message);
  }

  // 2. Insert proforma details if provided
  if (details && details.length > 0) {
    const detailsToInsert = details.map((d) => ({
      proforma_id: proformaData.id,
      description: d.description,
      quantity: d.quantity,
      unit_price: d.unit_price,
    }));

    const { error: detailsError } = await supabase
      .from('proforma_details')
      .insert(detailsToInsert);

    if (detailsError) {
      console.error('Error creating proforma details:', detailsError);
      // Non-fatal if proforma itself succeeded, but report
    }
  }

  return proformaData as ProformaRow;
}

export async function updateProformaStatusService(
  id: string,
  status: ProformaRow['status']
): Promise<ProformaRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('proformas')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating proforma status:', error);
    throw new Error(error.message);
  }

  return data as ProformaRow;
}

export async function deleteProformaService(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('proformas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting proforma:', error);
    throw new Error(error.message);
  }
}

export async function createTaxInvoiceService(invoice: TaxInvoiceInsert): Promise<TaxInvoiceRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('tax_invoices')
    .insert(invoice)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating tax invoice:', error);
    throw new Error(error.message);
  }

  // Auto-update parent proforma to 'invoiced'
  await supabase
    .from('proformas')
    .update({ status: 'invoiced' })
    .eq('id', invoice.proforma_id);

  return data as TaxInvoiceRow;
}

export async function updateTaxInvoiceStatusService(
  id: string,
  status: TaxInvoiceRow['status']
): Promise<TaxInvoiceRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('tax_invoices')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating tax invoice status:', error);
    throw new Error(error.message);
  }

  return data as TaxInvoiceRow;
}

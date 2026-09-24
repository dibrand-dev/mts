import { createClient } from '@/lib/supabase/client';
import {
  InvoicingRecord,
  ProformaRow,
  ProformaInsert,
  ProformaDetailInsert,
  TaxInvoiceRow,
  TaxInvoiceInsert,
  ProformaCalculationContext,
  ProformaCalculationResult,
} from './types';
import { getStrategy, getAllStrategies, getDefaultStrategyForClient } from './registry';

export * from './types';
export * from './registry';
export * from './helpers';

export async function calculateProforma(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
  const strategyType = context.proformaType || 'vessel';
  const strategy = getStrategy(strategyType);
  return strategy.calculate(context);
}

/**
 * Backward-compatible function for existing code invoking calculateClientProforma
 */
export async function calculateClientProforma(
  clientId: string,
  fromDate: string,
  toDate: string,
  options?: {
    proformaType?: string;
    vesselName?: string;
    discountPercentage?: number;
    depositSector?: 'nacional' | 'fiscal' | 'arroz' | string;
    coparticipationFactor?: number;
    shuttleTripsManual?: number;
    notes?: string[];
  }
): Promise<ProformaCalculationResult> {
  return calculateProforma({
    clientId,
    fromDate,
    toDate,
    proformaType: options?.proformaType || 'vessel',
    vesselName: options?.vesselName,
    discountPercentage: options?.discountPercentage,
    depositSector: options?.depositSector,
    coparticipationFactor: options?.coparticipationFactor,
    shuttleTripsManual: options?.shuttleTripsManual,
    notes: options?.notes,
  });
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
    proforma_type: row.proforma_type || 'vessel',
    client_id: row.client_id,
    client_name: row.clients?.company_name || 'Sin Cliente',
    fortnight_period: row.fortnight_period,
    concept_type: row.concept_type,
    status: row.status,
    subtotal: Number(row.subtotal || 0),
    total: Number(row.total || 0),
    issue_date: row.issue_date,
    due_date: row.due_date,
    vessel_name: row.vessel_name || null,
    operation_dates: row.operation_dates || null,
    discount_percentage: Number(row.discount_percentage || 0),
    discount_amount: Number(row.discount_amount || 0),
    subtotal_operativa: Number(row.subtotal_operativa || 0),
    subtotal_encargado: Number(row.subtotal_encargado || 0),
    subtotal_compensacion: Number(row.subtotal_compensacion || 0),
    total_neto: Number(row.total_neto || 0),
    tax_amount: Number(row.tax_amount || 0),
    calculation_payload: row.calculation_payload || null,
    notes: row.notes || [],
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
    proforma_type: data.proforma_type || 'vessel',
    client_id: data.client_id,
    client_name: data.clients?.company_name || 'Sin Cliente',
    fortnight_period: data.fortnight_period,
    concept_type: data.concept_type,
    status: data.status,
    subtotal: Number(data.subtotal || 0),
    total: Number(data.total || 0),
    issue_date: data.issue_date,
    due_date: data.due_date,
    vessel_name: data.vessel_name || null,
    operation_dates: data.operation_dates || null,
    discount_percentage: Number(data.discount_percentage || 0),
    discount_amount: Number(data.discount_amount || 0),
    subtotal_operativa: Number(data.subtotal_operativa || 0),
    subtotal_encargado: Number(data.subtotal_encargado || 0),
    subtotal_compensacion: Number(data.subtotal_compensacion || 0),
    total_neto: Number(data.total_neto || 0),
    tax_amount: Number(data.tax_amount || 0),
    calculation_payload: data.calculation_payload || null,
    notes: data.notes || [],
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


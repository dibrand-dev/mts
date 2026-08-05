import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type ProformaRow = Database['public']['Tables']['proformas']['Row'];
export type ProformaInsert = Database['public']['Tables']['proformas']['Insert'];
export type ProformaUpdate = Database['public']['Tables']['proformas']['Update'];

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
}

export async function getInvoicingRecords(): Promise<InvoicingRecord[]> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('proformas')
    .select(`
      *,
      clients(company_name),
      tax_invoices(*)
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

export async function createProformaService(proforma: ProformaInsert): Promise<ProformaRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('proformas')
    .insert(proforma)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating proforma:', error);
    throw new Error(error.message);
  }

  return data as ProformaRow;
}

export async function updateProformaStatusService(id: string, status: ProformaRow['status']): Promise<ProformaRow> {
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

export async function updateTaxInvoiceStatusService(id: string, status: TaxInvoiceRow['status']): Promise<TaxInvoiceRow> {
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

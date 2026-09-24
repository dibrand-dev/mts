import { Database } from '@/types/database.types';
import { ClientShiftRecordForBilling } from '../daily-entries';

export type ProformaRow = Database['public']['Tables']['proformas']['Row'];
export type ProformaInsert = Database['public']['Tables']['proformas']['Insert'];
export type ProformaUpdate = Database['public']['Tables']['proformas']['Update'];

export type ProformaDetailRow = Database['public']['Tables']['proforma_details']['Row'];
export type ProformaDetailInsert = Database['public']['Tables']['proforma_details']['Insert'];

export type TaxInvoiceRow = Database['public']['Tables']['tax_invoices']['Row'];
export type TaxInvoiceInsert = Database['public']['Tables']['tax_invoices']['Insert'];

export type ProformaType = 'vessel' | 'fiscal_yard' | 'fixed_deposit' | 'shared_expo' | 'standard' | string;

export interface InvoicingRecord {
  id: string;
  proforma_number: string;
  proforma_type: string;
  client_id: string;
  client_name?: string;
  fortnight_period: string;
  concept_type: 'general_hours' | 'shuttles' | 'export_tallymen';
  status: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue';
  subtotal: number;
  total: number;
  issue_date: string;
  due_date: string;
  vessel_name?: string | null;
  operation_dates?: string | null;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal_operativa?: number;
  subtotal_encargado?: number;
  subtotal_compensacion?: number;
  total_neto?: number;
  tax_amount?: number;
  calculation_payload?: any;
  notes?: string[] | null;
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

export interface ProformaCalculationContext {
  clientId: string;
  fromDate: string;
  toDate: string;
  proformaType?: string;
  vesselName?: string;
  discountPercentage?: number;
  depositSector?: 'nacional' | 'fiscal' | 'arroz' | string;
  coparticipationFactor?: number;
  shuttleTripsManual?: number;
  notes?: string[];
}

export interface ProformaCalculationResult {
  client_id: string;
  client_name: string;
  from_date: string;
  to_date: string;
  operation_dates: string;
  vessel_name?: string;
  proforma_type: string;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_neto: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  items: ProformaCalculationItem[];
  shift_breakdown: CalculatedShiftAuditItem[];
  payload: any;
  notes: string[];
  subtotal_operativa?: number;
  subtotal_encargado?: number;
  subtotal_compensacion?: number;
  total_shifts?: number;
  unapproved_shifts_count?: number;
  total_regular_hours?: number;
  total_overtime_50_hours?: number;
  total_overtime_100_hours?: number;
  total_hours?: number;
}

export interface ProformaStrategy {
  type: string;
  label: string;
  description: string;
  defaultConceptType: 'general_hours' | 'shuttles' | 'export_tallymen';
  calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult>;
}


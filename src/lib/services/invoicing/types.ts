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
  client_tax_id?: string | null;
  client_billing_email?: string | null;
  client_phone_number?: string | null;
  fortnight_period: string;
  concept_type: 'general_hours' | 'shuttles' | 'export_tallymen';
  status: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue';
  subtotal: number;
  total: number;
  public_token: string;
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

export interface FiscalYardShiftRow {
  slotPosition: string;       // 'ENCARGADO PF', 'APUNTADOR PF 01' ... 'APUNTADOR PF 13'
  employeeName: string;       // Apellido y Nombre
  workDate: string;           // YYYY-MM-DD
  timeRange: string;          // '07:00-17:00'
  totalHours: number;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  isBonificado?: boolean;
}

export interface FiscalYardPositionSummary {
  slotCode: string;           // 'ENCARGADO PF', 'APUNTADOR PF 01' ... 'APUNTADOR PF 13'
  positionTitle: string;      // 'Encargado Plazoleta' o 'Apuntador Plazoleta'
  assignedEmployee: string;
  totalRegular: number;
  totalOt50: number;
  totalOt100: number;
  totalHours: number;
  regularRate: number;
  ot50Rate: number;
  ot100Rate: number;
  subtotalAmount: number;
  isBonificado?: boolean;
}

export interface FiscalYardPayload {
  proforma_type: 'fiscal_yard';
  operation_dates: string;
  client_name: string;
  discount_percentage: number;
  consolidado: {
    plazoleta_fiscal: number;
    transporte_personal: number;
    control_expo: number;
    total_neto: number;
    iva_21: number;
    total_factura: number;
  };
  tab_plazoleta: {
    horas_encargado: { norm: number; ot50: number; ot100: number };
    horas_apuntador: { norm: number; ot50: number; ot100: number };
    tarifas_encargado: { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number };
    tarifas_apuntador: { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number };
    importes: {
      enc_reg: number;
      enc_ot50: number;
      enc_ot100: number;
      ap_reg: number;
      ap_ot50: number;
      ap_ot100: number;
      neto_sin_bonif: number;
      bonificacion: number;
      subtotal_bonificado: number;
    };
    shift_rows: FiscalYardShiftRow[];
    slots_summary: FiscalYardPositionSummary[];
    totales_grilla: {
      total_regular: number;
      total_ot50: number;
      total_ot100: number;
      total_hours: number;
    };
  };
  tab_transporte: {
    viajes: number;
    tarifa_por_viaje: number;
    total_transporte: number;
  };
  tab_expo: {
    horas_base: { norm: number; ot50: number; ot100: number };
    factor_asignacion: number;
    horas_facturadas: { norm: number; ot50: number; ot100: number };
    importes: { reg: number; ot50: number; ot100: number; total: number };
  };
  notes?: string[];
}

export interface ProformaStrategy {
  type: string;
  label: string;
  description: string;
  defaultConceptType: 'general_hours' | 'shuttles' | 'export_tallymen';
  calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult>;
}




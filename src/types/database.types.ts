export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'accounting_auditor'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'accounting_auditor'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'accounting_auditor'
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          code: string
          name: string
          port_city: string
          status: 'active' | 'maintenance' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          port_city: string
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          port_city?: string
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_name: string
          tax_id: string
          billing_email: string
          phone_number: string | null
          payment_due_days: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          tax_id: string
          billing_email: string
          phone_number?: string | null
          payment_due_days?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          tax_id?: string
          billing_email?: string
          phone_number?: string | null
          payment_due_days?: number
          is_active?: boolean
          created_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          type: 'fixed' | 'variable'
          created_at: string
        }
      }
      expenses: {
        Row: {
          id: string
          category_id: string
          description: string
          amount: number
          expense_date: string
          created_at: string
        }
      }
      cash_movements: {
        Row: {
          id: string
          movement_date: string
          type: 'income' | 'expense'
          area: string
          detail: string
          amount: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          movement_date?: string
          type?: 'income' | 'expense'
          area: string
          detail: string
          amount: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          movement_date?: string
          type?: 'income' | 'expense'
          area?: string
          detail?: string
          amount?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      positions: {
        Row: {
          id: string
          name: string
          requires_vehicle_bonus: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          requires_vehicle_bonus?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          requires_vehicle_bonus?: boolean
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          national_id: string
          file_number: string | null
          tax_id: string | null
          full_name: string
          default_position_id: string | null
          phone_number: string | null
          status: 'active' | 'inactive' | 'on_leave'
          created_at: string
        }
        Insert: {
          id?: string
          national_id: string
          file_number?: string | null
          tax_id?: string | null
          full_name: string
          default_position_id?: string | null
          phone_number?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          created_at?: string
        }
        Update: {
          id?: string
          national_id?: string
          file_number?: string | null
          tax_id?: string | null
          full_name?: string
          default_position_id?: string | null
          phone_number?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          created_at?: string
        }
      }
      daily_work_logs: {
        Row: {
          id: string
          work_date: string
          client_id: string
          location_id: string | null
          total_vehicles_handled: number
          is_export_day: boolean
          logged_by: string
          vessel_name: string | null
          vehicles_discharged: number
          vehicles_loaded: number
          vehicles_shifted: number
          vehicles_regular_time: number
          vehicles_overtime: number
          created_at: string
        }
        Insert: {
          id?: string
          work_date?: string
          client_id: string
          location_id?: string | null
          total_vehicles_handled?: number
          is_export_day?: boolean
          logged_by: string
          vessel_name?: string | null
          vehicles_discharged?: number
          vehicles_loaded?: number
          vehicles_shifted?: number
          vehicles_regular_time?: number
          vehicles_overtime?: number
          created_at?: string
        }
        Update: {
          id?: string
          work_date?: string
          client_id?: string
          location_id?: string | null
          total_vehicles_handled?: number
          is_export_day?: boolean
          logged_by?: string
          vessel_name?: string | null
          vehicles_discharged?: number
          vehicles_loaded?: number
          vehicles_shifted?: number
          vehicles_regular_time?: number
          vehicles_overtime?: number
          created_at?: string
        }
      }
      daily_staff_entries: {
        Row: {
          id: string
          daily_work_log_id: string
          employee_id: string
          position_id: string
          shift_start_date: string
          shift_start_time: string
          shift_end_date: string
          shift_end_time: string
          regular_hours: number
          overtime_50_hours: number
          overtime_100_hours: number
          shuttles_count: number
          plus_delta_amount: number
          meal_allowance_count: number
          advance_payment_amount: number
          is_day_off: boolean
          bonus_applied_amount: number
          is_approved: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_work_log_id: string
          employee_id: string
          position_id: string
          shift_start_date?: string
          shift_start_time: string
          shift_end_date?: string
          shift_end_time: string
          regular_hours?: number
          overtime_50_hours?: number
          overtime_100_hours?: number
          shuttles_count?: number
          plus_delta_amount?: number
          meal_allowance_count?: number
          advance_payment_amount?: number
          is_day_off?: boolean
          bonus_applied_amount?: number
          is_approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_work_log_id?: string
          employee_id?: string
          position_id?: string
          shift_start_date?: string
          shift_start_time?: string
          shift_end_date?: string
          shift_end_time?: string
          regular_hours?: number
          overtime_50_hours?: number
          overtime_100_hours?: number
          shuttles_count?: number
          plus_delta_amount?: number
          meal_allowance_count?: number
          advance_payment_amount?: number
          is_day_off?: boolean
          bonus_applied_amount?: number
          is_approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
      }
      proformas: {
        Row: {
          id: string
          proforma_number: string
          client_id: string
          fortnight_period: string
          concept_type: 'general_hours' | 'shuttles' | 'export_tallymen'
          status: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue'
          subtotal: number
          total: number
          public_token: string
          issue_date: string
          due_date: string
          vessel_name: string | null
          operation_dates: string | null
          discount_percentage: number
          discount_amount: number
          subtotal_operativa: number
          subtotal_encargado: number
          subtotal_compensacion: number
          total_neto: number
          tax_amount: number
          proforma_type: string
          calculation_payload: any
          notes: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          proforma_number: string
          client_id: string
          fortnight_period: string
          concept_type: 'general_hours' | 'shuttles' | 'export_tallymen'
          status?: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue'
          subtotal?: number
          total?: number
          public_token?: string
          issue_date?: string
          due_date: string
          vessel_name?: string | null
          operation_dates?: string | null
          discount_percentage?: number
          discount_amount?: number
          subtotal_operativa?: number
          subtotal_encargado?: number
          subtotal_compensacion?: number
          total_neto?: number
          tax_amount?: number
          proforma_type?: string
          calculation_payload?: any
          notes?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          proforma_number?: string
          client_id?: string
          fortnight_period?: string
          concept_type?: 'general_hours' | 'shuttles' | 'export_tallymen'
          status?: 'draft' | 'sent' | 'approved' | 'invoiced' | 'paid' | 'overdue'
          subtotal?: number
          total?: number
          public_token?: string
          issue_date?: string
          due_date?: string
          vessel_name?: string | null
          operation_dates?: string | null
          discount_percentage?: number
          discount_amount?: number
          subtotal_operativa?: number
          subtotal_encargado?: number
          subtotal_compensacion?: number
          total_neto?: number
          tax_amount?: number
          proforma_type?: string
          calculation_payload?: any
          notes?: string[] | null
          created_at?: string
        }
      }
      proforma_details: {
        Row: {
          id: string
          proforma_id: string
          description: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          proforma_id: string
          description: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          proforma_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      tax_invoices: {
        Row: {
          id: string
          proforma_id: string
          invoice_number: string
          pdf_storage_path: string
          invoiced_amount: number
          status: 'pending' | 'paid'
          invoice_date: string
          created_at: string
        }
        Insert: {
          id?: string
          proforma_id: string
          invoice_number: string
          pdf_storage_path?: string
          invoiced_amount: number
          status?: 'pending' | 'paid'
          invoice_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          proforma_id?: string
          invoice_number?: string
          pdf_storage_path?: string
          invoiced_amount?: number
          status?: 'pending' | 'paid'
          invoice_date?: string
          created_at?: string
        }
      }
      hour_types: {
        Row: {
          id: string
          code: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          created_at?: string
        }
      }
      client_position_rates: {
        Row: {
          id: string
          client_id: string
          position_id: string
          hour_type_id: string
          hourly_rate: number
          effective_from: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          position_id: string
          hour_type_id: string
          hourly_rate: number
          effective_from?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          position_id?: string
          hour_type_id?: string
          hourly_rate?: number
          effective_from?: string
          created_at?: string
        }
      }
      client_service_rates: {
        Row: {
          id: string
          client_id: string
          service_code: string
          description: string
          rate_value: number
          effective_from: string
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          service_code: string
          description: string
          rate_value: number
          effective_from?: string
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          service_code?: string
          description?: string
          rate_value?: number
          effective_from?: string
          metadata?: any
          created_at?: string
        }
      }
      client_operations: {
        Row: {
          id: string
          client_id: string
          name: string
          operation_type: 'vessel' | 'yard' | 'deposit' | 'general'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          operation_type?: 'vessel' | 'yard' | 'deposit' | 'general'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          operation_type?: 'vessel' | 'yard' | 'deposit' | 'general'
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}


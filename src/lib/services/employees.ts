import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type EmployeeRow = Database['public']['Tables']['employees']['Row'] & {
  default_position?: Database['public']['Tables']['positions']['Row'] | null;
};
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];
export type PositionRow = Database['public']['Tables']['positions']['Row'];

export async function getEmployees(): Promise<EmployeeRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      default_position:positions(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching employees:', error);
    throw new Error(error.message);
  }

  return (data || []) as EmployeeRow[];
}

export async function getPositions(): Promise<PositionRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching positions:', error);
    throw new Error(error.message);
  }

  return (data || []) as PositionRow[];
}

export async function createEmployee(employee: EmployeeInsert): Promise<EmployeeRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select(`
      *,
      default_position:positions(*)
    `)
    .single();

  if (error) {
    console.error('Error creating employee:', error);
    throw new Error(error.message);
  }

  return data as EmployeeRow;
}

export async function updateEmployee(id: string, employee: EmployeeUpdate): Promise<EmployeeRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('employees')
    .update(employee)
    .eq('id', id)
    .select(`
      *,
      default_position:positions(*)
    `)
    .single();

  if (error) {
    console.error('Error updating employee:', error);
    throw new Error(error.message);
  }

  return data as EmployeeRow;
}

export async function deleteEmployee(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    throw new Error(error.message);
  }
}

export interface EmployeeShiftAuditItem {
  id: string;
  work_date: string;
  client_id: string;
  client_name: string;
  location_id: string | null;
  location_name: string;
  position_id: string;
  position_name: string;
  shift_start_time: string;
  shift_end_time: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  total_hours: number;
  plus_delta_amount: number;
}

export interface EmployeeHoursSummary {
  employee_id: string;
  shifts_count: number;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  total_hours: number;
  plus_amount: number;
  shifts: EmployeeShiftAuditItem[];
}

export async function getEmployeeAuditShifts(
  employeeId: string,
  fromDate?: string,
  toDate?: string
): Promise<EmployeeHoursSummary> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('daily_staff_entries')
    .select(`
      id,
      shift_start_time,
      shift_end_time,
      regular_hours,
      overtime_50_hours,
      overtime_100_hours,
      plus_delta_amount,
      position:positions(id, name),
      work_log:daily_work_logs(
        id,
        work_date,
        client:clients(id, company_name),
        location:locations(id, name)
      )
    `)
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error fetching employee audit shifts:', error);
    throw new Error(error.message);
  }

  let filtered = data || [];
  if (fromDate) {
    filtered = filtered.filter((row: any) => (row.work_log?.work_date || '') >= fromDate);
  }
  if (toDate) {
    filtered = filtered.filter((row: any) => (row.work_log?.work_date || '') <= toDate);
  }

  filtered.sort((a: any, b: any) => (a.work_log?.work_date || '').localeCompare(b.work_log?.work_date || ''));

  let regular_hours = 0;
  let overtime_50_hours = 0;
  let overtime_100_hours = 0;
  let plus_amount = 0;

  const shifts: EmployeeShiftAuditItem[] = filtered.map((row: any) => {
    const reg = Number(row.regular_hours || 0);
    const ot50 = Number(row.overtime_50_hours || 0);
    const ot100 = Number(row.overtime_100_hours || 0);
    const plus = Number(row.plus_delta_amount || 0);

    regular_hours += reg;
    overtime_50_hours += ot50;
    overtime_100_hours += ot100;
    plus_amount += plus;

    return {
      id: row.id,
      work_date: row.work_log?.work_date || '-',
      client_id: row.work_log?.client?.id || '',
      client_name: row.work_log?.client?.company_name || 'Sin Cliente',
      location_id: row.work_log?.location?.id || null,
      location_name: row.work_log?.location?.name || 'Muelle / Locación',
      position_id: row.position?.id || '',
      position_name: row.position?.name || 'Puesto',
      shift_start_time: row.shift_start_time || '',
      shift_end_time: row.shift_end_time || '',
      regular_hours: reg,
      overtime_50_hours: ot50,
      overtime_100_hours: ot100,
      total_hours: reg + ot50 + ot100,
      plus_delta_amount: plus,
    };
  });

  return {
    employee_id: employeeId,
    shifts_count: shifts.length,
    regular_hours: Math.round(regular_hours * 100) / 100,
    overtime_50_hours: Math.round(overtime_50_hours * 100) / 100,
    overtime_100_hours: Math.round(overtime_100_hours * 100) / 100,
    total_hours: Math.round((regular_hours + overtime_50_hours + overtime_100_hours) * 100) / 100,
    plus_amount: Math.round(plus_amount * 100) / 100,
    shifts,
  };
}

export async function getAllEmployeesHoursSummary(
  fromDate?: string,
  toDate?: string
): Promise<Record<string, { total_hours: number; regular_hours: number; ot50_hours: number; ot100_hours: number; shifts_count: number }>> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('daily_staff_entries')
    .select(`
      employee_id,
      regular_hours,
      overtime_50_hours,
      overtime_100_hours,
      work_log:daily_work_logs(work_date)
    `);

  if (error) {
    console.error('Error fetching all employees hours summary:', error);
    return {};
  }

  const map: Record<string, { total_hours: number; regular_hours: number; ot50_hours: number; ot100_hours: number; shifts_count: number }> = {};

  for (const row of data || []) {
    const workDate = row.work_log?.work_date;
    if (!workDate) continue;
    if (fromDate && workDate < fromDate) continue;
    if (toDate && workDate > toDate) continue;

    const empId = row.employee_id;
    if (!map[empId]) {
      map[empId] = { total_hours: 0, regular_hours: 0, ot50_hours: 0, ot100_hours: 0, shifts_count: 0 };
    }

    const reg = Number(row.regular_hours || 0);
    const ot50 = Number(row.overtime_50_hours || 0);
    const ot100 = Number(row.overtime_100_hours || 0);

    map[empId].regular_hours += reg;
    map[empId].ot50_hours += ot50;
    map[empId].ot100_hours += ot100;
    map[empId].total_hours += (reg + ot50 + ot100);
    map[empId].shifts_count += 1;
  }

  return map;
}

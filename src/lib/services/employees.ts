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

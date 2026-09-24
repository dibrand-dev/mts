import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { upsertClientRates, deleteClientRates, SaveRatePayload } from '@/lib/services/rates';

export type PositionRow = Database['public']['Tables']['positions']['Row'];
export type PositionInsert = Database['public']['Tables']['positions']['Insert'];
export type PositionUpdate = Database['public']['Tables']['positions']['Update'];

export interface AssignedEmployee {
  id: string;
  full_name: string;
  national_id: string;
  file_number: string | null;
  tax_id: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  phone_number: string | null;
}

export interface PositionClientRateSummary {
  client_id: string;
  client_name: string;
  effective_from: string;
  rate_regular: number;
  rate_overtime_50: number;
  rate_overtime_100: number;
}

export interface PositionWithDetails extends PositionRow {
  employees_count: number;
  assigned_employees: AssignedEmployee[];
  rates_count: number;
  client_rates: PositionClientRateSummary[];
}

export interface SimpleClient {
  id: string;
  company_name: string;
  tax_id: string;
  is_active: boolean;
}

export interface SimpleEmployee {
  id: string;
  full_name: string;
  national_id: string;
  file_number: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  default_position_id: string | null;
  default_position_name?: string | null;
}

/**
 * Fetches all positions enriched with assigned employees and configured client rates.
 */
export async function getPositionsWithDetails(): Promise<PositionWithDetails[]> {
  const supabase = createClient() as any;

  // 1. Fetch all positions
  const { data: positionsData, error: posError } = await supabase
    .from('positions')
    .select('*')
    .order('name', { ascending: true });

  if (posError) {
    console.error('Error fetching positions:', posError);
    throw new Error(posError.message);
  }

  const positions: PositionRow[] = positionsData || [];

  if (positions.length === 0) {
    return [];
  }

  // 2. Fetch all employees with their default position
  const { data: employeesData, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, national_id, file_number, tax_id, status, phone_number, default_position_id')
    .order('full_name', { ascending: true });

  if (empError) {
    console.error('Error fetching employees for positions:', empError);
  }

  // 3. Fetch all client position rates with clients and hour types
  const { data: ratesData, error: ratesError } = await supabase
    .from('client_position_rates')
    .select(`
      id,
      client_id,
      position_id,
      hourly_rate,
      effective_from,
      client:clients(id, company_name),
      hour_type:hour_types(id, code)
    `);

  if (ratesError) {
    console.error('Error fetching rates for positions:', ratesError);
  }

  // Group employees by default_position_id
  const employeesByPosition = new Map<string, AssignedEmployee[]>();
  for (const emp of employeesData || []) {
    if (!emp.default_position_id) continue;
    if (!employeesByPosition.has(emp.default_position_id)) {
      employeesByPosition.set(emp.default_position_id, []);
    }
    employeesByPosition.get(emp.default_position_id)!.push({
      id: emp.id,
      full_name: emp.full_name,
      national_id: emp.national_id,
      file_number: emp.file_number,
      tax_id: emp.tax_id,
      status: emp.status,
      phone_number: emp.phone_number,
    });
  }

  // Group client rates by position_id and client_id + effective_from
  const ratesByPosition = new Map<string, Map<string, PositionClientRateSummary>>();

  for (const r of ratesData || []) {
    if (!r.position_id || !r.client) continue;

    if (!ratesByPosition.has(r.position_id)) {
      ratesByPosition.set(r.position_id, new Map());
    }

    const posMap = ratesByPosition.get(r.position_id)!;
    const groupKey = `${r.client_id}_${r.effective_from}`;

    if (!posMap.has(groupKey)) {
      posMap.set(groupKey, {
        client_id: r.client_id,
        client_name: r.client.company_name,
        effective_from: r.effective_from,
        rate_regular: 0,
        rate_overtime_50: 0,
        rate_overtime_100: 0,
      });
    }

    const summary = posMap.get(groupKey)!;
    const rateVal = Number(r.hourly_rate) || 0;
    const code = r.hour_type?.code;

    if (code === 'REGULAR') {
      summary.rate_regular = rateVal;
    } else if (code === 'OVERTIME_50') {
      summary.rate_overtime_50 = rateVal;
    } else if (code === 'OVERTIME_100') {
      summary.rate_overtime_100 = rateVal;
    }
  }

  // Combine into PositionWithDetails
  return positions.map((p) => {
    const assigned = employeesByPosition.get(p.id) || [];
    const clientRatesMap = ratesByPosition.get(p.id);
    const clientRates = clientRatesMap ? Array.from(clientRatesMap.values()) : [];

    return {
      ...p,
      employees_count: assigned.length,
      assigned_employees: assigned,
      rates_count: clientRates.length,
      client_rates: clientRates,
    };
  });
}

/**
 * Creates a new position.
 */
export async function createPosition(payload: {
  name: string;
  requires_vehicle_bonus: boolean;
}): Promise<PositionRow> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('positions')
    .insert({
      name: payload.name.trim(),
      requires_vehicle_bonus: payload.requires_vehicle_bonus,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating position:', error);
    if (error.code === '23505') {
      throw new Error(`Ya existe un puesto de trabajo con el nombre "${payload.name.trim()}".`);
    }
    throw new Error(error.message || 'Error al crear el puesto.');
  }

  return data as PositionRow;
}

/**
 * Updates an existing position.
 */
export async function updatePosition(
  id: string,
  payload: {
    name: string;
    requires_vehicle_bonus: boolean;
  }
): Promise<PositionRow> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('positions')
    .update({
      name: payload.name.trim(),
      requires_vehicle_bonus: payload.requires_vehicle_bonus,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating position:', error);
    if (error.code === '23505') {
      throw new Error(`Ya existe un puesto de trabajo con el nombre "${payload.name.trim()}".`);
    }
    throw new Error(error.message || 'Error al actualizar el puesto.');
  }

  return data as PositionRow;
}

/**
 * Deletes a position.
 * Protects against deletion if it is referenced in historical daily staff entries.
 */
export async function deletePosition(id: string): Promise<void> {
  const supabase = createClient() as any;

  // 1. Check if the position is used in daily_staff_entries (historical shift records)
  const { data: shiftEntries, error: checkError } = await supabase
    .from('daily_staff_entries')
    .select('id')
    .eq('position_id', id)
    .limit(1);

  if (checkError) {
    console.error('Error checking position shift usage:', checkError);
  }

  if (shiftEntries && shiftEntries.length > 0) {
    throw new Error(
      'No se puede eliminar este puesto porque cuenta con turnos y partes diarios operativos históricos registrados. Puede renombrarlo o desasignar al personal.'
    );
  }

  // 2. Unassign any employees that currently have this position as default
  const { error: unassignError } = await supabase
    .from('employees')
    .update({ default_position_id: null })
    .eq('default_position_id', id);

  if (unassignError) {
    console.error('Error unassigning employees from position before deletion:', unassignError);
  }

  // 3. Delete rates for this position (CASCADE will also do it, but explicit delete is safe)
  await supabase
    .from('client_position_rates')
    .delete()
    .eq('position_id', id);

  // 4. Delete the position
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting position:', error);
    throw new Error(error.message || 'Error al eliminar el puesto.');
  }
}

/**
 * Gets all employees for the assignment selector, including their current position name.
 */
export async function getAllEmployeesForPositionAssignment(): Promise<SimpleEmployee[]> {
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      full_name,
      national_id,
      file_number,
      status,
      default_position_id,
      default_position:positions(name)
    `)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching employees for assignment:', error);
    throw new Error(error.message);
  }

  return (data || []).map((emp: any) => ({
    id: emp.id,
    full_name: emp.full_name,
    national_id: emp.national_id,
    file_number: emp.file_number,
    status: emp.status,
    default_position_id: emp.default_position_id,
    default_position_name: emp.default_position?.name || null,
  }));
}

/**
 * Bulk assigns a set of employees to a position, and unassigns any that were removed.
 */
export async function bulkAssignEmployeesToPosition(
  positionId: string,
  selectedEmployeeIds: string[],
  previouslyAssignedIds: string[]
): Promise<void> {
  const supabase = createClient() as any;

  const selectedSet = new Set(selectedEmployeeIds);
  const previousSet = new Set(previouslyAssignedIds);

  const toAdd = selectedEmployeeIds.filter((id) => !previousSet.has(id));
  const toRemove = previouslyAssignedIds.filter((id) => !selectedSet.has(id));

  // 1. Assign new employees to this position
  if (toAdd.length > 0) {
    const { error: addError } = await supabase
      .from('employees')
      .update({ default_position_id: positionId })
      .in('id', toAdd);

    if (addError) {
      console.error('Error assigning employees to position:', addError);
      throw new Error(`Error al asignar colaboradores: ${addError.message}`);
    }
  }

  // 2. Unassign removed employees (set default_position_id to null)
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from('employees')
      .update({ default_position_id: null })
      .in('id', toRemove);

    if (removeError) {
      console.error('Error unassigning employees from position:', removeError);
      throw new Error(`Error al desasignar colaboradores: ${removeError.message}`);
    }
  }
}

/**
 * Assigns or updates a client commercial rate for this position.
 */
export async function assignPositionClientRate(payload: SaveRatePayload): Promise<void> {
  return upsertClientRates(payload);
}

/**
 * Deletes a client commercial rate for this position.
 */
export async function removePositionClientRate(
  clientId: string,
  positionId: string,
  effectiveFrom: string
): Promise<void> {
  return deleteClientRates(clientId, positionId, effectiveFrom);
}

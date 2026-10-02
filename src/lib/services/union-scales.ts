import { createClient } from '../supabase/client';
import { Database } from '../../types/database.types';

export type UnionBonusScaleRow = Database['public']['Tables']['union_bonus_scales']['Row'];
export type UnionBonusScaleInsert = Database['public']['Tables']['union_bonus_scales']['Insert'];
export type UnionBonusScaleUpdate = Database['public']['Tables']['union_bonus_scales']['Update'];

export const DEFAULT_UNION_SCALES = [
  { min_vehicles: 0, max_vehicles: 1499, bonus_amount: 88200.48, effective_from: '2026-01-01' },
  { min_vehicles: 1500, max_vehicles: 1999, bonus_amount: 102015.99, effective_from: '2026-01-01' },
  { min_vehicles: 2000, max_vehicles: 2499, bonus_amount: 118540.55, effective_from: '2026-01-01' },
  { min_vehicles: 2500, max_vehicles: 2999, bonus_amount: 135065.11, effective_from: '2026-01-01' },
  { min_vehicles: 3000, max_vehicles: 99999, bonus_amount: 155000.00, effective_from: '2026-01-01' },
];

/**
 * Obtiene todas las escalas de bonificación vehicular CCT ordenadas por vigencia y unidades.
 */
export async function getUnionBonusScales(): Promise<UnionBonusScaleRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('union_bonus_scales')
    .select('*')
    .order('effective_from', { ascending: false })
    .order('min_vehicles', { ascending: true });

  if (error) {
    console.error('Error fetching union bonus scales:', error);
    throw new Error(`Error al obtener escalas CCT: ${error.message}`);
  }

  // Auto-seed si la tabla está vacía
  if (!data || data.length === 0) {
    const { data: seeded, error: seedError } = await supabase
      .from('union_bonus_scales')
      .insert(DEFAULT_UNION_SCALES)
      .select('*')
      .order('min_vehicles', { ascending: true });

    if (!seedError && seeded && seeded.length > 0) {
      return seeded as UnionBonusScaleRow[];
    }
  }

  return (data || []) as UnionBonusScaleRow[];
}

/**
 * Crea o actualiza un rango de la escala de bonificación vehicular.
 */
export async function saveUnionBonusScale(
  payload: UnionBonusScaleInsert & { id?: string }
): Promise<UnionBonusScaleRow> {
  const supabase = createClient();

  if (payload.id) {
    const { id, ...updates } = payload;
    const { data, error } = await supabase
      .from('union_bonus_scales')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating union bonus scale:', error);
      throw new Error(`Error al actualizar escala: ${error.message}`);
    }
    return data as UnionBonusScaleRow;
  }

  const { data, error } = await supabase
    .from('union_bonus_scales')
    .insert({
      min_vehicles: payload.min_vehicles,
      max_vehicles: payload.max_vehicles,
      bonus_amount: payload.bonus_amount,
      effective_from: payload.effective_from || new Date().toISOString().split('T')[0],
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating union bonus scale:', error);
    throw new Error(`Error al crear escala: ${error.message}`);
  }

  return data as UnionBonusScaleRow;
}

/**
 * Elimina un rango de la escala.
 */
export async function deleteUnionBonusScale(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('union_bonus_scales')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting union bonus scale:', error);
    throw new Error(`Error al eliminar escala: ${error.message}`);
  }
}

/**
 * Función pura que calcula el monto de bonificación correspondiente según la cantidad de unidades operadas.
 * Cruza la escala por rango [min_vehicles, max_vehicles] y vigencia.
 */
export function calculateBonusForVehicles(
  vehiclesCount: number,
  scales: Array<{ min_vehicles: number; max_vehicles: number; bonus_amount: number; effective_from: string }>,
  workDate?: string
): number {
  if (!vehiclesCount || vehiclesCount <= 0 || !scales || scales.length === 0) {
    return 0;
  }

  const targetDate = workDate || new Date().toISOString().split('T')[0];

  // Filtrar escalas vigentes a la fecha
  const validScales = scales
    .filter((s) => s.effective_from <= targetDate)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));

  // Buscar coincidencia en el rango
  const matched = validScales.find(
    (s) => vehiclesCount >= s.min_vehicles && vehiclesCount <= s.max_vehicles
  );

  if (matched) {
    return Number(matched.bonus_amount || 0);
  }

  // Si supera el máximo de todas las escalas, tomar el tramo superior
  const highestScale = validScales.reduce(
    (prev, curr) => (curr.max_vehicles > prev.max_vehicles ? curr : prev),
    validScales[0]
  );

  if (highestScale && vehiclesCount > highestScale.max_vehicles) {
    return Number(highestScale.bonus_amount || 0);
  }

  return 0;
}

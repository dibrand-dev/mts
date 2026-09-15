/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

export type CashMovementRow = Database['public']['Tables']['cash_movements']['Row'];
export type CashMovementInsert = Database['public']['Tables']['cash_movements']['Insert'];
export type CashMovementUpdate = Database['public']['Tables']['cash_movements']['Update'];

export async function getCashMovements(): Promise<CashMovementRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cash movements:', error);
    throw new Error(error.message);
  }

  return (data || []) as CashMovementRow[];
}

export async function createCashMovement(movement: CashMovementInsert): Promise<CashMovementRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('cash_movements')
    .insert(movement)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating cash movement:', error);
    throw new Error(error.message);
  }

  return data as CashMovementRow;
}

export async function updateCashMovement(id: string, movement: CashMovementUpdate): Promise<CashMovementRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('cash_movements')
    .update({
      ...movement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating cash movement:', error);
    throw new Error(error.message);
  }

  return data as CashMovementRow;
}

export async function deleteCashMovement(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('cash_movements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting cash movement:', error);
    throw new Error(error.message);
  }
}


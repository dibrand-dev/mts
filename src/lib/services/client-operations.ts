import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type ClientOperationRow = Database['public']['Tables']['client_operations']['Row'];
export type ClientOperationInsert = Database['public']['Tables']['client_operations']['Insert'];

export async function getClientOperations(clientId?: string): Promise<ClientOperationRow[]> {
  const supabase = createClient() as any;
  let query = supabase
    .from('client_operations')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching client operations:', error);
    throw new Error(error.message);
  }

  return (data || []) as ClientOperationRow[];
}

export async function createClientOperation(payload: {
  client_id: string;
  name: string;
  operation_type?: 'vessel' | 'yard' | 'deposit' | 'general';
}): Promise<ClientOperationRow> {
  const supabase = createClient() as any;
  const cleanName = payload.name.trim().toUpperCase();

  if (!cleanName) {
    throw new Error('El nombre del buque u operación no puede estar vacío.');
  }

  const { data, error } = await supabase
    .from('client_operations')
    .upsert(
      {
        client_id: payload.client_id,
        name: cleanName,
        operation_type: payload.operation_type || 'vessel',
        is_active: true,
      },
      { onConflict: 'client_id,name' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('Error creating client operation:', error);
    throw new Error(error.message);
  }

  return data as ClientOperationRow;
}

export async function deleteClientOperation(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('client_operations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client operation:', error);
    throw new Error(error.message);
  }
}


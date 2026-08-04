import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export async function getClients(): Promise<ClientRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }

  return (data || []) as ClientRow[];
}

export async function createClientService(client: ClientInsert): Promise<ClientRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error.message);
  }

  return data as ClientRow;
}

export async function updateClientService(id: string, client: ClientUpdate): Promise<ClientRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error(error.message);
  }

  return data as ClientRow;
}

export async function deleteClientService(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error(error.message);
  }
}

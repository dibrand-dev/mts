import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type LocationRow = Database['public']['Tables']['locations']['Row'];
export type LocationInsert = Database['public']['Tables']['locations']['Insert'];
export type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export async function getLocations(): Promise<LocationRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error(error.message);
  }

  return (data || []) as LocationRow[];
}

export async function createLocation(location: LocationInsert): Promise<LocationRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating location:', error);
    throw new Error(error.message);
  }

  return data as LocationRow;
}

export async function updateLocation(id: string, location: LocationUpdate): Promise<LocationRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('locations')
    .update(location)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating location:', error);
    throw new Error(error.message);
  }

  return data as LocationRow;
}

export async function deleteLocation(id: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    throw new Error(error.message);
  }
}

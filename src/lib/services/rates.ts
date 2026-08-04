import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type PositionRow = Database['public']['Tables']['positions']['Row'];
export type HourTypeRow = Database['public']['Tables']['hour_types']['Row'];

export interface CommercialRateGroup {
  client_id: string;
  client: ClientRow;
  position_id: string;
  position: PositionRow;
  effective_from: string;
  rate_regular: number;
  rate_regular_id?: string;
  rate_overtime_50: number;
  rate_overtime_50_id?: string;
  rate_overtime_100: number;
  rate_overtime_100_id?: string;
}

export interface SaveRatePayload {
  client_id: string;
  position_id: string;
  effective_from: string;
  rate_regular: number;
  rate_overtime_50: number;
  rate_overtime_100: number;
}

export async function getClients(): Promise<ClientRow[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }

  return (data || []) as ClientRow[];
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

export async function getHourTypes(): Promise<HourTypeRow[]> {
  const supabase = createClient() as any;
  let { data, error } = await supabase
    .from('hour_types')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching hour types:', error);
    throw new Error(error.message);
  }

  const currentTypes = (data || []) as HourTypeRow[];
  const existingCodes = new Set(currentTypes.map((ht) => ht.code));

  const defaultHourTypes = [
    { code: 'REGULAR', description: 'Hora Normal' },
    { code: 'OVERTIME_50', description: 'Hora Extra 50%' },
    { code: 'OVERTIME_100', description: 'Hora Extra 100%' },
  ];

  const missingTypes = defaultHourTypes.filter((ht) => !existingCodes.has(ht.code));

  if (missingTypes.length > 0) {
    const { error: insertError } = await supabase
      .from('hour_types')
      .upsert(missingTypes, { onConflict: 'code' });

    if (!insertError) {
      const { data: refetchedData } = await supabase
        .from('hour_types')
        .select('*')
        .order('code', { ascending: true });

      if (refetchedData) {
        data = refetchedData;
      }
    } else {
      console.error('Error auto-seeding missing hour types:', insertError);
    }
  }

  return (data || []) as HourTypeRow[];
}


export async function getRates(): Promise<CommercialRateGroup[]> {
  const supabase = createClient() as any;

  // Ensure hour types exist or fetch them
  const hourTypes = await getHourTypes();
  const regularType = hourTypes.find((ht) => ht.code === 'REGULAR');
  const overtime50Type = hourTypes.find((ht) => ht.code === 'OVERTIME_50');
  const overtime100Type = hourTypes.find((ht) => ht.code === 'OVERTIME_100');

  const { data, error } = await supabase
    .from('client_position_rates')
    .select(`
      *,
      client:clients(*),
      position:positions(*),
      hour_type:hour_types(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client rates:', error);
    throw new Error(error.message);
  }

  const rawRates = data || [];

  // Group rates by `${client_id}_${position_id}_${effective_from}`
  const groupedMap = new Map<string, CommercialRateGroup>();

  for (const item of rawRates) {
    if (!item.client || !item.position || !item.hour_type) continue;

    const key = `${item.client_id}_${item.position_id}_${item.effective_from}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        client_id: item.client_id,
        client: item.client,
        position_id: item.position_id,
        position: item.position,
        effective_from: item.effective_from,
        rate_regular: 0,
        rate_overtime_50: 0,
        rate_overtime_100: 0,
      });
    }

    const group = groupedMap.get(key)!;
    const rateVal = Number(item.hourly_rate) || 0;

    if (item.hour_type.code === 'REGULAR' || item.hour_type_id === regularType?.id) {
      group.rate_regular = rateVal;
      group.rate_regular_id = item.id;
    } else if (item.hour_type.code === 'OVERTIME_50' || item.hour_type_id === overtime50Type?.id) {
      group.rate_overtime_50 = rateVal;
      group.rate_overtime_50_id = item.id;
    } else if (item.hour_type.code === 'OVERTIME_100' || item.hour_type_id === overtime100Type?.id) {
      group.rate_overtime_100 = rateVal;
      group.rate_overtime_100_id = item.id;
    }
  }

  return Array.from(groupedMap.values());
}

export async function upsertClientRates(payload: SaveRatePayload): Promise<void> {
  const supabase = createClient() as any;

  // Get hour types to resolve IDs
  const hourTypes = await getHourTypes();
  const regularType = hourTypes.find((ht) => ht.code === 'REGULAR');
  const overtime50Type = hourTypes.find((ht) => ht.code === 'OVERTIME_50');
  const overtime100Type = hourTypes.find((ht) => ht.code === 'OVERTIME_100');

  if (!regularType || !overtime50Type || !overtime100Type) {
    throw new Error('No se encontraron los tipos de hora configurados (REGULAR, OVERTIME_50, OVERTIME_100).');
  }

  const ratesToUpsert = [
    {
      client_id: payload.client_id,
      position_id: payload.position_id,
      hour_type_id: regularType.id,
      hourly_rate: payload.rate_regular,
      effective_from: payload.effective_from,
    },
    {
      client_id: payload.client_id,
      position_id: payload.position_id,
      hour_type_id: overtime50Type.id,
      hourly_rate: payload.rate_overtime_50,
      effective_from: payload.effective_from,
    },
    {
      client_id: payload.client_id,
      position_id: payload.position_id,
      hour_type_id: overtime100Type.id,
      hourly_rate: payload.rate_overtime_100,
      effective_from: payload.effective_from,
    },
  ];

  const { error } = await supabase
    .from('client_position_rates')
    .upsert(ratesToUpsert, {
      onConflict: 'client_id,position_id,hour_type_id,effective_from',
    });

  if (error) {
    console.error('Error saving client position rates:', error);
    throw new Error(error.message);
  }
}

export async function deleteClientRates(
  client_id: string,
  position_id: string,
  effective_from: string
): Promise<void> {
  const supabase = createClient() as any;

  const { error } = await supabase
    .from('client_position_rates')
    .delete()
    .eq('client_id', client_id)
    .eq('position_id', position_id)
    .eq('effective_from', effective_from);

  if (error) {
    console.error('Error deleting client position rates:', error);
    throw new Error(error.message);
  }
}

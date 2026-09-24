import { createClient } from '@/lib/supabase/client';

export function formatDatesSpan(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) return '';
  const f = new Date(`${fromDate}T12:00:00`);
  const t = new Date(`${toDate}T12:00:00`);
  const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  
  if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()) {
    return `${f.getDate()}-${t.getDate()} ${months[f.getMonth()]} ${f.getFullYear()}`;
  }
  return `${f.getDate()} ${months[f.getMonth()]} - ${t.getDate()} ${months[t.getMonth()]} ${t.getFullYear()}`;
}

export interface ClientRatesContext {
  clientId: string;
  clientName: string;
  paymentDueDays: number;
  ratesMap: Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>;
  encargadoRates: { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number };
  apuntadorRates: { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number };
  serviceRatesMap: Map<string, { rate: number; metadata: any }>;
}

export async function fetchClientRatesContext(clientId: string): Promise<ClientRatesContext> {
  const supabase = createClient() as any;

  // 1. Client metadata
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .select('id, company_name, payment_due_days')
    .eq('id', clientId)
    .single();

  if (clientErr || !clientData) {
    throw new Error(`Error al obtener cliente: ${clientErr?.message || 'No encontrado'}`);
  }

  // 2. Position hourly rates
  const { data: ratesData, error: ratesErr } = await supabase
    .from('client_position_rates')
    .select(`
      *,
      position:positions(id, name),
      hour_type:hour_types(id, code)
    `)
    .eq('client_id', clientId);

  if (ratesErr) {
    throw new Error(`Error al obtener tarifario comercial: ${ratesErr.message}`);
  }

  const ratesMap = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();
  let encargadoRates = { REGULAR: 22362.87, OVERTIME_50: 29082.92, OVERTIME_100: 37743.22 };
  let apuntadorRates = { REGULAR: 16254.43, OVERTIME_50: 22919.57, OVERTIME_100: 29749.58 };

  for (const r of ratesData || []) {
    const posId = r.position_id;
    const posName = r.position?.name?.toLowerCase() || '';
    if (!ratesMap.has(posId)) {
      ratesMap.set(posId, { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 });
    }
    const current = ratesMap.get(posId)!;
    const code = r.hour_type?.code as 'REGULAR' | 'OVERTIME_50' | 'OVERTIME_100';
    if (code && typeof current[code] !== 'undefined') {
      const rateVal = Number(r.hourly_rate || 0);
      current[code] = rateVal;
      if (posName.includes('encargad')) {
        encargadoRates[code] = rateVal;
      } else if (posName.includes('apuntad')) {
        apuntadorRates[code] = rateVal;
      }
    }
  }

  // 3. Supplemental service rates
  const { data: serviceRatesData } = await supabase
    .from('client_service_rates')
    .select('*')
    .eq('client_id', clientId);

  const serviceRatesMap = new Map<string, { rate: number; metadata: any }>();
  for (const sr of serviceRatesData || []) {
    serviceRatesMap.set(sr.service_code, {
      rate: Number(sr.rate_value || 0),
      metadata: sr.metadata || {},
    });
  }

  return {
    clientId,
    clientName: clientData.company_name,
    paymentDueDays: clientData.payment_due_days || 15,
    ratesMap,
    encargadoRates,
    apuntadorRates,
    serviceRatesMap,
  };
}


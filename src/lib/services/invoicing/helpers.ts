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

export function normalizeMatchName(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[.,\-_\/()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isMatchingOperationName(candidate?: string | null, target?: string | null): boolean {
  const cNorm = normalizeMatchName(candidate);
  const tNorm = normalizeMatchName(target);
  if (!cNorm || !tNorm) return false;
  return cNorm === tNorm || cNorm.includes(tNorm) || tNorm.includes(cNorm);
}

function selectEffectiveRows<T extends Record<string, any>>(
  rows: T[],
  effectiveDate?: string
): T[] {
  const sorted = [...rows].sort((a, b) =>
    String(a.effective_from || '').localeCompare(String(b.effective_from || ''))
  );
  if (!effectiveDate) return sorted;
  const eligible = sorted.filter((r) => !r.effective_from || r.effective_from <= effectiveDate);
  return eligible.length > 0 ? eligible : sorted;
}

export async function fetchUnionBonusScale(
  totalVehicles: number,
  effectiveDate?: string
): Promise<number> {
  const supabase = createClient() as any;
  try {
    const { data, error } = await supabase
      .from('union_bonus_scales')
      .select('min_vehicles, max_vehicles, bonus_amount, effective_from')
      .order('min_vehicles', { ascending: true });

    if (error || !data || data.length === 0) {
      return 88200.48;
    }

    // Group brackets by min_vehicles keeping the latest effective_from <= effectiveDate per bracket
    const byBracket = new Map<string, any>();
    for (const row of selectEffectiveRows(data, effectiveDate)) {
      const key = `${row.min_vehicles}:${row.max_vehicles}`;
      byBracket.set(key, row);
    }
    const brackets = Array.from(byBracket.values()).sort(
      (a, b) => Number(a.min_vehicles || 0) - Number(b.min_vehicles || 0)
    );

    const matched = brackets.find(
      (b) =>
        totalVehicles >= Number(b.min_vehicles || 0) &&
        totalVehicles <= Number(b.max_vehicles ?? 999999)
    );
    if (matched) return Number(matched.bonus_amount || 88200.48);

    // If exceeds max bracket, use highest; otherwise lowest
    const last = brackets[brackets.length - 1];
    if (last && totalVehicles > Number(last.max_vehicles || 0)) {
      return Number(last.bonus_amount || 88200.48);
    }
    return Number(brackets[0]?.bonus_amount || 88200.48);
  } catch {
    return 88200.48;
  }
}

export async function fetchClientRatesContext(
  clientId: string,
  effectiveDate?: string
): Promise<ClientRatesContext> {
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
  let hasExactEncargado = false;
  let hasExactApuntador = false;

  for (const r of selectEffectiveRows(ratesData || [], effectiveDate)) {
    const posId = r.position_id;
    const posName = (r.position?.name || '').trim().toLowerCase();
    if (!ratesMap.has(posId)) {
      ratesMap.set(posId, { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 });
    }
    const current = ratesMap.get(posId)!;
    const code = r.hour_type?.code as 'REGULAR' | 'OVERTIME_50' | 'OVERTIME_100';
    if (code && typeof current[code] !== 'undefined') {
      const rateVal = Number(r.hourly_rate || 0);
      current[code] = rateVal;
      if (posName === 'encargado') {
        encargadoRates[code] = rateVal;
        hasExactEncargado = true;
      } else if (posName.includes('encargad') && !hasExactEncargado) {
        encargadoRates[code] = rateVal;
      } else if (posName === 'apuntador') {
        apuntadorRates[code] = rateVal;
        hasExactApuntador = true;
      } else if (posName.includes('apuntad') && !hasExactApuntador) {
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
  for (const sr of selectEffectiveRows(serviceRatesData || [], effectiveDate)) {
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


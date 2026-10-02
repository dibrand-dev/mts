export interface Holiday {
  date: string; // 'YYYY-MM-DD'
  reason: string;
  type: string;
}

const memoryCache = new Map<number, Record<string, Holiday>>();

// Fallback list of immutable Argentine national holidays in case both external APIs are unreachable
const STATIC_ARGENTINE_HOLIDAYS: Record<string, string> = {
  '01-01': 'Año Nuevo',
  '03-24': 'Día Nacional de la Memoria por la Verdad y la Justicia',
  '04-02': 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
  '05-01': 'Día del Trabajador',
  '05-25': 'Día de la Revolución de Mayo',
  '06-20': 'Paso a la Inmortalidad del Gral. Manuel Belgrano',
  '07-09': 'Día de la Independencia',
  '12-08': 'Inmaculada Concepción de María',
  '12-25': 'Navidad',
};

/**
 * Fetches national holidays for a given year.
 * Primary: https://api.argentinadatos.com/v1/feriados/{year}
 * Fallback: Static official calendar
 */
export async function fetchHolidaysForYear(year: number): Promise<Record<string, Holiday>> {
  if (memoryCache.has(year)) {
    return memoryCache.get(year)!;
  }

  const result: Record<string, Holiday> = {};

  // 1. Primary: ArgentinaDatos API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.fecha) {
            const dateStr = item.fecha; // Already YYYY-MM-DD
            result[dateStr] = {
              date: dateStr,
              reason: item.nombre || 'Feriado Nacional',
              type: item.tipo || 'inamovible',
            };
          }
        }
        if (Object.keys(result).length > 0) {
          memoryCache.set(year, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn(`[Holidays] ArgentinaDatos unavailable for year ${year}, using static calendar fallback:`, err);
  }

  // 2. Fallback: Static official calendar
  for (const [mmdd, name] of Object.entries(STATIC_ARGENTINE_HOLIDAYS)) {
    const dateStr = `${year}-${mmdd}`;
    result[dateStr] = {
      date: dateStr,
      reason: name,
      type: 'inamovible',
    };
  }

  memoryCache.set(year, result);
  return result;
}

export function isHoliday(dateStr: string, holidaysMap: Record<string, Holiday>): boolean {
  if (!dateStr || !holidaysMap) return false;
  return Boolean(holidaysMap[dateStr]);
}

export function getHolidayDetails(dateStr: string, holidaysMap: Record<string, Holiday>): Holiday | null {
  if (!dateStr || !holidaysMap) return null;
  return holidaysMap[dateStr] || null;
}

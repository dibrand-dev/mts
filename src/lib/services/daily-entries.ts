import { createClient } from '../supabase/client';
import { Database } from '../../types/database.types';
import {
  generateExcelWorkbookXml,
  triggerDownload,
  ExcelExportCell,
  ExcelExportSheet,
} from './payroll';

export type DailyWorkLogRow = Database['public']['Tables']['daily_work_logs']['Row'];
export type DailyWorkLogInsert = Database['public']['Tables']['daily_work_logs']['Insert'];
export type DailyStaffEntryRow = Database['public']['Tables']['daily_staff_entries']['Row'];
export type DailyStaffEntryInsert = Database['public']['Tables']['daily_staff_entries']['Insert'];

export interface ShiftHoursCalculation {
  total_hours: number;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  is_sunday_or_holiday: boolean;
}

/**
 * Calculates total hours, regular hours (up to 8 on regular days),
 * 50% overtime hours (excess over 8 on regular days, or Saturdays before 13hs),
 * and 100% overtime hours (Sundays, Holidays, or Saturdays after 13hs).
 * Supports multi-day/overnight shifts with start_date, start_time, end_date, end_time.
 */
export function calculateShiftHours(
  startDateStr: string,
  startTime: string,
  endDateOrEndTime: string,
  endTimeOrHoliday?: string | boolean,
  holidayParam = false
): ShiftHoursCalculation {
  let endDateStr = startDateStr;
  let endTime = '';
  let isHoliday = false;

  if (typeof endTimeOrHoliday === 'string') {
    // 5 arguments: (startDate, startTime, endDate, endTime, isHoliday)
    endDateStr = endDateOrEndTime || startDateStr;
    endTime = endTimeOrHoliday;
    isHoliday = Boolean(holidayParam);
  } else {
    // 3 or 4 arguments: (startDate, startTime, endTime, isHoliday)
    endTime = endDateOrEndTime;
    isHoliday = Boolean(endTimeOrHoliday);
  }

  if (!startTime || !endTime || !startDateStr) {
    return {
      total_hours: 0,
      regular_hours: 0,
      overtime_50_hours: 0,
      overtime_100_hours: 0,
      is_sunday_or_holiday: isHoliday,
    };
  }

  // Parse start time
  const startParts = startTime.split(':');
  const startH = Number(startParts[0]) || 0;
  const startM = Number(startParts[1]) || 0;

  // Parse end time
  const endParts = endTime.split(':');
  const endH = Number(endParts[0]) || 0;
  const endM = Number(endParts[1]) || 0;

  const startDt = new Date(`${startDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
  let endDt = new Date(`${endDateStr || startDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);

  if (endDt <= startDt && (!endDateStr || endDateStr === startDateStr)) {
    // Auto-advance by 1 day if end time is before or equal to start time on the same date
    endDt = new Date(endDt.getTime() + 24 * 60 * 60 * 1000);
  }

  const diffMs = Math.max(0, endDt.getTime() - startDt.getTime());
  const total_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  if (total_hours <= 0) {
    return {
      total_hours: 0,
      regular_hours: 0,
      overtime_50_hours: 0,
      overtime_100_hours: 0,
      is_sunday_or_holiday: isHoliday,
    };
  }

  // Priority 1 & 2: Holiday (Manual Checkbox or API) forces 100% of all hours
  if (isHoliday) {
    return {
      total_hours,
      regular_hours: 0,
      overtime_50_hours: 0,
      overtime_100_hours: total_hours,
      is_sunday_or_holiday: true,
    };
  }

  // Priority 3 & 4: Weekend / Weekday segmentation engine
  let normalMinutes = 0;
  let ot50Minutes = 0;
  let ot100Minutes = 0;
  let standardMinutesWorked = 0; // Tracks minutes towards 8h regular limit

  const curr = new Date(startDt.getTime());
  while (curr < endDt) {
    const dow = curr.getDay(); // 0 = Sun, 6 = Sat
    const mins = curr.getHours() * 60 + curr.getMinutes();

    // 100% Window: Sundays (all day) OR Saturdays from 13:00:00 onwards until Monday 00:00:00
    const isSunday = (dow === 0);
    const isSatAfter13 = (dow === 6 && mins >= 13 * 60);

    if (isSunday || isSatAfter13) {
      ot100Minutes++;
    } else {
      // Standard daytime/workday window: up to 8 hs regular, remainder 50%
      if (standardMinutesWorked < 8 * 60) {
        normalMinutes++;
        standardMinutesWorked++;
      } else {
        ot50Minutes++;
      }
    }

    curr.setMinutes(curr.getMinutes() + 1);
  }

  const regHours = Math.round((normalMinutes / 60) * 100) / 100;
  const ot50Hours = Math.round((ot50Minutes / 60) * 100) / 100;
  const ot100Hours = Math.round((ot100Minutes / 60) * 100) / 100;

  return {
    total_hours,
    regular_hours: regHours,
    overtime_50_hours: ot50Hours,
    overtime_100_hours: ot100Hours,
    is_sunday_or_holiday: ot100Hours === total_hours && total_hours > 0,
  };
}

export interface DailyWorkLogWithEntries extends DailyWorkLogRow {
  client?: { id: string; company_name: string };
  location?: { id: string; name: string; code: string } | null;
  entries: (DailyStaffEntryRow & {
    employee?: { id: string; full_name: string; national_id: string; file_number: string | null };
    position?: { id: string; name: string };
  })[];
}

export async function getDailyWorkLogs(filters?: {
  date?: string;
  clientId?: string;
}): Promise<DailyWorkLogWithEntries[]> {
  const supabase = createClient() as any;

  let query = supabase
    .from('daily_work_logs')
    .select(`
      *,
      client:clients(id, company_name),
      location:locations(id, name, code),
      entries:daily_staff_entries(
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name)
      )
    `)
    .order('work_date', { ascending: true });

  if (filters?.date) {
    query = query.eq('work_date', filters.date);
  }
  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching daily work logs:', error);
    throw new Error(error.message);
  }

  let localMetaMap: Record<string, { operational_role?: string; is_compensation_shift?: boolean }> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('mts_staff_entry_operational_meta');
      if (raw) localMetaMap = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const hydrated = (data || []).map((log: any) => ({
    ...log,
    entries: (log.entries || []).map((e: any) => {
      const meta = localMetaMap[e.id] || {};
      return {
        ...e,
        operational_role: e.operational_role || meta.operational_role || null,
        is_compensation_shift:
          typeof e.is_compensation_shift === 'boolean'
            ? e.is_compensation_shift
            : Boolean(meta.is_compensation_shift),
      };
    }),
  }));

  return hydrated as DailyWorkLogWithEntries[];
}

export async function getOrCreateDailyWorkLog(
  workDate: string,
  clientId: string,
  locationId?: string | null,
  vesselName?: string | null,
  totalVehiclesHandled?: number | null,
  isExportDay?: boolean | null
): Promise<DailyWorkLogWithEntries> {
  const supabase = createClient() as any;

  // 1. Try to find existing log for (work_date, client_id) matching vessel_name
  const { data: existingList, error: findError } = await supabase
    .from('daily_work_logs')
    .select(`
      *,
      client:clients(id, company_name),
      location:locations(id, name, code),
      entries:daily_staff_entries(
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name, requires_vehicle_bonus)
      )
    `)
    .eq('work_date', workDate)
    .eq('client_id', clientId);

  if (findError) {
    console.error('Error searching daily work log:', findError);
    throw new Error(findError.message);
  }

  const normalizedTargetVessel = (vesselName || '').trim().toUpperCase();
  const existing = (existingList || []).find((log: any) => {
    const logVessel = (log.vessel_name || '').trim().toUpperCase();
    if (normalizedTargetVessel && logVessel) {
      return logVessel === normalizedTargetVessel;
    }
    if (!normalizedTargetVessel && !logVessel) {
      return true;
    }
    // If existing log had no vessel_name yet and has 0 entries, allow adopting vesselName
    if (normalizedTargetVessel && !logVessel && (!log.entries || log.entries.length === 0)) {
      return true;
    }
    return false;
  });

  if (existing) {
    const updates: Partial<DailyWorkLogInsert> = {};
    if (vesselName && existing.vessel_name !== vesselName) {
      updates.vessel_name = vesselName;
      existing.vessel_name = vesselName;
    }
    if (locationId && existing.location_id !== locationId) {
      updates.location_id = locationId;
      existing.location_id = locationId;
    }
    if (typeof totalVehiclesHandled === 'number' && existing.total_vehicles_handled !== totalVehiclesHandled) {
      updates.total_vehicles_handled = totalVehiclesHandled;
      existing.total_vehicles_handled = totalVehiclesHandled;
    }
    if (typeof isExportDay === 'boolean' && existing.is_export_day !== isExportDay) {
      updates.is_export_day = isExportDay;
      existing.is_export_day = isExportDay;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('daily_work_logs')
        .update(updates)
        .eq('id', existing.id);

      // Sincronizar bonus_applied_amount si cambiaron las unidades y hay entradas de puestos elegibles
      if (typeof totalVehiclesHandled === 'number' && updates.total_vehicles_handled !== undefined) {
        try {
          const { getUnionBonusScales, calculateBonusForVehicles } = await import('@/lib/services/union-scales');
          const scales = await getUnionBonusScales();
          const newBonus = calculateBonusForVehicles(totalVehiclesHandled, scales, workDate);

          for (const entry of existing.entries || []) {
            if (entry.position?.requires_vehicle_bonus && entry.bonus_applied_amount !== newBonus) {
              await supabase
                .from('daily_staff_entries')
                .update({ bonus_applied_amount: newBonus })
                .eq('id', entry.id);
              entry.bonus_applied_amount = newBonus;
            }
          }
        } catch (syncErr) {
          console.warn('Could not auto-sync bonus scales for existing entries:', syncErr);
        }
      }
    }
    return existing as DailyWorkLogWithEntries;
  }

  // 2. Get current authenticated user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  // 3. Insert new daily work log
  const { data: newLog, error: insertError } = await supabase
    .from('daily_work_logs')
    .insert({
      work_date: workDate,
      client_id: clientId,
      location_id: locationId || null,
      vessel_name: vesselName || null,
      total_vehicles_handled: typeof totalVehiclesHandled === 'number' ? totalVehiclesHandled : 0,
      vehicles_discharged: 0,
      vehicles_loaded: 0,
      vehicles_shifted: 0,
      is_export_day: isExportDay === true,
      logged_by: userId,
    })
    .select(`
      *,
      client:clients(id, company_name),
      location:locations(id, name, code),
      entries:daily_staff_entries(
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name, requires_vehicle_bonus)
      )
    `)
    .single();

  if (insertError) {
    if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
      // Fallback: adopt the existing work log for (workDate, clientId) if table has legacy UNIQUE (work_date, client_id)
      const { data: fallbackLog } = await supabase
        .from('daily_work_logs')
        .select(`
          *,
          client:clients(id, company_name),
          location:locations(id, name, code),
          entries:daily_staff_entries(
            *,
            employee:employees(id, full_name, national_id, file_number),
            position:positions(id, name, requires_vehicle_bonus)
          )
        `)
        .eq('work_date', workDate)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackLog) {
        return fallbackLog as DailyWorkLogWithEntries;
      }
    }
    console.error('Error creating daily work log:', insertError);
    throw new Error(insertError.message);
  }

  return {
    ...newLog,
    entries: [],
  } as DailyWorkLogWithEntries;
}

export async function addStaffEntryToWorkLog(
  dailyWorkLogId: string,
  entry: Omit<DailyStaffEntryInsert, 'daily_work_log_id'>
): Promise<DailyStaffEntryRow> {
  const supabase = createClient() as any;

  // Defensive: if bonus_applied_amount is 0/falsy, check if work log has vehicles and position requires bonus
  let bonusToApply = Number(entry.bonus_applied_amount || 0);
  if (bonusToApply === 0 && entry.position_id) {
    try {
      const { data: log } = await supabase
        .from('daily_work_logs')
        .select('work_date, total_vehicles_handled')
        .eq('id', dailyWorkLogId)
        .single();

      if (log && log.total_vehicles_handled > 0) {
        const { data: pos } = await supabase
          .from('positions')
          .select('requires_vehicle_bonus')
          .eq('id', entry.position_id)
          .single();

        if (pos?.requires_vehicle_bonus) {
          const { getUnionBonusScales, calculateBonusForVehicles } = await import('@/lib/services/union-scales');
          const scales = await getUnionBonusScales();
          bonusToApply = calculateBonusForVehicles(log.total_vehicles_handled, scales, log.work_date);
        }
      }
    } catch (syncErr) {
      console.warn('Could not auto-check bonus for new staff entry:', syncErr);
    }
  }

  const payloadToInsert: Record<string, any> = {
    ...entry,
    bonus_applied_amount: bonusToApply,
    daily_work_log_id: dailyWorkLogId,
  };

  let { data, error } = await supabase
    .from('daily_staff_entries')
    .insert(payloadToInsert)
    .select(`
      *,
      employee:employees(id, full_name, national_id, file_number),
      position:positions(id, name)
    `)
    .single();

  // Fallback if remote schema does not yet have operational_role or is_compensation_shift
  if (error && (error.message?.includes('operational_role') || error.message?.includes('is_compensation_shift') || error.code === 'PGRST204')) {
    const { operational_role, is_compensation_shift, ...safePayload } = payloadToInsert;
    const retry = await supabase
      .from('daily_staff_entries')
      .insert(safePayload)
      .select(`
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name)
      `)
      .single();
    data = retry.data ? { ...retry.data, operational_role, is_compensation_shift } : null;
    error = retry.error;
  }

  if (error) {
    console.error('Error adding staff entry:', error);
    throw new Error(error.message);
  }

  if (typeof window !== 'undefined' && data?.id) {
    try {
      const raw = window.localStorage.getItem('mts_staff_entry_operational_meta');
      const map = raw ? JSON.parse(raw) : {};
      map[data.id] = {
        operational_role: entry.operational_role || data.operational_role || null,
        is_compensation_shift: Boolean(entry.is_compensation_shift ?? data.is_compensation_shift),
      };
      window.localStorage.setItem('mts_staff_entry_operational_meta', JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  return data as DailyStaffEntryRow;
}

export async function deleteStaffEntry(entryId: string): Promise<void> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('daily_staff_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting staff entry:', error);
    throw new Error(error.message);
  }
}

export async function updateStaffEntry(
  entryId: string,
  entry: Partial<DailyStaffEntryInsert>
): Promise<DailyStaffEntryRow> {
  const supabase = createClient() as any;
  let { data, error } = await supabase
    .from('daily_staff_entries')
    .update(entry)
    .eq('id', entryId)
    .select(`
      *,
      employee:employees(id, full_name, national_id, file_number),
      position:positions(id, name)
    `)
    .single();

  if (error && (error.message?.includes('operational_role') || error.message?.includes('is_compensation_shift') || error.code === 'PGRST204')) {
    const { operational_role, is_compensation_shift, ...safeEntry } = entry as Record<string, any>;
    const retry = await supabase
      .from('daily_staff_entries')
      .update(safeEntry)
      .eq('id', entryId)
      .select(`
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name)
      `)
      .single();
    data = retry.data ? { ...retry.data, operational_role, is_compensation_shift } : null;
    error = retry.error;
  }

  if (error) {
    console.error('Error updating staff entry:', error);
    throw new Error(error.message);
  }

  if (typeof window !== 'undefined' && data?.id) {
    try {
      const raw = window.localStorage.getItem('mts_staff_entry_operational_meta');
      const map = raw ? JSON.parse(raw) : {};
      map[data.id] = {
        operational_role: entry.operational_role ?? data.operational_role ?? map[data.id]?.operational_role ?? null,
        is_compensation_shift: Boolean(entry.is_compensation_shift ?? data.is_compensation_shift ?? map[data.id]?.is_compensation_shift),
      };
      window.localStorage.setItem('mts_staff_entry_operational_meta', JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  return data as DailyStaffEntryRow;
}

export async function updateDailyWorkLog(
  logId: string,
  updates: Partial<DailyWorkLogInsert>
): Promise<DailyWorkLogRow> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('daily_work_logs')
    .update(updates)
    .eq('id', logId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating daily work log:', error);
    throw new Error(error.message);
  }

  // If total_vehicles_handled was updated, synchronize bonus_applied_amount for all eligible entries in this log
  if (typeof updates.total_vehicles_handled === 'number') {
    try {
      const { getUnionBonusScales, calculateBonusForVehicles } = await import('@/lib/services/union-scales');
      const scales = await getUnionBonusScales();
      const newBonus = calculateBonusForVehicles(updates.total_vehicles_handled, scales, data.work_date);

      const { data: entries } = await supabase
        .from('daily_staff_entries')
        .select(`
          id,
          bonus_applied_amount,
          position:positions(id, requires_vehicle_bonus)
        `)
        .eq('daily_work_log_id', logId);

      for (const entry of entries || []) {
        if (entry.position?.requires_vehicle_bonus && entry.bonus_applied_amount !== newBonus) {
          await supabase
            .from('daily_staff_entries')
            .update({ bonus_applied_amount: newBonus })
            .eq('id', entry.id);
        }
      }
    } catch (syncErr) {
      console.warn('Could not auto-sync bonus scales on updateDailyWorkLog:', syncErr);
    }
  }

  return data as DailyWorkLogRow;
}

export async function toggleStaffEntryApproval(
  entryId: string,
  isApproved: boolean
): Promise<DailyStaffEntryRow> {
  const supabase = createClient() as any;
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  const { data, error } = await supabase
    .from('daily_staff_entries')
    .update({
      is_approved: isApproved,
      approved_at: isApproved ? new Date().toISOString() : null,
      approved_by: isApproved ? userId : null,
    })
    .eq('id', entryId)
    .select(`
      *,
      employee:employees(id, full_name, national_id, file_number),
      position:positions(id, name)
    `)
    .single();

  if (error) {
    console.error('Error toggling staff entry approval:', error);
    throw new Error(error.message);
  }

  return data as DailyStaffEntryRow;
}

export async function bulkApproveStaffEntries(
  entryIds: string[],
  isApproved = true
): Promise<void> {
  if (!entryIds || entryIds.length === 0) return;
  const supabase = createClient() as any;
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  const { error } = await supabase
    .from('daily_staff_entries')
    .update({
      is_approved: isApproved,
      approved_at: isApproved ? new Date().toISOString() : null,
      approved_by: isApproved ? userId : null,
    })
    .in('id', entryIds);

  if (error) {
    console.error('Error bulk approving staff entries:', error);
    throw new Error(error.message);
  }
}

export interface ClientShiftRecordForBilling {
  id: string;
  daily_work_log_id: string;
  work_date: string;
  client_id: string;
  client_name: string;
  location_id?: string | null;
  location_name?: string | null;
  location_code?: string | null;
  vessel_name: string | null;
  employee_id: string;
  employee_name: string;
  file_number: string | null;
  position_id: string;
  position_name: string;
  operational_role?: string | null;
  is_compensation_shift?: boolean;
  shift_start_date: string;
  shift_start_time: string;
  shift_end_date: string;
  shift_end_time: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  total_hours: number;
  plus_delta_amount: number;
  shuttles_count: number;
  meal_allowance_count: number;
  bonus_applied_amount: number;
  is_export_day: boolean;
  day_off_count?: number;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
}

export interface ClientBillingShiftsResult {
  records: ClientShiftRecordForBilling[];
  unapprovedCount: number;
  totalCount: number;
  vesselNames: string[];
  totalVehiclesDischarged: number;
  totalVehiclesLoaded: number;
  totalVehiclesShifted: number;
  totalVehiclesHandled: number;
  totalShuttles: number;
}

export async function getStaffEntriesForClientAndPeriod(
  clientId: string,
  fromDate: string,
  toDate: string,
  options?: { onlyApproved?: boolean }
): Promise<ClientBillingShiftsResult> {
  const onlyApproved = options?.onlyApproved !== false; // Default true: only approved shifts
  const supabase = createClient() as any;

  const { data, error } = await supabase
    .from('daily_work_logs')
    .select(`
      id,
      work_date,
      client_id,
      vessel_name,
      vehicles_discharged,
      vehicles_loaded,
      vehicles_shifted,
      total_vehicles_handled,
      is_export_day,
      client:clients(id, company_name),
      location:locations(id, name, code),
      entries:daily_staff_entries(
        *,
        employee:employees(id, full_name, national_id, file_number),
        position:positions(id, name)
      )
    `)
    .eq('client_id', clientId)
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
    .order('work_date', { ascending: true });

  if (error) {
    console.error('Error fetching client staff entries for billing:', error);
    throw new Error(error.message);
  }

  let localMetaMap: Record<string, { operational_role?: string; is_compensation_shift?: boolean }> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('mts_staff_entry_operational_meta');
      if (raw) localMetaMap = JSON.parse(raw);
    } catch {
      // ignore storage errors
    }
  }

  const records: ClientShiftRecordForBilling[] = [];
  let unapprovedCount = 0;
  let totalCount = 0;
  let totalVehiclesDischarged = 0;
  let totalVehiclesLoaded = 0;
  let totalVehiclesShifted = 0;
  let totalVehiclesHandled = 0;
  let totalShuttles = 0;
  const vesselNamesSet = new Set<string>();

  for (const log of data || []) {
    if (log.vessel_name) {
      vesselNamesSet.add(log.vessel_name);
    }
    totalVehiclesDischarged += Number(log.vehicles_discharged || 0);
    totalVehiclesLoaded += Number(log.vehicles_loaded || 0);
    totalVehiclesShifted += Number(log.vehicles_shifted || 0);
    totalVehiclesHandled += Number(log.total_vehicles_handled || 0);

    const entries = log.entries || [];
    for (const entry of entries) {
      totalCount++;
      totalShuttles += Number(entry.shuttles_count || 0);
      const isAppr = Boolean(entry.is_approved);

      if (!isAppr) {
        unapprovedCount++;
      }

      // If onlyApproved is required and this entry is not approved, skip from billing records
      if (onlyApproved && !isAppr) {
        continue;
      }

      const reg = Number(entry.regular_hours || 0);
      const ot50 = Number(entry.overtime_50_hours || 0);
      const ot100 = Number(entry.overtime_100_hours || 0);
      const localMeta = localMetaMap[entry.id] || {};

      records.push({
        id: entry.id,
        daily_work_log_id: log.id,
        work_date: log.work_date,
        client_id: log.client_id,
        client_name: log.client?.company_name || 'Cliente',
        location_id: log.location?.id || null,
        location_name: log.location?.name || null,
        location_code: log.location?.code || null,
        vessel_name: log.vessel_name || null,
        employee_id: entry.employee_id,
        employee_name: entry.employee?.full_name || 'Personal',
        file_number: entry.employee?.file_number || null,
        position_id: entry.position_id,
        position_name: entry.position?.name || 'Puesto',
        operational_role: entry.operational_role || localMeta.operational_role || null,
        is_compensation_shift:
          typeof entry.is_compensation_shift === 'boolean'
            ? entry.is_compensation_shift
            : Boolean(localMeta.is_compensation_shift),
        shift_start_date: entry.shift_start_date || log.work_date,
        shift_start_time: entry.shift_start_time,
        shift_end_date: entry.shift_end_date || log.work_date,
        shift_end_time: entry.shift_end_time,
        regular_hours: reg,
        overtime_50_hours: ot50,
        overtime_100_hours: ot100,
        total_hours: reg + ot50 + ot100,
        plus_delta_amount: Number(entry.plus_delta_amount || 0),
        shuttles_count: Number(entry.shuttles_count || 0),
        meal_allowance_count: Number(entry.meal_allowance_count || 0),
        bonus_applied_amount: Number(entry.bonus_applied_amount || 0),
        is_export_day: Boolean(log.is_export_day),
        day_off_count: Number((entry as any).day_off_count || 0),
        is_approved: isAppr,
        approved_at: entry.approved_at || null,
        approved_by: entry.approved_by || null,
      });
    }
  }

  return {
    records,
    unapprovedCount,
    totalCount,
    vesselNames: Array.from(vesselNamesSet),
    totalVehiclesDischarged,
    totalVehiclesLoaded,
    totalVehiclesShifted,
    totalVehiclesHandled: totalVehiclesHandled || (totalVehiclesDischarged + totalVehiclesLoaded + totalVehiclesShifted),
    totalShuttles,
  };
}

export interface DailyWorkPlanillaExportRecord {
  work_date: string;
  client_name: string;
  location_name?: string | null;
  vessel_name?: string | null;
  is_export_day?: boolean;
  employee_name: string;
  employee_file_number?: string | null;
  position_name: string;
  shift_time: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  total_hours: number;
  shuttles_count: number;
  meal_allowance_count: number;
  day_off_count: number;
  advance_payment_amount: number;
  plus_cat_amount: number;
  plus_delta_amount: number;
  is_approved: boolean;
}

/**
 * Exporta la Planilla de Novedades de Horas visible en formato Excel nativo (.xls),
 * incluyendo las columnas de Plus Cat, Plus DD, anticipos, horas y fórmulas sumables.
 */
export function exportDailyWorkPlanillaToExcel(
  records: DailyWorkPlanillaExportRecord[],
  periodLabel?: string
) {
  const rows: (ExcelExportCell | null)[][] = [];

  // Fila 0: Título principal
  rows.push([
    {
      value: `MTS MARITIME & TERMINAL SERVICES - PLANILLA DE NOVEDADES DE HORAS`,
      style: 'subheader',
      colSpan: 19,
    },
  ]);

  // Fila 1: Subtítulo
  rows.push([
    {
      value: `Filtro / Período: ${periodLabel || 'Consolidado'} | Total Registros: ${records.length}`,
      style: 'label',
      colSpan: 19,
    },
  ]);

  // Fila 2: Separador
  rows.push([]);

  // Fila 3: Encabezados de columnas
  const headers = [
    'Fecha',
    'Cliente',
    'Lugar / Muelle',
    'Buque / Operación',
    'Legajo',
    'Operario',
    'Puesto',
    'Horario',
    'Hs Normales',
    'Hs 50%',
    'Hs 100%',
    'Total Hs',
    'Remises',
    'Viandas',
    'Francos',
    'Anticipo',
    'PLUS CAT',
    'PLUS DD',
    'Total Pluses',
    'Estado',
  ];

  rows.push(headers.map((h) => ({ value: h, style: 'header' })));

  const startDataRow = 5;

  records.forEach((r) => {
    const vesselDisplay = r.vessel_name
      ? r.is_export_day
        ? `${r.vessel_name} (EXPO)`
        : r.vessel_name
      : r.is_export_day
      ? 'EXPO'
      : '-';

    rows.push([
      { value: r.work_date, style: 'center' },
      { value: r.client_name, style: 'label' },
      { value: r.location_name || '-', style: 'label' },
      { value: vesselDisplay, style: 'label' },
      { value: r.employee_file_number || '-', style: 'center' },
      { value: r.employee_name, style: 'label' },
      { value: r.position_name, style: 'label' },
      { value: r.shift_time, style: 'center' },
      { value: r.regular_hours, type: 'Number', style: 'number' },
      { value: r.overtime_50_hours, type: 'Number', style: 'number' },
      { value: r.overtime_100_hours, type: 'Number', style: 'number' },
      {
        value: r.total_hours,
        type: 'Number',
        style: 'number',
        formula: `=+RC[-3]+RC[-2]+RC[-1]`,
      },
      { value: r.shuttles_count, type: 'Number', style: 'number' },
      { value: r.meal_allowance_count, type: 'Number', style: 'integer' },
      { value: r.day_off_count, type: 'Number', style: 'integer' },
      { value: r.advance_payment_amount, type: 'Number', style: 'currency' },
      { value: r.plus_cat_amount, type: 'Number', style: 'currency' },
      { value: r.plus_delta_amount, type: 'Number', style: 'currency' },
      {
        value: r.plus_cat_amount + r.plus_delta_amount,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-2]+RC[-1]`,
      },
      { value: r.is_approved ? 'Aprobado' : 'Pendiente', style: 'center' },
    ]);
  });

  const endDataRow = startDataRow + records.length - 1;

  if (records.length > 0) {
    const totReg = records.reduce((acc, r) => acc + r.regular_hours, 0);
    const totOt50 = records.reduce((acc, r) => acc + r.overtime_50_hours, 0);
    const totOt100 = records.reduce((acc, r) => acc + r.overtime_100_hours, 0);
    const totHs = records.reduce((acc, r) => acc + r.total_hours, 0);
    const totRem = records.reduce((acc, r) => acc + r.shuttles_count, 0);
    const totVia = records.reduce((acc, r) => acc + r.meal_allowance_count, 0);
    const totFra = records.reduce((acc, r) => acc + r.day_off_count, 0);
    const totAdv = records.reduce((acc, r) => acc + r.advance_payment_amount, 0);
    const totCat = records.reduce((acc, r) => acc + r.plus_cat_amount, 0);
    const totDD = records.reduce((acc, r) => acc + r.plus_delta_amount, 0);
    const totPluses = totCat + totDD;

    rows.push([
      { value: 'TOTALES', style: 'total_label', colSpan: 8 },
      ...Array(7).fill(null),
      { value: Math.round(totReg * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt50 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt100 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totHs * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totRem * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: totVia, type: 'Number', style: 'total_integer', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: totFra, type: 'Number', style: 'total_integer', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totAdv * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totCat * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totDD * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totPluses * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: '', style: 'center' },
    ]);
  }

  const sheet: ExcelExportSheet = {
    name: 'Novedades de Horas',
    colWidths: [75, 140, 120, 130, 75, 180, 110, 85, 80, 80, 80, 80, 70, 65, 65, 85, 95, 95, 105, 80],
    rows,
  };

  const xml = generateExcelWorkbookXml([sheet]);
  const filename = periodLabel ? `Novedades_Horas_${periodLabel}.xls` : 'Novedades_Horas.xls';
  triggerDownload(xml, filename);
}

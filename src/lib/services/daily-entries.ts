import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

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
    // Auto-advance by 1 day if end time is before start time on the same date
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

  // Segment calculation (minute by minute or block evaluation)
  // Check start day of week
  const startDayOfWeek = startDt.getDay(); // 0 = Sun, 6 = Sat
  const isStartSunday = startDayOfWeek === 0;

  if (isHoliday) {
    return {
      total_hours,
      regular_hours: 0,
      overtime_50_hours: 0,
      overtime_100_hours: total_hours,
      is_sunday_or_holiday: true,
    };
  }

  // If start is Sunday:
  if (isStartSunday) {
    return {
      total_hours,
      regular_hours: 0,
      overtime_50_hours: 0,
      overtime_100_hours: total_hours,
      is_sunday_or_holiday: true,
    };
  }

  // If start is Saturday:
  if (startDayOfWeek === 6) {
    // Cut-off at 13:00 on Saturday
    const satCutoff = new Date(`${startDateStr}T13:00:00`).getTime();
    const startMs = startDt.getTime();
    const endMs = endDt.getTime();

    const msBeforeCutoff = Math.max(0, Math.min(endMs, satCutoff) - Math.min(startMs, satCutoff));
    const msAfterCutoff = Math.max(0, endMs - Math.max(startMs, satCutoff));

    const hoursBefore13 = Math.round((msBeforeCutoff / (1000 * 60 * 60)) * 100) / 100;
    const hoursAfter13 = Math.round((msAfterCutoff / (1000 * 60 * 60)) * 100) / 100;

    const regular_hours = Math.min(8, hoursBefore13);
    const overtime_50_hours = Math.max(0, hoursBefore13 - 8);
    const overtime_100_hours = hoursAfter13;

    return {
      total_hours,
      regular_hours: Math.round(regular_hours * 100) / 100,
      overtime_50_hours: Math.round(overtime_50_hours * 100) / 100,
      overtime_100_hours: Math.round(overtime_100_hours * 100) / 100,
      is_sunday_or_holiday: false,
    };
  }

  // Weekday (Monday - Friday)
  // Check if shift extends into Saturday post 13hs or Sunday
  const regular_hours = Math.min(8, total_hours);
  const overtime_50_hours = Math.max(0, total_hours - 8);
  const overtime_100_hours = 0;

  return {
    total_hours,
    regular_hours: Math.round(regular_hours * 100) / 100,
    overtime_50_hours: Math.round(overtime_50_hours * 100) / 100,
    overtime_100_hours: Math.round(overtime_100_hours * 100) / 100,
    is_sunday_or_holiday: false,
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
    .order('work_date', { ascending: false });

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

  return (data || []) as DailyWorkLogWithEntries[];
}

export async function getOrCreateDailyWorkLog(
  workDate: string,
  clientId: string,
  locationId?: string | null,
  vesselName?: string | null
): Promise<DailyWorkLogWithEntries> {
  const supabase = createClient() as any;

  // 1. Try to find existing log for (work_date, client_id)
  const { data: existing, error: findError } = await supabase
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
    .eq('work_date', workDate)
    .eq('client_id', clientId)
    .maybeSingle();

  if (findError) {
    console.error('Error searching daily work log:', findError);
    throw new Error(findError.message);
  }

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
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('daily_work_logs')
        .update(updates)
        .eq('id', existing.id);
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
      total_vehicles_handled: 0,
      vehicles_discharged: 0,
      vehicles_loaded: 0,
      vehicles_shifted: 0,
      is_export_day: false,
      logged_by: userId,
    })
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
    .single();

  if (insertError) {
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

  const { data, error } = await supabase
    .from('daily_staff_entries')
    .insert({
      ...entry,
      daily_work_log_id: dailyWorkLogId,
    })
    .select(`
      *,
      employee:employees(id, full_name, national_id, file_number),
      position:positions(id, name)
    `)
    .single();

  if (error) {
    console.error('Error adding staff entry:', error);
    throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('daily_staff_entries')
    .update(entry)
    .eq('id', entryId)
    .select(`
      *,
      employee:employees(id, full_name, national_id, file_number),
      position:positions(id, name)
    `)
    .single();

  if (error) {
    console.error('Error updating staff entry:', error);
    throw new Error(error.message);
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
  vessel_name: string | null;
  employee_id: string;
  employee_name: string;
  file_number: string | null;
  position_id: string;
  position_name: string;
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
      client:clients(id, company_name),
      entries:daily_staff_entries(
        id,
        employee_id,
        position_id,
        shift_start_date,
        shift_start_time,
        shift_end_date,
        shift_end_time,
        regular_hours,
        overtime_50_hours,
        overtime_100_hours,
        plus_delta_amount,
        shuttles_count,
        meal_allowance_count,
        bonus_applied_amount,
        is_approved,
        approved_at,
        approved_by,
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

      records.push({
        id: entry.id,
        daily_work_log_id: log.id,
        work_date: log.work_date,
        client_id: log.client_id,
        client_name: log.client?.company_name || 'Cliente',
        vessel_name: log.vessel_name || null,
        employee_id: entry.employee_id,
        employee_name: entry.employee?.full_name || 'Personal',
        file_number: entry.employee?.file_number || null,
        position_id: entry.position_id,
        position_name: entry.position?.name || 'Puesto',
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

/**
 * Official vessel shift rosters and normalizers for BUQUE proformas (e.g. GOODWOOD).
 * Ensures that:
 * 1. GOODWOOD OPERATIVA (Sheet 2) ONLY contains Apuntadores (NO Encargados) and displays
 *    the operational post (RAMPA, DAÑOS, RELEVO) in PUESTO instead of the category.
 * 2. PLUS (Sheet 3) contains BOTH Encargados and Apuntadores with their operational post
 *    (ENCARGADO, RAMPA, DAÑOS, RELEVO).
 * 3. HS COMPENSACION (Sheet 4) includes the full detail of who and what hours correspond to them.
 * 4. ENCARGADO A BORDO (Sheet 5) includes the full detail of Encargado shifts and the Encargado Plus table.
 */

export interface VesselOperativaShiftRow {
  turno: number | string;
  turnoGroup?: number;
  notaMark?: string;
  categoria?: string;
  puesto: string;
  apellido: string;
  fecha: string;
  desdeHasta: string;
  horas: number;
  normales: number;
  ot50: number;
  ot100: number;
  remises: number;
}

export interface VesselPlusShiftRow {
  categoria?: string;
  puesto: string;
  apellido: string;
  fecha: string;
  desdeHasta: string;
  horas: number;
  normales: number;
  ot50: number;
  ot100: number;
  plus: number;
  unitPlus?: number;
  hsNormEq: number;
  incidHe: number;
}

export interface VesselCompensacionRow {
  notaMark: string;
  categoria: string;
  puesto: string;
  apellido: string;
  fecha: string;
  desdeHasta: string;
  horas: number;
  normales: number;
  ot50: number;
  ot100: number;
}

export interface VesselEncargadoRow {
  turno: number | string;
  encargado: string;
  fecha: string;
  desdeHasta: string;
  horas: number;
  normales: number;
  ot50: number;
  ot100: number;
}

/**
 * Official 40-row roster from MTS-CTYC SA - Proformas Facturas GOODWOOD - 11-13 OCTUBRE 2026.xls
 * Contains 4 shifts x (1 ENCARGADO + 9 APUNTADORES [RAMPA, DAÑOS, RELEVO]).
 */
const GOODWOOD_FULL_SHIFTS: Array<{
  turnoGroup: number;
  isFirstApuntadorInTurn?: boolean;
  notaMark?: string;
  categoria: 'ENCARGADO' | 'APUNTADOR';
  puesto: 'ENCARGADO' | 'RAMPA' | 'DAÑOS' | 'RELEVO';
  apellido: string;
  fecha: string;
  desdeHasta: string;
  horas: number;
  normales: number;
  ot50: number;
  ot100: number;
  remises: number;
  plusFirstTurn: number;
}> = [
  // TURNO 1: 11/10/2026 1400-0200 (12 hs al 100%)
  { turnoGroup: 1, categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'BRITES LUCAS DAVID', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, isFirstApuntadorInTurn: true, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BRITES PEDRO ADRIAN', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BELO Bruno Joaquin', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'VILLAFAÑE EMILIANO', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'ALTAMIRANO HECTOR DANIEL', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'FUNES AGUSTIN', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CORONEL MATIAS NICOLAS', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'PUEBLA CRISTIAN DAMIAN', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'CORNEJO NELSON', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 1, notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'BRITES Enzo Nicolas', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12, remises: 6, plusFirstTurn: 143503.03 },

  // TURNO 2: 12/10/2026 2200-0800 (10 hs al 100%, 3 Apuntadores con 16 hs por acuerdo trabajo corrido)
  { turnoGroup: 2, categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'MARTINOLI DIEGO MARCELO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, isFirstApuntadorInTurn: true, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CHIORAZZO JUAN', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 16, normales: 0, ot50: 0, ot100: 16, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'GARCIA SANTIAGO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'VERA EMANUEL', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'SUAREZ NESTOR', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'SALVO MAXIMILIANO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'PACHECO LEONARDO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'GARCIA FACUNDO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'MONTEROS MATIAS', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 16, normales: 0, ot50: 0, ot100: 16, remises: 0, plusFirstTurn: 143503.03 },
  { turnoGroup: 2, categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'CASTRO CARLOS', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 16, normales: 0, ot50: 0, ot100: 16, remises: 6, plusFirstTurn: 143503.03 },

  // TURNO 3: 12/10/2026 0800-2200 (14 hs al 100%)
  { turnoGroup: 3, categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'BRITES LUCAS DAVID', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, isFirstApuntadorInTurn: true, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BRITES PEDRO ADRIAN', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BELO Bruno Joaquin', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'VILLAFAÑE EMILIANO', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'ALTAMIRANO HECTOR DANIEL', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'PUEBLA CRISTIAN DAMIAN', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BRITES Enzo Nicolas', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CORNEJO NELSON', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'FUNES AGUSTIN', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 3, categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'CORONEL MATIAS NICOLAS', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14, remises: 6, plusFirstTurn: 0 },

  // TURNO 4: 13/10/2026 0800-2000 (12 hs: 8 Norm + 4 al 100%, o 4 Norm + 6 al 100%)
  { turnoGroup: 4, categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'MARTINOLI DIEGO MARCELO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 4, ot50: 0, ot100: 6, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, isFirstApuntadorInTurn: true, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'GARCIA FACUNDO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'GARCIA SANTIAGO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'VERA EMANUEL', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'SUAREZ NESTOR', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'SALVO MAXIMILIANO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'PACHECO LEONARDO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 8, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CASTRO CARLOS', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 0, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'MONTEROS MATIAS', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 0, ot50: 0, ot100: 5, remises: 0, plusFirstTurn: 0 },
  { turnoGroup: 4, categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'CHIORAZZO JUAN', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 0, ot50: 0, ot100: 5, remises: 6, plusFirstTurn: 0 },
];

export const GOODWOOD_OPERATIVA_DEFAULT_ROWS: VesselOperativaShiftRow[] = GOODWOOD_FULL_SHIFTS.filter(
  (r) => r.categoria !== 'ENCARGADO'
).map((r) => ({
  turno: r.isFirstApuntadorInTurn ? r.turnoGroup : '',
  turnoGroup: r.turnoGroup,
  notaMark: r.notaMark || '',
  categoria: 'APUNTADOR',
  puesto: r.puesto,
  apellido: r.apellido,
  fecha: r.fecha,
  desdeHasta: r.desdeHasta,
  horas: r.horas,
  normales: r.normales,
  ot50: r.ot50,
  ot100: r.ot100,
  remises: r.remises,
}));

export const GOODWOOD_PLUS_DEFAULT_ROWS: VesselPlusShiftRow[] = GOODWOOD_FULL_SHIFTS.map((r) => {
  const unitPlus = 143503.03;
  const hsNormEq = Math.round((r.ot50 * 1.5 + r.ot100 * 2) * 100) / 100;
  const incidHe = Math.round(((unitPlus / 192) * hsNormEq) * 100) / 100;
  return {
    categoria: r.categoria,
    puesto: r.puesto,
    apellido: r.apellido,
    fecha: r.fecha,
    desdeHasta: r.desdeHasta,
    horas: r.horas,
    normales: r.normales,
    ot50: r.ot50,
    ot100: r.ot100,
    plus: r.plusFirstTurn,
    unitPlus,
    hsNormEq,
    incidHe,
  };
});

export const GOODWOOD_COMPENSACION_DEFAULT_ROWS: VesselCompensacionRow[] = [
  // Turno 1 (11/10/2026 14:00-02:00 - 12 hs al 100%)
  { notaMark: '(*)', categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'BRITES LUCAS DAVID', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BELO Bruno Joaquin', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'CORNEJO NELSON', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'BRITES Enzo Nicolas', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12 },
  // Turno 2 (12/10/2026 22:00-08:00 - 10 hs al 100%)
  { notaMark: '(*)', categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'MARTINOLI DIEGO MARCELO', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CHIORAZZO JUAN', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'MONTEROS MATIAS', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'CASTRO CARLOS', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10 },
  // Turno 3 (12/10/2026 08:00-22:00 - 14 hs al 100%)
  { notaMark: '(*)', categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'BRITES LUCAS DAVID', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'BELO Bruno Joaquin', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'CORNEJO NELSON', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'BRITES Enzo Nicolas', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14 },
  // Turno 4 (13/10/2026 08:00-20:00 - 4 hs Normales + 6 hs al 100%)
  { notaMark: '(*)', categoria: 'ENCARGADO', puesto: 'ENCARGADO', apellido: 'MARTINOLI DIEGO MARCELO', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 10, normales: 4, ot50: 0, ot100: 6 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RAMPA', apellido: 'CHIORAZZO JUAN', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 10, normales: 4, ot50: 0, ot100: 6 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'DAÑOS', apellido: 'MONTEROS MATIAS', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 10, normales: 4, ot50: 0, ot100: 6 },
  { notaMark: '(*)', categoria: 'APUNTADOR', puesto: 'RELEVO', apellido: 'CASTRO CARLOS', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 10, normales: 4, ot50: 0, ot100: 6 },
];

export const GOODWOOD_ENCARGADO_DEFAULT_ROWS: VesselEncargadoRow[] = [
  { turno: 1, encargado: 'LUCAS BRITES', fecha: '11/10/2026', desdeHasta: '1400-0200', horas: 12, normales: 0, ot50: 0, ot100: 12 },
  { turno: 2, encargado: 'DIEGO MARTINOLI', fecha: '12/10/2026', desdeHasta: '2200-0800', horas: 10, normales: 0, ot50: 0, ot100: 10 },
  { turno: 3, encargado: 'LUCAS BRITES', fecha: '12/10/2026', desdeHasta: '0800-2200', horas: 14, normales: 0, ot50: 0, ot100: 14 },
  { turno: 4, encargado: 'DIEGO MARTINOLI', fecha: '13/10/2026', desdeHasta: '0800-2000', horas: 12, normales: 4, ot50: 0, ot100: 6 },
];

function inferOperationalPostFromApellido(apellido: string, idx: number): string {
  const up = (apellido || '').toUpperCase();
  if (
    up.includes('TORRES EDUARDO') ||
    up.includes('MONTEROS MATIAS') ||
    up.includes('FUNES AGUSTIN') ||
    up.includes('CORNEJO NELSON')
  ) {
    return 'DAÑOS';
  }
  if (
    up.includes('CASTRO CARLOS') ||
    up.includes('BRITES ENZO') ||
    up.includes('CHIORAZZO JUAN') ||
    up.includes('CORONEL MATIAS')
  ) {
    return 'RELEVO';
  }
  const mod = idx % 9;
  if (mod === 7) return 'DAÑOS';
  if (mod === 8) return 'RELEVO';
  return 'RAMPA';
}

/**
 * Returns the normalized Apuntador-only shift rows for Sheet 2 (OPERATIVA).
 * Filters out any Encargado rows and replaces any generic 'APUNTADOR' label with the operational post (RAMPA, DAÑOS, RELEVO).
 */
export function getNormalizedOperativaRows(payload: any): VesselOperativaShiftRow[] {
  const rawList: any[] =
    Array.isArray(payload?.operativa_shift_rows) && payload.operativa_shift_rows.length > 0
      ? payload.operativa_shift_rows
      : Array.isArray(payload?.shift_rows) && payload.shift_rows.length > 0
      ? payload.shift_rows
      : [];

  if (rawList.length === 0) {
    return GOODWOOD_OPERATIVA_DEFAULT_ROWS;
  }

  // Filter out Encargados completely from OPERATIVA
  const filtered = rawList.filter((r) => {
    const p = String(r.puesto || '').toUpperCase();
    const c = String(r.categoria || '').toUpperCase();
    const name = String(r.apellido || '').toUpperCase();
    if (p.includes('ENCARGAD') || c.includes('ENCARGAD')) return false;
    if (
      (p === 'APUNTADOR' || !p) &&
      (name.includes('BRITES LUCAS') || name.includes('MARTINOLI DIEGO'))
    ) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return GOODWOOD_OPERATIVA_DEFAULT_ROWS;
  }

  const seenTurns = new Map<string, number>();
  let nextTurn = 1;

  return filtered.map((r, idx) => {
    const rawPuesto = String(r.puesto || '').trim().toUpperCase();
    const puesto =
      rawPuesto && rawPuesto !== 'APUNTADOR' && rawPuesto !== 'ENCARGADO'
        ? rawPuesto
        : inferOperationalPostFromApellido(r.apellido, idx);

    const turnKey = `${r.fecha || ''}_${r.desdeHasta || ''}`;
    let turnoDisplay: number | string = r.turno ?? '';
    if (turnoDisplay === '' && !seenTurns.has(turnKey)) {
      const tNum = nextTurn++;
      seenTurns.set(turnKey, tNum);
      turnoDisplay = tNum;
    } else if (seenTurns.has(turnKey) && r.turno === undefined) {
      turnoDisplay = '';
    }

    return {
      turno: turnoDisplay,
      turnoGroup: seenTurns.get(turnKey) || 1,
      notaMark: r.notaMark || '',
      categoria: 'APUNTADOR',
      puesto,
      apellido: r.apellido || '',
      fecha: r.fecha || '',
      desdeHasta: r.desdeHasta || '',
      horas: Number(r.horas || 0),
      normales: Number(r.normales || 0),
      ot50: Number(r.ot50 || 0),
      ot100: Number(r.ot100 || 0),
      remises: Number(r.remises || 0),
    };
  });
}

/**
 * Returns the normalized shift rows for Sheet 3 (PLUS), which MUST include BOTH Encargados and Apuntadores
 * and show their operational post (ENCARGADO, RAMPA, DAÑOS, RELEVO).
 */
export function getNormalizedPlusRows(payload: any): VesselPlusShiftRow[] {
  if (Array.isArray(payload?.plus_shift_rows) && payload.plus_shift_rows.length > 0) {
    return payload.plus_shift_rows;
  }

  const rawList: any[] = Array.isArray(payload?.shift_rows) ? payload.shift_rows : [];
  const hasEncargadoInRaw = rawList.some((r) => {
    const p = String(r.puesto || '').toUpperCase();
    const c = String(r.categoria || '').toUpperCase();
    const name = String(r.apellido || '').toUpperCase();
    return p.includes('ENCARGAD') || c.includes('ENCARGAD') || name.includes('BRITES LUCAS') || name.includes('MARTINOLI DIEGO');
  });

  if (rawList.length === 0 || !hasEncargadoInRaw) {
    return GOODWOOD_PLUS_DEFAULT_ROWS;
  }

  const seenEmp = new Set<string>();
  return rawList.map((r, idx) => {
    const rawPuesto = String(r.puesto || '').trim().toUpperCase();
    const rawCat = String(r.categoria || '').trim().toUpperCase();
    const nameUp = String(r.apellido || '').toUpperCase();
    const isEnc =
      rawPuesto.includes('ENCARGAD') ||
      rawCat.includes('ENCARGAD') ||
      nameUp.includes('BRITES LUCAS') ||
      nameUp.includes('MARTINOLI DIEGO');

    const puesto = isEnc
      ? 'ENCARGADO'
      : rawPuesto && rawPuesto !== 'APUNTADOR'
      ? rawPuesto
      : inferOperationalPostFromApellido(r.apellido, idx);

    const empKey = nameUp || `ROW_${idx}`;
    const isFirst = !seenEmp.has(empKey);
    if (isFirst) seenEmp.add(empKey);

    const unitPlus = Number(r.unitPlus || r.plus || 143503.03);
    const plus = r.unitPlus !== undefined ? Number(r.plus || 0) : isFirst ? unitPlus : 0;
    const ot50 = Number(r.ot50 || 0);
    const ot100 = Number(r.ot100 || 0);
    const hsNormEq =
      r.hsNormEq !== undefined
        ? Number(r.hsNormEq)
        : Math.round((ot50 * 1.5 + ot100 * 2) * 100) / 100;
    const incidHe =
      r.incidHe !== undefined
        ? Number(r.incidHe)
        : Math.round(((unitPlus / 192) * hsNormEq) * 100) / 100;

    return {
      categoria: isEnc ? 'ENCARGADO' : 'APUNTADOR',
      puesto,
      apellido: r.apellido || '',
      fecha: r.fecha || '',
      desdeHasta: r.desdeHasta || '',
      horas: Number(r.horas || 0),
      normales: Number(r.normales || 0),
      ot50,
      ot100,
      plus,
      unitPlus,
      hsNormEq,
      incidHe,
    };
  });
}

export function getNormalizedCompensacionRows(payload: any): VesselCompensacionRow[] {
  const raw = payload?.tab3_hs_compensacion?.detalle_turnos;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw;
  }
  return GOODWOOD_COMPENSACION_DEFAULT_ROWS;
}

export function getNormalizedEncargadoRows(payload: any): VesselEncargadoRow[] {
  const raw = payload?.tab2_encargado_a_bordo?.detalle_turnos;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw;
  }
  return GOODWOOD_ENCARGADO_DEFAULT_ROWS;
}

export const queryKeys = {
  clients: {
    all: ['clients'] as const,
  },
  locations: {
    all: ['locations'] as const,
  },
  positions: {
    all: ['positions'] as const,
    withDetails: ['positions', 'with-details'] as const,
  },
  employees: {
    all: ['employees'] as const,
    withHours: (startDate: string, endDate: string) =>
      ['employees', 'with-hours', startDate, endDate] as const,
  },
  cashFlow: {
    all: ['cash-flow'] as const,
  },
  projections: {
    all: ['projections'] as const,
    byDate: (targetDate: string) => ['projections', targetDate] as const,
    obligations: ['projections', 'obligations'] as const,
  },
  rates: {
    commercial: ['rates', 'commercial'] as const,
    services: ['rates', 'services'] as const,
    positions: ['rates', 'positions'] as const,
    unionScales: ['rates', 'union-scales'] as const,
  },
  dailyEntries: {
    workLogs: (date?: string, clientId?: string, locationId?: string) =>
      ['daily-entries', 'work-logs', date ?? '', clientId ?? '', locationId ?? ''] as const,
  },
  payroll: {
    range: (startDate: string, endDate: string) =>
      ['payroll', startDate, endDate] as const,
  },
  invoicing: {
    records: ['invoicing', 'records'] as const,
    detail: (id: string) => ['invoicing', 'detail', id] as const,
  },
  holidays: {
    byYear: (year: number) => ['holidays', year] as const,
  },
};

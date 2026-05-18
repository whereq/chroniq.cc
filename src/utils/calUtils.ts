export const pad = (n: number): string => String(n).padStart(2, '0');

export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const md = (d: Date): string =>
  `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const TODAY = new Date();

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function addYears(d: Date, n: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, TODAY);
}

/**
 * Returns the start of the week containing `d`.
 * weekStart: 0 = Sunday, 1 = Monday
 */
export function startOfWeek(d: Date, weekStart: 0 | 1 = 0): Date {
  const day = d.getDay(); // 0=Sun
  const diff = (day - weekStart + 7) % 7;
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -diff);
}

/**
 * Returns a 6-row × 7-col matrix of dates for the month of `d`.
 */
export function monthMatrix(d: Date, weekStart: 0 | 1 = 0): Date[][] {
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = startOfWeek(firstDay, weekStart);
  const matrix: Date[][] = [];
  let cur = start;
  for (let row = 0; row < 6; row++) {
    const week: Date[] = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    matrix.push(week);
  }
  return matrix;
}

/**
 * ISO week number
 */
export function weekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((d.getTime() - onejan.getTime()) / 86400000) + 1;
  return Math.ceil((dayOfYear + onejan.getDay()) / 7);
}

export const HOLIDAY_COLOR = {
  local: 'var(--tile-blue)',
  global: 'var(--tile-emerald)',
};

export const getRegionColor = (region: string): string =>
  region === 'global' ? HOLIDAY_COLOR.global : HOLIDAY_COLOR.local;

export const KIND_COLOR: Record<string, string> = {
  meeting: 'var(--tile-blue)',
  event: 'var(--tile-amber)',
  birthday: 'var(--tile-magenta)',
};

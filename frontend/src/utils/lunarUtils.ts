// Simplified Chinese lunar calendar for 2025-2027
// Lunar new year dates (Gregorian) for calculating offsets
const LUNAR_NEW_YEAR: Record<number, string> = {
  2025: '2025-01-29', // Year of Snake
  2026: '2026-02-17', // Year of Horse
  2027: '2027-02-06', // Year of Goat
};

// Approximate lunar month lengths (29 or 30 days) for 2026
// Starting from 2026-02-17 (正月初一)
const LUNAR_MONTHS_2026 = [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30];

const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

const LUNAR_MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

// Solar terms for 2026 (approximate dates)
const SOLAR_TERMS_2026: Record<string, string> = {
  '2026-01-05': '小寒',
  '2026-01-20': '大寒',
  '2026-02-04': '立春',
  '2026-02-19': '雨水',
  '2026-03-06': '惊蛰',
  '2026-03-21': '春分',
  '2026-04-05': '清明',
  '2026-04-20': '谷雨',
  '2026-05-05': '立夏',
  '2026-05-21': '小满',
  '2026-06-06': '芒种',
  '2026-06-21': '夏至',
  '2026-07-07': '小暑',
  '2026-07-22': '大暑',
  '2026-08-07': '立秋',
  '2026-08-23': '处暑',
  '2026-09-08': '白露',
  '2026-09-23': '秋分',
  '2026-10-08': '寒露',
  '2026-10-23': '霜降',
  '2026-11-07': '立冬',
  '2026-11-22': '小雪',
  '2026-12-07': '大雪',
  '2026-12-22': '冬至',
};

// Solar terms for 2025 (approximate)
const SOLAR_TERMS_2025: Record<string, string> = {
  '2025-01-05': '小寒',
  '2025-01-20': '大寒',
  '2025-02-03': '立春',
  '2025-02-18': '雨水',
  '2025-03-05': '惊蛰',
  '2025-03-20': '春分',
  '2025-04-04': '清明',
  '2025-04-20': '谷雨',
  '2025-05-05': '立夏',
  '2025-05-21': '小满',
  '2025-06-05': '芒种',
  '2025-06-21': '夏至',
  '2025-07-07': '小暑',
  '2025-07-22': '大暑',
  '2025-08-07': '立秋',
  '2025-08-23': '处暑',
  '2025-09-07': '白露',
  '2025-09-23': '秋分',
  '2025-10-08': '寒露',
  '2025-10-23': '霜降',
  '2025-11-07': '立冬',
  '2025-11-22': '小雪',
  '2025-12-07': '大雪',
  '2025-12-22': '冬至',
};

const ALL_SOLAR_TERMS = { ...SOLAR_TERMS_2025, ...SOLAR_TERMS_2026 };

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiff(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 86400000);
}

export function getLunar(
  date: Date
): { day: number; dayName: string; month: number; monthName: string } | null {
  const year = date.getFullYear();

  // We support 2025 and 2026 only
  let lnyDate: Date | null = null;
  let monthLengths: number[] = [];

  if (year === 2025 || (year === 2026 && date < new Date('2026-02-17'))) {
    lnyDate = new Date(LUNAR_NEW_YEAR[2025]);
    monthLengths = [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30];
  } else if (year === 2026 || (year === 2027 && date < new Date('2027-02-06'))) {
    lnyDate = new Date(LUNAR_NEW_YEAR[2026]);
    monthLengths = LUNAR_MONTHS_2026;
  } else {
    return null;
  }

  const diff = dayDiff(date, lnyDate);
  if (diff < 0) {
    // Before lunar new year — use previous year's last month
    // Simplified: count from previous year's LNY
    const prevYear = year === 2026 ? 2025 : 2024;
    const prevLNY = LUNAR_NEW_YEAR[prevYear];
    if (!prevLNY) return null;
    const prevDate = new Date(prevLNY);
    const d2 = dayDiff(date, prevDate);
    if (d2 < 0) return null;
    const prevMonths = [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30];
    let remaining = d2;
    let month = 0;
    while (month < prevMonths.length && remaining >= prevMonths[month]) {
      remaining -= prevMonths[month];
      month++;
    }
    const day = remaining + 1;
    return {
      day,
      dayName: LUNAR_DAY_NAMES[day - 1] ?? String(day),
      month: month + 1,
      monthName: LUNAR_MONTH_NAMES[month] ?? String(month + 1),
    };
  }

  let remaining = diff;
  let month = 0;
  while (month < monthLengths.length && remaining >= monthLengths[month]) {
    remaining -= monthLengths[month];
    month++;
  }

  const day = remaining + 1;
  return {
    day,
    dayName: LUNAR_DAY_NAMES[day - 1] ?? String(day),
    month: month + 1,
    monthName: LUNAR_MONTH_NAMES[month] ?? String(month + 1),
  };
}

export function solarTermFor(date: Date): string | null {
  const key = toDateKey(date);
  return ALL_SOLAR_TERMS[key] ?? null;
}

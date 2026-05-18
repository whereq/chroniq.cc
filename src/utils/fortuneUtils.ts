import type { WeatherCondition } from '../types';
import { getLunar, solarTermFor } from './lunarUtils';

const WESTERN_LINES = [
  'The path you seek is already beneath your feet.',
  'A quiet moment will open a door you forgot to look for.',
  'What you give freely returns threefold.',
  'The tide turns — patience is your compass today.',
  'Small steps taken with care outlast great leaps made in haste.',
  'A conversation you delay is the one most worth having.',
  'The pattern becomes clear when you step back.',
  'Something long dormant stirs toward the light.',
  'Trust the instinct that keeps interrupting your reasoning.',
  'The calendar marks a day; you decide what it means.',
  'Stillness is not emptiness — it is preparation.',
  'The tool fits your hand today; use it.',
  'A name you haven\'t thought of in years may reappear.',
  'Clarity arrives like weather: suddenly, then it was always obvious.',
  'You are further along than you believe.',
  'What appears as obstacle is often a detour toward better ground.',
  'The right question matters more than any answer.',
  'Rest is not retreat — it is how endurance is built.',
  'A thread of connection you let slip is still reachable.',
  'The stars note your effort even when no one else does.',
];

const MOODS = [
  'Reflective', 'Energised', 'Focused', 'Serene', 'Curious',
  'Resolute', 'Open', 'Grounded', 'Inspired', 'Cautious',
];

const FOCUS_AREAS = [
  'Communication', 'Creativity', 'Relationships', 'Finance', 'Health',
  'Learning', 'Planning', 'Rest', 'Collaboration', 'Self-reflection',
];

const LUCKY_COLORS = [
  'Amber', 'Cobalt', 'Sage', 'Coral', 'Indigo',
  'Ivory', 'Teal', 'Crimson', 'Slate', 'Ochre',
];

const MOODS_ZH: Record<string, string> = {
  Reflective: '内省', Energised: '活力', Focused: '专注', Serene: '平静', Curious: '好奇',
  Resolute: '坚定', Open: '开放', Grounded: '踏实', Inspired: '受启发', Cautious: '谨慎',
};

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function dateSeed(date: Date): number {
  return (
    date.getFullYear() * 366 +
    date.getMonth() * 31 +
    date.getDate()
  ) % 9973;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRand(seed) * arr.length)];
}

export function getWesternFortune(
  date: Date,
  locale: string
): {
  line: string;
  mood: string;
  focus: string;
  luckyColor: string;
  luckyNumber: number;
} {
  const seed = dateSeed(date);
  const line = pick(WESTERN_LINES, seed);
  const mood = pick(MOODS, seed + 1);
  const focus = pick(FOCUS_AREAS, seed + 2);
  const luckyColor = pick(LUCKY_COLORS, seed + 3);
  const luckyNumber = Math.floor(seededRand(seed + 4) * 99) + 1;

  const moodLocale =
    locale === 'zh' || locale === 'ja' || locale === 'ko'
      ? (MOODS_ZH[mood] ?? mood)
      : mood;

  return { line, mood: moodLocale, focus, luckyColor, luckyNumber };
}

const YI_POOL = ['出行', '会友', '签约', '购物', '求职', '学习', '祈福', '动土'];
const JI_POOL = ['争讼', '动刀', '远行', '嫁娶', '开业', '入宅', '新船下水', '伐木'];

const ZODIAC_NAMES = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function getGanzhi(date: Date): string {
  // 2026 is 丙午年 (Horse year)
  // Year stem base: 甲 = 4 AD (mod 10), branch base: 子 = 4 AD (mod 12)
  const year = date.getFullYear();
  const stemIdx = (year - 4) % 10;
  const branchIdx = (year - 4) % 12;
  return HEAVENLY_STEMS[(stemIdx + 10) % 10] + EARTHLY_BRANCHES[(branchIdx + 12) % 12];
}

function getZodiac(year: number): string {
  return ZODIAC_NAMES[(year - 4) % 12 < 0 ? ((year - 4) % 12 + 12) : (year - 4) % 12];
}

const CN_SUMMARIES = [
  '今日气象平和，宜静心处事，积善积德。',
  '星象显吉，百事顺遂，贵人相助。',
  '日月交辉，诸事可为，宜把握时机。',
  '风云变幻，处事需稳，谨慎为上。',
  '内外皆顺，心想事成，勇往直前。',
  '福星高照，财运亨通，广结善缘。',
  '天时地利，适合谋划，步步为营。',
  '心境澄明，思路清晰，决断有力。',
];

export function getChineseFortune(
  date: Date,
  weather?: WeatherCondition | null
): {
  summary: string;
  yi: string[];
  ji: string[];
  ganzhi: string;
  zodiac: string;
} {
  const seed = dateSeed(date);
  const lunar = getLunar(date);
  const term = solarTermFor(date);

  let summary = pick(CN_SUMMARIES, seed + 5);

  if (term) {
    summary = `今值${term}，` + summary;
  } else if (lunar) {
    summary = `农历${lunar.monthName}${lunar.dayName}，` + summary;
  }

  if (weather) {
    if (weather.condition === 'sun') summary += '晴空万里，心情舒畅。';
    else if (weather.condition === 'rain') summary += '细雨润物，柔情入怀。';
    else if (weather.condition === 'snow') summary += '白雪皑皑，心境清净。';
  }

  // Pick 3 yi and 3 ji deterministically
  const yi: string[] = [];
  const ji: string[] = [];
  const yiSeed = (seed * 7 + 3) % 997;
  const jiSeed = (seed * 11 + 5) % 997;

  const usedYi = new Set<number>();
  const usedJi = new Set<number>();

  for (let i = 0; i < 3; i++) {
    let idx = Math.floor(seededRand(yiSeed + i * 13) * YI_POOL.length);
    while (usedYi.has(idx)) idx = (idx + 1) % YI_POOL.length;
    usedYi.add(idx);
    yi.push(YI_POOL[idx]);

    let jdx = Math.floor(seededRand(jiSeed + i * 17) * JI_POOL.length);
    while (usedJi.has(jdx)) jdx = (jdx + 1) % JI_POOL.length;
    usedJi.add(jdx);
    ji.push(JI_POOL[jdx]);
  }

  const ganzhi = getGanzhi(date);
  const zodiac = getZodiac(date.getFullYear());

  return { summary, yi, ji, ganzhi, zodiac };
}

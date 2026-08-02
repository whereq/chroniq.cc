import type { WeatherCondition } from '../types';

interface ClimateBaseline {
  meanTemp: number;     // annual mean °C
  amplitude: number;   // seasonal variation °C
  precipProb: number;  // 0-1
  hemisphere: 'N' | 'S';
  unit: '°C' | '°F';
  city: string;
}

const CLIMATE: Record<string, ClimateBaseline> = {
  US: { meanTemp: 12, amplitude: 14, precipProb: 0.3, hemisphere: 'N', unit: '°F', city: 'New York' },
  CN: { meanTemp: 13, amplitude: 18, precipProb: 0.35, hemisphere: 'N', unit: '°C', city: 'Beijing' },
  FR: { meanTemp: 12, amplitude: 10, precipProb: 0.4, hemisphere: 'N', unit: '°C', city: 'Paris' },
  DE: { meanTemp: 10, amplitude: 12, precipProb: 0.42, hemisphere: 'N', unit: '°C', city: 'Berlin' },
  JP: { meanTemp: 15, amplitude: 14, precipProb: 0.38, hemisphere: 'N', unit: '°C', city: 'Tokyo' },
  KR: { meanTemp: 13, amplitude: 16, precipProb: 0.35, hemisphere: 'N', unit: '°C', city: 'Seoul' },
  ES: { meanTemp: 16, amplitude: 12, precipProb: 0.28, hemisphere: 'N', unit: '°C', city: 'Madrid' },
  IT: { meanTemp: 15, amplitude: 12, precipProb: 0.3, hemisphere: 'N', unit: '°C', city: 'Rome' },
  GB: { meanTemp: 11, amplitude: 8, precipProb: 0.48, hemisphere: 'N', unit: '°C', city: 'London' },
  CA: { meanTemp: 8, amplitude: 18, precipProb: 0.35, hemisphere: 'N', unit: '°F', city: 'Toronto' },
  AU: { meanTemp: 19, amplitude: 8, precipProb: 0.32, hemisphere: 'S', unit: '°C', city: 'Sydney' },
  NZ: { meanTemp: 13, amplitude: 7, precipProb: 0.38, hemisphere: 'S', unit: '°C', city: 'Auckland' },
  BR: { meanTemp: 24, amplitude: 4, precipProb: 0.45, hemisphere: 'S', unit: '°C', city: 'São Paulo' },
  AR: { meanTemp: 18, amplitude: 8, precipProb: 0.3, hemisphere: 'S', unit: '°C', city: 'Buenos Aires' },
  ZA: { meanTemp: 17, amplitude: 7, precipProb: 0.28, hemisphere: 'S', unit: '°C', city: 'Cape Town' },
  IN: { meanTemp: 28, amplitude: 6, precipProb: 0.35, hemisphere: 'N', unit: '°C', city: 'Mumbai' },
  SG: { meanTemp: 27, amplitude: 1, precipProb: 0.55, hemisphere: 'N', unit: '°C', city: 'Singapore' },
  TH: { meanTemp: 30, amplitude: 3, precipProb: 0.45, hemisphere: 'N', unit: '°C', city: 'Bangkok' },
  ID: { meanTemp: 28, amplitude: 2, precipProb: 0.5, hemisphere: 'S', unit: '°C', city: 'Jakarta' },
  MY: { meanTemp: 28, amplitude: 1, precipProb: 0.52, hemisphere: 'N', unit: '°C', city: 'Kuala Lumpur' },
  PH: { meanTemp: 29, amplitude: 3, precipProb: 0.5, hemisphere: 'N', unit: '°C', city: 'Manila' },
  VN: { meanTemp: 26, amplitude: 5, precipProb: 0.45, hemisphere: 'N', unit: '°C', city: 'Hanoi' },
  TW: { meanTemp: 23, amplitude: 9, precipProb: 0.42, hemisphere: 'N', unit: '°C', city: 'Taipei' },
  PK: { meanTemp: 26, amplitude: 14, precipProb: 0.18, hemisphere: 'N', unit: '°C', city: 'Karachi' },
  SA: { meanTemp: 30, amplitude: 12, precipProb: 0.05, hemisphere: 'N', unit: '°C', city: 'Riyadh' },
  EG: { meanTemp: 24, amplitude: 10, precipProb: 0.06, hemisphere: 'N', unit: '°C', city: 'Cairo' },
  NG: { meanTemp: 28, amplitude: 3, precipProb: 0.48, hemisphere: 'N', unit: '°C', city: 'Lagos' },
  GH: { meanTemp: 27, amplitude: 2, precipProb: 0.44, hemisphere: 'N', unit: '°C', city: 'Accra' },
  MX: { meanTemp: 18, amplitude: 8, precipProb: 0.32, hemisphere: 'N', unit: '°C', city: 'Mexico City' },
  PL: { meanTemp: 9, amplitude: 14, precipProb: 0.42, hemisphere: 'N', unit: '°C', city: 'Warsaw' },
  SE: { meanTemp: 7, amplitude: 16, precipProb: 0.38, hemisphere: 'N', unit: '°C', city: 'Stockholm' },
  NL: { meanTemp: 11, amplitude: 10, precipProb: 0.44, hemisphere: 'N', unit: '°C', city: 'Amsterdam' },
  PT: { meanTemp: 16, amplitude: 9, precipProb: 0.3, hemisphere: 'N', unit: '°C', city: 'Lisbon' },
  RU: { meanTemp: 5, amplitude: 24, precipProb: 0.36, hemisphere: 'N', unit: '°C', city: 'Moscow' },
  UA: { meanTemp: 8, amplitude: 20, precipProb: 0.38, hemisphere: 'N', unit: '°C', city: 'Kyiv' },
  TR: { meanTemp: 14, amplitude: 14, precipProb: 0.32, hemisphere: 'N', unit: '°C', city: 'Istanbul' },
};

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function makeSeed(region: string, date: Date): number {
  return (
    (region.charCodeAt(0) * 31 +
      date.getFullYear() * 366 +
      date.getMonth() * 31 +
      date.getDate()) %
    997
  );
}

function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export const WEATHER_COLOR: Record<string, string> = {
  sun: 'var(--tile-amber)',
  partly: 'var(--tile-teal)',
  cloud: 'var(--muted)',
  rain: 'var(--tile-blue)',
  storm: 'var(--tile-violet)',
  snow: '#A8D8EA',
  fog: 'var(--muted)',
};

export const WEATHER_EMOJI: Record<string, string> = {
  sun: '☀️',
  partly: '⛅',
  cloud: '☁️',
  rain: '🌧️',
  storm: '⛈️',
  snow: '❄️',
  fog: '🌫️',
};

export function getWeatherForecast(
  region: string,
  date: Date
): WeatherCondition | null {
  const climate = CLIMATE[region];
  if (!climate) return null;

  const seed = makeSeed(region, date);
  const r1 = seededRand(seed);
  const r2 = seededRand(seed + 3);
  const r3 = seededRand(seed + 7);

  // Seasonal offset: 0 at summer peak, 1 at winter trough
  const dayOfYear =
    Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
      86400000
    ) + 1;
  const yearFraction = dayOfYear / 365;

  // N hemisphere: summer = Jul (0.5), winter = Jan (0)
  // S hemisphere: inverted
  const peakFraction = climate.hemisphere === 'N' ? 0.58 : 0.08;
  const seasonalPhase = Math.cos(2 * Math.PI * (yearFraction - peakFraction));

  const meanC = climate.meanTemp + climate.amplitude * seasonalPhase * 0.5;
  const rangeC = 8 + climate.amplitude * 0.3;

  let highC = meanC + rangeC / 2 + r1 * 4 - 2;
  let lowC = highC - rangeC - r2 * 3;

  // Determine precipitation / condition
  const isWinter = seasonalPhase < -0.5;
  const isSummer = seasonalPhase > 0.5;
  const precipRoll = r3;
  const precipChance =
    climate.precipProb * (isWinter ? 1.2 : isSummer ? 0.8 : 1.0);

  let condition: WeatherCondition['condition'];

  if (precipRoll < precipChance * 0.15) {
    condition = highC < 2 ? 'snow' : 'storm';
  } else if (precipRoll < precipChance * 0.55) {
    condition = 'rain';
  } else if (precipRoll < precipChance * 0.75) {
    condition = 'cloud';
  } else if (precipRoll < precipChance * 0.88) {
    condition = 'fog';
  } else if (precipRoll < precipChance + 0.15) {
    condition = 'partly';
  } else {
    condition = 'sun';
  }

  // Override: hot arid climates rarely snow
  if ((region === 'SA' || region === 'EG') && condition === 'snow') {
    condition = 'sun';
  }

  let high: number;
  let low: number;

  if (climate.unit === '°F') {
    high = celsiusToFahrenheit(highC);
    low = celsiusToFahrenheit(lowC);
  } else {
    high = Math.round(highC);
    low = Math.round(lowC);
  }

  return {
    condition,
    high,
    low,
    unit: climate.unit,
    city: climate.city,
  };
}

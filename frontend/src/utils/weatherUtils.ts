import type { WeatherCondition } from '../types';

interface ClimateBaseline {
  meanTemp: number;     // annual mean °C
  amplitude: number;   // seasonal variation °C
  precipProb: number;  // 0-1
  hemisphere: 'N' | 'S';
  unit: '°C' | '°F';
  city: string;
}

export const CLIMATE: Record<string, ClimateBaseline> = {
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

// Lat/lon for each region's representative city (matches CLIMATE cities),
// used to fetch a real forecast from open-meteo.
export const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 40.71, lon: -74.01 }, CN: { lat: 39.90, lon: 116.40 }, FR: { lat: 48.85, lon: 2.35 },
  DE: { lat: 52.52, lon: 13.40 }, JP: { lat: 35.68, lon: 139.69 }, KR: { lat: 37.57, lon: 126.98 },
  ES: { lat: 40.42, lon: -3.70 }, IT: { lat: 41.90, lon: 12.50 }, GB: { lat: 51.51, lon: -0.13 },
  CA: { lat: 43.65, lon: -79.38 }, AU: { lat: -33.87, lon: 151.21 }, NZ: { lat: -36.85, lon: 174.76 },
  BR: { lat: -23.55, lon: -46.63 }, AR: { lat: -34.61, lon: -58.38 }, ZA: { lat: -33.92, lon: 18.42 },
  IN: { lat: 19.08, lon: 72.88 }, SG: { lat: 1.35, lon: 103.82 }, TH: { lat: 13.76, lon: 100.50 },
  ID: { lat: -6.21, lon: 106.85 }, MY: { lat: 3.14, lon: 101.69 }, PH: { lat: 14.60, lon: 120.98 },
  VN: { lat: 21.03, lon: 105.85 }, TW: { lat: 25.03, lon: 121.57 }, PK: { lat: 24.86, lon: 67.01 },
  SA: { lat: 24.71, lon: 46.68 }, EG: { lat: 30.04, lon: 31.24 }, NG: { lat: 6.52, lon: 3.38 },
  GH: { lat: 5.60, lon: -0.19 }, MX: { lat: 19.43, lon: -99.13 }, PL: { lat: 52.23, lon: 21.01 },
  SE: { lat: 59.33, lon: 18.07 }, NL: { lat: 52.37, lon: 4.90 }, PT: { lat: 38.72, lon: -9.14 },
  RU: { lat: 55.76, lon: 37.62 }, UA: { lat: 50.45, lon: 30.52 }, TR: { lat: 41.01, lon: 28.98 },
};

/** Map a WMO weather code (open-meteo) to our condition buckets. */
export function wmoToCondition(code: number): WeatherCondition['condition'] {
  if (code === 0) return 'sun';
  if (code === 1 || code === 2) return 'partly';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'cloud';
}

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

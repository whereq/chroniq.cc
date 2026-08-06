import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { WEATHER_EMOJI, WEATHER_COLOR } from '@/utils/weatherUtils';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { ymd } from '@/utils/calUtils';

export function WeatherCard() {
  const { t } = useTranslation();
  const { cursor, filters } = useCalendarStore();
  const cursorDate = new Date(cursor);

  // Real forecast (open-meteo). Only ~16 days out is available; beyond that the
  // lookup misses and we show "no data" rather than a fabricated value.
  const forecast = useWeatherForecast(filters.region);
  const weather = forecast.get(ymd(cursorDate)) ?? null;

  if (!weather) {
    return (
      <div className="weather-card">
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
          {t('weather.noData')}
        </p>
      </div>
    );
  }

  const conditionKey = weather.condition as string;
  const conditionLabel = t(`weather.conditions.${conditionKey}`);

  return (
    <div className="weather-card">
      <div className="weather-main">
        <span
          className="weather-icon"
          style={{ color: WEATHER_COLOR[weather.condition] }}
        >
          {WEATHER_EMOJI[weather.condition]}
        </span>
        <div>
          <div className="weather-temp">
            {weather.high}{weather.unit}
          </div>
          <div className="weather-desc">
            {conditionLabel} · {t('weather.low')} {weather.low}{weather.unit}
          </div>
        </div>
      </div>
      <div className="weather-city">{weather.city}</div>
    </div>
  );
}

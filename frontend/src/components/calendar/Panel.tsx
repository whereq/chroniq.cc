import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { EVENTS, HOLIDAYS, BIRTHDAYS } from '@/data/calendarData';
import { Toggle } from '@/components/common/Toggle';
import { CountryPicker } from '@/components/common/CountryPicker';
import { MiniCalendar } from './MiniCalendar';
import { WeatherCard } from './WeatherCard';
import { FortuneIcon } from './FortuneIcon';
import { ymd, md as getMd, getRegionColor, KIND_COLOR, TODAY, addDays } from '@/utils/calUtils';

function UpcomingEvents() {
  const { t, i18n } = useTranslation();
  const { filters } = useCalendarStore();

  // Get next 30 days of events
  const upcoming: { date: Date; title: string; color: string }[] = [];

  for (let i = 0; i <= 30; i++) {
    const d = addDays(TODAY, i);
    const dateStr = ymd(d);
    const mdStr = getMd(d);

    if (filters.localHolidays) {
      HOLIDAYS.filter((h) => h.date === dateStr && h.region === filters.region).forEach((h) => {
        upcoming.push({
          date: d,
          title: h.name[i18n.language] ?? h.name['en'] ?? '',
          color: getRegionColor(h.region),
        });
      });
    }

    if (filters.globalHolidays) {
      HOLIDAYS.filter((h) => h.date === dateStr && h.region === 'global').forEach((h) => {
        upcoming.push({
          date: d,
          title: h.name[i18n.language] ?? h.name['en'] ?? '',
          color: getRegionColor('global'),
        });
      });
    }

    EVENTS.filter((e) => e.date === dateStr).forEach((e) => {
      if (e.kind === 'meeting' && !filters.meetings) return;
      if (e.kind === 'event' && !filters.events) return;
      upcoming.push({
        date: d,
        title: e.title[i18n.language] ?? e.title['en'] ?? '',
        color: KIND_COLOR[e.kind],
      });
    });

    if (filters.birthdays) {
      BIRTHDAYS.filter((b) => b.md === mdStr).forEach((b) => {
        upcoming.push({ date: d, title: b.name, color: KIND_COLOR['birthday'] });
      });
    }
  }

  const slice = upcoming.slice(0, 8);

  if (slice.length === 0) {
    return (
      <p style={{ fontSize: 11, color: 'var(--muted)', padding: '0 2px' }}>
        {t('cal.noEvents')}
      </p>
    );
  }

  return (
    <div className="upcoming-list">
      {slice.map((item, i) => (
        <div key={i} className="upcoming-item">
          <div
            className="upcoming-stripe"
            style={{ background: item.color }}
          />
          <div className="upcoming-info">
            <div className="upcoming-title">{item.title}</div>
            <div className="upcoming-date">
              {item.date.toLocaleDateString(i18n.language, {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Panel() {
  const { t } = useTranslation();
  const {
    filters,
    updateFilter,
    weekStart,
    setWeekStart,
    weekNumbers,
    setWeekNumbers,
    scope,
  } = useCalendarStore();

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Mini calendar */}
      <MiniCalendar />

      {/* Weather */}
      {filters.weather && <WeatherCard />}

      {/* Fortune trigger */}
      {filters.fortune && <FortuneIcon />}

      {/* Filters section */}
      <div className="panel-section">
        <div className="panel-section-title">{t('panel.filters')}</div>
        <Toggle
          label={t('panel.localHolidays')}
          checked={filters.localHolidays}
          onChange={(v) => updateFilter('localHolidays', v)}
          color="var(--tile-blue)"
        />
        <Toggle
          label={t('panel.globalHolidays')}
          checked={filters.globalHolidays}
          onChange={(v) => updateFilter('globalHolidays', v)}
          color="var(--tile-emerald)"
        />
        <Toggle
          label={t('panel.meetings')}
          checked={filters.meetings}
          onChange={(v) => updateFilter('meetings', v)}
          color="var(--tile-blue)"
        />
        <Toggle
          label={t('panel.events')}
          checked={filters.events}
          onChange={(v) => updateFilter('events', v)}
          color="var(--tile-amber)"
        />
        <Toggle
          label={t('panel.birthdays')}
          checked={filters.birthdays}
          onChange={(v) => updateFilter('birthdays', v)}
          color="var(--tile-magenta)"
        />
      </div>

      {/* Display section */}
      <div className="panel-section">
        <div className="panel-section-title">{t('panel.view')}</div>
        <Toggle
          label={t('panel.weather')}
          checked={filters.weather}
          onChange={(v) => updateFilter('weather', v)}
          color="var(--tile-teal)"
        />
        <Toggle
          label={t('panel.fortune')}
          checked={filters.fortune}
          onChange={(v) => updateFilter('fortune', v)}
          color="var(--tile-amber)"
        />
        <Toggle
          label={t('panel.lunar')}
          checked={filters.lunar}
          onChange={(v) => updateFilter('lunar', v)}
          color="var(--tile-coral)"
        />
        {scope !== 'year' && (
          <Toggle
            label={t('panel.weekNumbers')}
            checked={weekNumbers}
            onChange={setWeekNumbers}
            color="var(--muted)"
          />
        )}
      </div>

      {/* Region */}
      <div className="panel-section">
        <div className="panel-section-title">{t('panel.region')}</div>
        <CountryPicker
          value={filters.region}
          onChange={(code) => updateFilter('region', code)}
        />
      </div>

      {/* Week start */}
      <div className="panel-section">
        <div className="panel-section-title">{t('panel.weekStart')}</div>
        <select
          className="metro-select"
          value={weekStart}
          onChange={(e) => setWeekStart(Number(e.target.value) as 0 | 1)}
        >
          {(() => {
            const days = t('days.full', { returnObjects: true }) as string[];
            return (
              <>
                <option value={0}>{days[0]}</option>
                <option value={1}>{days[1]}</option>
              </>
            );
          })()}
        </select>
      </div>

      {/* Upcoming */}
      <div className="panel-section">
        <div className="panel-section-title">{t('panel.upcoming')}</div>
        <UpcomingEvents />
      </div>
    </div>
  );
}

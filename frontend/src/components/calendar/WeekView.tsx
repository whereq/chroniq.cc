import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import {
  startOfWeek,
  addDays,
  isToday,
  isSameDay,
  ymd,
  getRegionColor,
  KIND_COLOR,
} from '@/utils/calUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function WeekView() {
  const { t, i18n } = useTranslation();
  const { cursor, setCursor, weekStart, filters, bookings, holidays, setSelectedBookingId } = useCalendarStore();
  const cursorDate = new Date(cursor);

  const weekStart_ = startOfWeek(cursorDate, weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart_, i));

  const dayNames = (t('days.short', { returnObjects: true }) as string[]);

  return (
    <div className="week-view">
      {/* Header */}
      <div
        className="week-head"
        style={{
          display: 'grid',
          gridTemplateColumns: `56px repeat(7, 1fr)`,
        }}
      >
        <div className="week-head-time" />
        {days.map((day, i) => {
          const today = isToday(day);
          const selected = isSameDay(day, cursorDate);
          return (
            <div
              key={i}
              className="week-head-day"
              style={{ cursor: 'pointer' }}
              onClick={() => setCursor(day)}
            >
              <div className="week-head-day-name">
                {dayNames[day.getDay()]}
              </div>
              <div
                className={`week-head-day-num${today ? ' today' : ''}`}
                style={
                  selected && !today
                    ? { background: 'var(--surface-3)', fontWeight: 700 }
                    : {}
                }
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `56px repeat(7, 1fr)`,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: 'var(--muted)',
            textAlign: 'right',
            padding: '4px 8px 4px 0',
          }}
        >
          all-day
        </div>
        {days.map((day, di) => {
          const dateStr = ymd(day);
          const allDayHolidays = [
            ...(filters.localHolidays
              ? holidays.filter((h) => h.date === dateStr && h.region === filters.region)
              : []),
            ...(filters.globalHolidays
              ? holidays.filter((h) => h.date === dateStr && h.region === 'global')
              : []),
          ];
          return (
            <div
              key={di}
              style={{
                borderLeft: '1px solid var(--border)',
                padding: '2px 4px',
                minHeight: 24,
              }}
            >
              {allDayHolidays.map((h, hi) => (
                <div
                  key={hi}
                  className="cal-event-chip"
                  style={{
                    background: getRegionColor(h.region),
                    marginBottom: 2,
                    fontSize: 9,
                  }}
                  title={h.name[i18n.language] ?? h.name['en']}
                >
                  {h.name[i18n.language] ?? h.name['en']}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div
        className="week-body"
        style={{
          display: 'grid',
          gridTemplateColumns: `56px repeat(7, 1fr)`,
        }}
      >
        {/* Time labels */}
        <div className="week-time-col">
          {HOURS.map((h) => (
            <div key={h} className="week-time-label">
              {h > 0 ? `${pad2(h)}:00` : ''}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => {
          const dateStr = ymd(day);
          const events = bookings.filter((e) => e.date === dateStr).filter((e) => {
            if (e.kind === 'meeting' && !filters.meetings) return false;
            if (e.kind === 'event' && !filters.events) return false;
            return true;
          });

          return (
            <div key={di} className="week-day-col">
              {HOURS.map((h) => (
                <div key={h} className="week-hour-line" />
              ))}
              {events.map((ev, ei) => {
                const [sh, sm] = ev.start.split(':').map(Number);
                const [eh, em] = ev.end.split(':').map(Number);
                const top = (sh + sm / 60) * 48;
                const height = ((eh + em / 60) - (sh + sm / 60)) * 48;
                return (
                  <div
                    key={ei}
                    className="week-event-block"
                    style={{
                      top,
                      height: Math.max(height, 20),
                      background: KIND_COLOR[ev.kind],
                      cursor: ev.bookingId ? 'pointer' : undefined,
                    }}
                    title={ev.title[i18n.language] ?? ev.title['en']}
                    onClick={ev.bookingId ? () => setSelectedBookingId(ev.bookingId!) : undefined}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {ev.title[i18n.language] ?? ev.title['en']}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 9 }}>
                      {ev.start}–{ev.end}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

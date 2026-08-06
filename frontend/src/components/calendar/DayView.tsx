import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { isToday, ymd, getRegionColor, KIND_COLOR } from '@/utils/calUtils';
import { getLunar, solarTermFor } from '@/utils/lunarUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function DayView() {
  const { t, i18n } = useTranslation();
  const { cursor, filters, bookings, holidays, setSelectedBookingId } = useCalendarStore();
  const cursorDate = new Date(cursor);
  const dateStr = ymd(cursorDate);
  const today = isToday(cursorDate);

  const dayNames = (t('days.full', { returnObjects: true }) as string[]);
  const monthNames = (t('months.full', { returnObjects: true }) as string[]);

  const lunar = filters.lunar ? getLunar(cursorDate) : null;
  const term = filters.lunar ? solarTermFor(cursorDate) : null;

  const dayHolidays = [
    ...(filters.localHolidays
      ? holidays.filter((h) => h.date === dateStr && h.region === filters.region)
      : []),
    ...(filters.globalHolidays
      ? holidays.filter((h) => h.date === dateStr && h.region === 'global')
      : []),
  ];

  const events = bookings.filter((e) => e.date === dateStr).filter((e) => {
    if (e.kind === 'meeting' && !filters.meetings) return false;
    if (e.kind === 'event' && !filters.events) return false;
    return true;
  });

  return (
    <div className="day-view">
      <div className="day-view-head">
        <span
          className="day-view-head-date"
          style={today ? { color: 'var(--accent)' } : {}}
        >
          {monthNames[cursorDate.getMonth()]} {cursorDate.getDate()}
          {today && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                background: 'var(--accent)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 'var(--r-xs)',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                verticalAlign: 'middle',
              }}
            >
              {t('cal.today')}
            </span>
          )}
        </span>
        <span className="day-view-head-day">
          {dayNames[cursorDate.getDay()]}
        </span>
        {(lunar || term) && (
          <span
            style={{
              marginLeft: 12,
              fontSize: 11,
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {term ? `☀️ ${term}` : lunar ? `${lunar.monthName}${lunar.dayName}` : ''}
          </span>
        )}
      </div>

      {/* All-day items */}
      {dayHolidays.length > 0 && (
        <div
          style={{
            padding: '6px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {dayHolidays.map((h, i) => (
            <div
              key={i}
              className="cal-event-chip"
              style={{ background: getRegionColor(h.region) }}
            >
              {h.name[i18n.language] ?? h.name['en']}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div className="day-view-body">
        <div className="day-time-col">
          {HOURS.map((h) => (
            <div key={h} className="day-time-label">
              {h > 0 ? `${pad2(h)}:00` : ''}
            </div>
          ))}
        </div>
        <div className="day-event-col">
          {HOURS.map((h) => (
            <div key={h} className="day-hour-block" />
          ))}
          {events.map((ev, ei) => {
            const [sh, sm] = ev.start.split(':').map(Number);
            const [eh, em] = ev.end.split(':').map(Number);
            const top = (sh + sm / 60) * 60;
            const height = ((eh + em / 60) - (sh + sm / 60)) * 60;
            return (
              <div
                key={ei}
                className="day-event-block"
                style={{
                  top,
                  height: Math.max(height, 24),
                  background: KIND_COLOR[ev.kind],
                  cursor: ev.bookingId ? 'pointer' : undefined,
                }}
                onClick={ev.bookingId ? () => setSelectedBookingId(ev.bookingId!) : undefined}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {ev.title[i18n.language] ?? ev.title['en']}
                </div>
                <div style={{ opacity: 0.8, fontSize: 10 }}>
                  {ev.start}–{ev.end}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

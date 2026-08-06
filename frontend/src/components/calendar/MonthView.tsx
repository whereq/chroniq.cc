import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { BIRTHDAYS } from '@/data/calendarData';
import {
  monthMatrix,
  isToday,
  isSameDay,
  ymd,
  md as getMd,
  getRegionColor,
  KIND_COLOR,
} from '@/utils/calUtils';
import { getLunar, solarTermFor } from '@/utils/lunarUtils';
import type { CalendarItem, CalendarFilters, CalEvent, Holiday } from '@/types';

function getItemsForDate(
  date: Date,
  filters: CalendarFilters,
  locale: string,
  meetings: CalEvent[],
  holidays: Holiday[]
): CalendarItem[] {
  const items: CalendarItem[] = [];
  const dateStr = ymd(date);
  const mdStr = getMd(date);

  // Holidays
  if (filters.localHolidays) {
    holidays.filter(
      (h) => h.date === dateStr && h.region === filters.region
    ).forEach((h) => {
      items.push({
        type: 'holiday',
        title: h.name[locale] ?? h.name['en'] ?? '',
        color: getRegionColor(h.region),
        allDay: true,
        region: h.region,
      });
    });
  }

  if (filters.globalHolidays) {
    holidays.filter(
      (h) => h.date === dateStr && h.region === 'global'
    ).forEach((h) => {
      items.push({
        type: 'holiday',
        title: h.name[locale] ?? h.name['en'] ?? '',
        color: getRegionColor('global'),
        allDay: true,
        region: 'global',
      });
    });
  }

  // Meetings (real bookings from /me/bookings)
  meetings.filter((e) => e.date === dateStr).forEach((e) => {
    if (e.kind === 'meeting' && !filters.meetings) return;
    if (e.kind === 'event' && !filters.events) return;
    items.push({
      type: e.kind,
      title: e.title[locale] ?? e.title['en'] ?? '',
      color: KIND_COLOR[e.kind],
      start: e.start,
      end: e.end,
      bookingId: e.bookingId,
    });
  });

  // Birthdays
  if (filters.birthdays) {
    BIRTHDAYS.filter((b) => b.md === mdStr).forEach((b) => {
      items.push({
        type: 'birthday',
        title: b.name,
        color: KIND_COLOR['birthday'],
        allDay: true,
      });
    });
  }

  return items;
}

export function MonthView() {
  const { t, i18n } = useTranslation();
  const { cursor, setCursor, weekStart, weekNumbers, filters, bookings, holidays, setSelectedBookingId } = useCalendarStore();
  const cursorDate = new Date(cursor);

  const matrix = monthMatrix(cursorDate, weekStart);
  const dayNames = (t('days.short', { returnObjects: true }) as string[]);
  const headerCols = weekStart === 0
    ? dayNames
    : [...dayNames.slice(1), dayNames[0]];

  return (
    <div className="cal-grid">
      {/* Header row */}
      <div className="cal-grid-head" style={{ gridTemplateColumns: weekNumbers ? '32px repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
        {weekNumbers && (
          <div className="cal-grid-head-cell" style={{ fontSize: 9 }}>{t('cal.week')}</div>
        )}
        {headerCols.map((d, i) => (
          <div key={i} className="cal-grid-head-cell">{d}</div>
        ))}
      </div>

      {/* Body */}
      <div className="cal-grid-body-scroll">
        {matrix.map((week, wi) => {
          const wkNum = (() => {
            const d = week[0];
            const onejan = new Date(d.getFullYear(), 0, 1);
            const dayOfYear = Math.ceil((d.getTime() - onejan.getTime()) / 86400000) + 1;
            return Math.ceil((dayOfYear + onejan.getDay()) / 7);
          })();

          return (
            <div
              key={wi}
              className="cal-week-row"
              style={{ gridTemplateColumns: weekNumbers ? '32px repeat(7, 1fr)' : 'repeat(7, 1fr)' }}
            >
              {weekNumbers && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 6,
                    fontSize: 9,
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-mono)',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  {wkNum}
                </div>
              )}
              {week.map((day, di) => {
                const inMonth = day.getMonth() === cursorDate.getMonth();
                const today = isToday(day);
                const selected = isSameDay(day, cursorDate);
                const items = getItemsForDate(day, filters, i18n.language, bookings, holidays);
                const lunar = filters.lunar ? getLunar(day) : null;
                const term = filters.lunar ? solarTermFor(day) : null;
                const maxVisible = 3;
                const visible = items.slice(0, maxVisible);
                const extra = items.length - maxVisible;

                return (
                  <div
                    key={di}
                    className={`cal-day-cell${!inMonth ? ' other-month' : ''}${today ? ' today' : ''}${selected ? ' selected' : ''}`}
                    onClick={() => setCursor(day)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={`cal-day-num${today ? ' today' : ''}`}>
                        {day.getDate()}
                      </span>
                      {(term || lunar) && (
                        <span className="lunar-label">
                          {term ?? lunar?.dayName}
                        </span>
                      )}
                    </div>
                    {visible.map((item, ii) => (
                      <div
                        key={ii}
                        className="cal-event-chip"
                        style={{ background: item.color, cursor: item.bookingId ? 'pointer' : undefined }}
                        title={item.title}
                        onClick={item.bookingId ? (e) => { e.stopPropagation(); setSelectedBookingId(item.bookingId!); } : undefined}
                      >
                        {item.start && (
                          <span style={{ opacity: 0.8, marginRight: 2 }}>{item.start}</span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                    {extra > 0 && (
                      <div className="cal-more-chip">
                        {t('cal.more', { count: extra })}
                      </div>
                    )}
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

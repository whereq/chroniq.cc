import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { HOLIDAYS, EVENTS, BIRTHDAYS } from '@/data/calendarData';
import {
  monthMatrix,
  isToday,
  isSameDay,
  ymd,
  md as getMd,
} from '@/utils/calUtils';

export function YearView() {
  const { t, i18n } = useTranslation();
  const { cursor, setCursor, weekStart, filters } = useCalendarStore();
  const cursorDate = new Date(cursor);
  const year = cursorDate.getFullYear();

  const dayLabels = (t('days.min', { returnObjects: true }) as string[]);
  const monthNames = (t('months.short', { returnObjects: true }) as string[]);

  const headerCols = weekStart === 0
    ? dayLabels
    : [...dayLabels.slice(1), dayLabels[0]];

  return (
    <div className="year-view">
      {Array.from({ length: 12 }, (_, mi) => {
        const monthDate = new Date(year, mi, 1);
        const matrix = monthMatrix(monthDate, weekStart);

        return (
          <div key={mi} className="year-month-card">
            <div className="year-month-title">
              {monthNames[mi]} {year}
            </div>
            <div className="mini-cal-head">
              {headerCols.map((d, i) => (
                <div key={i} className="mini-cal-head-cell">{d}</div>
              ))}
            </div>
            <div className="mini-cal-body">
              {matrix.flat().map((day, di) => {
                const inMonth = day.getMonth() === mi;
                const today = isToday(day);
                const selected = isSameDay(day, cursorDate);

                // Check if day has events
                const dateStr = ymd(day);
                const mdStr = getMd(day);
                const hasHoliday =
                  (filters.localHolidays &&
                    HOLIDAYS.some((h) => h.date === dateStr && h.region === filters.region)) ||
                  (filters.globalHolidays &&
                    HOLIDAYS.some((h) => h.date === dateStr && h.region === 'global'));
                const hasEvent = EVENTS.some(
                  (e) =>
                    e.date === dateStr &&
                    ((e.kind === 'meeting' && filters.meetings) ||
                      (e.kind === 'event' && filters.events))
                );
                const hasBirthday =
                  filters.birthdays && BIRTHDAYS.some((b) => b.md === mdStr);
                const hasItems = hasHoliday || hasEvent || hasBirthday;

                return (
                  <div
                    key={di}
                    className={`mini-day${!inMonth ? ' other-month' : ''}${today ? ' today' : ''}${hasItems && inMonth ? ' has-event' : ''}`}
                    style={
                      selected && !today && inMonth
                        ? { background: 'var(--surface-3)', borderRadius: '50%' }
                        : {}
                    }
                    onClick={() => {
                      if (inMonth) setCursor(day);
                    }}
                    title={day.toLocaleDateString(i18n.language)}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

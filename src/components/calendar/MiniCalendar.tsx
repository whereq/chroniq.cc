import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { monthMatrix, isToday, isSameDay, addMonths, ymd } from '@/utils/calUtils';
import { ChevronLeft, ChevronRight } from '@/components/icons/Icons';

export function MiniCalendar() {
  const { t } = useTranslation();
  const { cursor, setCursor, weekStart } = useCalendarStore();
  const cursorDate = new Date(cursor);

  const [nav, setNav] = useState<Date>(
    new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1)
  );

  const matrix = monthMatrix(nav, weekStart);
  const dayNames = (t('days.min', { returnObjects: true }) as string[]);

  const monthNames = (t('months.short', { returnObjects: true }) as string[]);

  const headerCols = weekStart === 0
    ? dayNames
    : [...dayNames.slice(1), dayNames[0]];

  return (
    <div className="panel-mini-cal">
      <div className="panel-mini-cal-nav">
        <button
          className="btn-icon"
          style={{ padding: 2 }}
          onClick={() => setNav((n) => addMonths(n, -1))}
        >
          <ChevronLeft size={12} />
        </button>
        <span className="panel-mini-cal-title">
          {monthNames[nav.getMonth()]} {nav.getFullYear()}
        </span>
        <button
          className="btn-icon"
          style={{ padding: 2 }}
          onClick={() => setNav((n) => addMonths(n, 1))}
        >
          <ChevronRight size={12} />
        </button>
      </div>
      <div className="mini-cal-head">
        {headerCols.map((d, i) => (
          <div key={i} className="mini-cal-head-cell">{d}</div>
        ))}
      </div>
      <div className="mini-cal-body">
        {matrix.flat().map((day, i) => {
          const inMonth = day.getMonth() === nav.getMonth();
          const today = isToday(day);
          const selected = isSameDay(day, cursorDate);
          return (
            <div
              key={i}
              className={`mini-day${!inMonth ? ' other-month' : ''}${today ? ' today' : ''}`}
              style={
                selected && !today
                  ? { background: 'var(--surface-3)', fontWeight: 600, borderRadius: '50%' }
                  : {}
              }
              onClick={() => {
                setCursor(day);
                // Sync nav if needed
                if (!inMonth) {
                  setNav(new Date(day.getFullYear(), day.getMonth(), 1));
                }
              }}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

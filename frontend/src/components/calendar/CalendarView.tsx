import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { addMonths, addDays, addYears, startOfWeek } from '@/utils/calUtils';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { YearView } from './YearView';
import { ChevronLeft, ChevronRight } from '@/components/icons/Icons';
import type { CalendarScope } from '@/types';

function getTitle(scope: CalendarScope, cursor: Date, monthNames: string[], t: (key: string) => string): string {
  const year = cursor.getFullYear();
  const month = monthNames[cursor.getMonth()];

  switch (scope) {
    case 'year':
      return String(year);
    case 'month':
      return `${month} ${year}`;
    case 'week': {
      return `${month} ${year}`;
    }
    case 'day':
      return `${month} ${cursor.getDate()}, ${year}`;
    default:
      return '';
  }
}

function navigate(scope: CalendarScope, cursor: Date, direction: -1 | 1, weekStart: 0 | 1): Date {
  switch (scope) {
    case 'year':
      return addYears(cursor, direction);
    case 'month':
      return addMonths(cursor, direction);
    case 'week':
      return addDays(cursor, direction * 7);
    case 'day':
      return addDays(cursor, direction);
    default:
      return cursor;
  }
}

export function CalendarView() {
  const { t } = useTranslation();
  const {
    scope,
    setScope,
    cursor,
    setCursor,
    weekStart,
  } = useCalendarStore();
  const cursorDate = new Date(cursor);

  const monthNames = (t('months.short', { returnObjects: true }) as string[]);
  const title = getTitle(scope, cursorDate, monthNames, t);

  const SCOPES: CalendarScope[] = ['year', 'month', 'week', 'day'];

  return (
    <div className="cal-area">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <button
          className="btn-icon"
          onClick={() => setCursor(navigate(scope, cursorDate, -1, weekStart))}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className="btn-icon"
          onClick={() => setCursor(navigate(scope, cursorDate, 1, weekStart))}
        >
          <ChevronRight size={14} />
        </button>
        <span className="cal-toolbar-title">{title}</span>
        <div className="cal-toolbar-spacer" />
        <button
          className="btn btn-outline"
          style={{ padding: '4px 12px', fontSize: 12 }}
          onClick={() => setCursor(new Date())}
        >
          {t('cal.today')}
        </button>
        <div className="scope-tabs">
          {SCOPES.map((s) => (
            <button
              key={s}
              className={`scope-tab${scope === s ? ' active' : ''}`}
              onClick={() => setScope(s)}
            >
              {t(`scope.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* View */}
      {scope === 'year' && <YearView />}
      {scope === 'month' && <MonthView />}
      {scope === 'week' && <WeekView />}
      {scope === 'day' && <DayView />}
    </div>
  );
}

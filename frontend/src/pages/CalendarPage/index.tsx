import { useCalendarStore } from '@/store/calendarStore';
import { Panel } from '@/components/calendar/Panel';
import { CalendarView } from '@/components/calendar/CalendarView';
import { BookingDetailModal } from '@/components/calendar/BookingDetailModal';

export function CalendarPage() {
  const { panelOpen, setPanelOpen } = useCalendarStore();

  // Close panel on mobile when clicking backdrop
  const handleBackdropClick = () => {
    setPanelOpen(false);
  };

  return (
    <div className="workspace">
      {/* Mobile backdrop */}
      <div
        className={`panel-backdrop${panelOpen ? ' visible' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Left panel */}
      <div className={`workspace-panel${panelOpen ? ' open' : ''}`}>
        <Panel />
      </div>

      {/* Calendar area */}
      <CalendarView />

      {/* Booking detail popover (opens when a booking is clicked) */}
      <BookingDetailModal />
    </div>
  );
}

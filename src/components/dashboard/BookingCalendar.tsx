import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingDetails } from "../../types/booking";

interface BookingCalendarProps {
  bookings: BookingDetails[];
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get bookings for this month (excluding cancelled)
  const monthBookings = bookings.filter((item) => {
    const startDate = new Date(item.booking.startDate);
    const endDate = new Date(item.booking.endDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return (startDate <= monthEnd && endDate >= monthStart) && item.booking.status !== 'cancelled';
  });

  // Check if a date has bookings
  const getBookingsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return monthBookings.filter((item) => {
      const startDate = new Date(item.booking.startDate);
      const endDate = new Date(item.booking.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0);
      
      return date >= startDate && date <= endDate;
    });
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 border border-border bg-muted/20"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayBookings = getBookingsForDay(day);
    const hasBooking = dayBookings.length > 0;
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    days.push(
      <div
        key={day}
        className={`h-20 border border-border p-1 ${
          hasBooking ? 'bg-orange-50' : 'bg-background'
        } ${isToday ? 'ring-2 ring-primary' : ''}`}
      >
        <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
          {day}
        </div>
        {hasBooking && (
          <div className="mt-1 space-y-0.5">
            {dayBookings.slice(0, 2).map((booking, idx) => (
              <div
                key={idx}
                className="text-[10px] bg-orange-600 text-white px-1 py-0.5 rounded truncate"
                title={`${booking.client.name} - ${booking.booking.eventType}`}
              >
                {booking.client.name}
              </div>
            ))}
            {dayBookings.length > 2 && (
              <div className="text-[9px] text-muted-foreground">
                +{dayBookings.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Monthly Bookings</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground py-2 border-b border-border"
          >
            {day}
          </div>
        ))}
        {days}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Legend:</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 border border-border rounded"></div>
            <span className="text-muted-foreground">Booking Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            <span className="text-muted-foreground">Event Label</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary rounded"></div>
            <span className="text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingDetails } from "../../types/booking";

interface BookingCalendarProps {
  bookings: BookingDetails[];
}

interface BookingEvent {
  booking: BookingDetails;
  startDay: number;
  endDay: number;
  row: number;
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

  // get bookings for this month (excluding cancelled)
  const monthBookings = bookings.filter((item) => {
    const startDate = new Date(item.booking.startDate);
    const endDate = new Date(item.booking.endDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    return (startDate <= monthEnd && endDate >= monthStart) && item.booking.status !== 'cancelled';
  });

  // convert bookings to events with start/end days in current month
  const bookingEvents: BookingEvent[] = monthBookings.map((booking) => {
    const startDate = new Date(booking.booking.startDate);
    const endDate = new Date(booking.booking.endDate);
    
    // clamp to current month boundaries
    const startDay = startDate.getMonth() === month && startDate.getFullYear() === year
      ? startDate.getDate()
      : 1;
    
    const endDay = endDate.getMonth() === month && endDate.getFullYear() === year
      ? endDate.getDate()
      : daysInMonth;

    return {
      booking,
      startDay,
      endDay,
      row: 0
    };
  });

  // assign rows to events to prevent overlap
  bookingEvents.sort((a, b) => {
    if (a.startDay !== b.startDay) return a.startDay - b.startDay;
    return (b.endDay - b.startDay) - (a.endDay - a.startDay);
  });

  bookingEvents.forEach((event) => {
    const occupiedRows = new Set<number>();
    
    // check which rows are occupied by overlapping events
    bookingEvents.forEach((otherEvent) => {
      if (otherEvent === event) return;
      
      const overlaps = !(event.endDay < otherEvent.startDay || event.startDay > otherEvent.endDay);
      if (overlaps && otherEvent.row >= 0) {
        occupiedRows.add(otherEvent.row);
      }
    });

    // assign to first available row
    let row = 0;
    while (occupiedRows.has(row)) {
      row++;
    }
    event.row = row;
  });

  // check if a date has bookings (for background color)
  const hasBookingOnDay = (day: number) => {
    return bookingEvents.some(event => day >= event.startDay && day <= event.endDay);
  };

  const maxRows = Math.max(...bookingEvents.map(e => e.row), -1) + 1;

  const cellHeight = 60 + maxRows * 18;

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(
      <div 
        key={`empty-${i}`} 
        className="border border-border bg-muted/20"
        style={{ height: `${cellHeight}px` }}
      ></div>
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const hasBooking = hasBookingOnDay(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    days.push(
      <div
        key={day}
        className={`relative border border-border p-1 ${hasBooking ? 'bg-orange-50' : 'bg-background'
          } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
        style={{ height: `${cellHeight}px` }}
      >
        <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
          {day}
        </div>
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

      <div className="relative">
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

        {/* render booking bars as overlays */}
        <div className="absolute top-[40px] left-0 right-0 pointer-events-none">
          {bookingEvents.map((event, idx) => {
            const weekStart = Math.floor((startingDayOfWeek + event.startDay - 1) / 7);
            const weekEnd = Math.floor((startingDayOfWeek + event.endDay - 1) / 7);
            
            const bars = [];
            for (let week = weekStart; week <= weekEnd; week++) {
              const weekFirstDay = week * 7 - startingDayOfWeek + 1;
              const weekLastDay = Math.min(weekFirstDay + 6, daysInMonth);
              
              const barStart = Math.max(event.startDay, weekFirstDay);
              const barEnd = Math.min(event.endDay, weekLastDay);
              
              if (barStart <= barEnd) {
                const colStart = (startingDayOfWeek + barStart - 1) % 7;
                const colEnd = (startingDayOfWeek + barEnd - 1) % 7;
                const span = colEnd - colStart + 1;
                
                const topOffset = week * cellHeight + 20 + event.row * 18;
                
                bars.push(
                  <div
                    key={`${idx}-${week}`}
                    className="absolute h-4 bg-orange-600 text-white px-2 py-0.5 rounded text-[10px] leading-tight truncate pointer-events-auto cursor-pointer flex items-center"
                    style={{
                      left: `${(colStart / 7) * 100}%`,
                      width: `${(span / 7) * 100}%`,
                      top: `${topOffset}px`,
                    }}
                    title={event.booking.booking.eventType ?
                      `${event.booking.client.name} - ${event.booking.booking.eventType}` :
                      event.booking.client.name}
                  >
                    {event.booking.client.name}
                    {event.booking.booking.eventType && ` - ${event.booking.booking.eventType}`}
                  </div>
                );
              }
            }
            
            return bars;
          })}
        </div>
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
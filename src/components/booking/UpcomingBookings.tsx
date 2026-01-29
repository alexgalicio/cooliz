import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllBookings } from "../../services/storage";
import { BookingDetails } from "../../types/booking";
import { formatCurrency, formatDate, formatTime, getStatus } from "../../utils/formatter";

export function UpcomingBookings() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // prevent state update if the component unmounts

    getAllBookings()
      .then((data) => {
        if (cancelled) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset the time of the curr day to exactly midnight

        const future = data
          // keeps only booking where startDate is today or in the future
          .filter((item) => new Date(item.booking.startDate) >= today)
          .sort( // sor booking in ascending order
            (a, b) =>
              new Date(a.booking.startDate).getTime() -
              new Date(b.booking.startDate).getTime()
          )
          .slice(0, 4); // take only the first 4 bookings

        setUpcoming(future);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Upcoming Bookings
        </h2>
        <button
          onClick={() => navigate("/bookings")}
          className="text-sm text-primary hover:underline"
        >
          View all
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          Loading…
        </div>
        // if no upcoming bookings, shwo a message
      ) : upcoming.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No upcoming bookings</p>
          <button
            onClick={() => navigate("/newBooking")}
            className="mt-3 text-primary hover:underline text-sm"
          >
            Create your first booking
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((item) => {
            const status = getStatus(item);
            const totalPaid = item.booking.totalAmount - item.remainingAmount;
            return (
              <button
                key={item.booking.id}
                type="button"
                onClick={() =>
                  item.booking.id != null &&
                  navigate(`/booking/${item.booking.id}`, { state: item })
                }
                className="text-left bg-card rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground truncate min-w-0">
                    {item.client.name}
                  </p>
                  <span
                    className={`badge ${status === "paid"
                      ? "badge-paid"
                      : "badge-partial"
                      }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.booking.eventType}
                </p>
                <p className="text-sm text-foreground mt-2 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {formatDate(item.booking.startDate)}
                </p>
                <p className="text-sm text-foreground mt-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {formatTime(item.booking.startDate)} -{" "}
                  {formatTime(item.booking.endDate)}
                </p>
                <div className="mt-3 pt-3 border-t border-border text-sm flex justify-between">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    Payment
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-foreground flex gap-1">
                      <p>{formatCurrency(totalPaid)}</p>
                      <span>/</span>
                      <p>{formatCurrency(item.booking.totalAmount)}</p>
                    </div>
                    {item.remainingAmount > 0 && (
                      <p className="text-amber-600 font-medium">
                        Balance: {formatCurrency(item.remainingAmount)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

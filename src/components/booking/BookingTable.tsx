import { useNavigate } from "react-router-dom";
import { BookingDetails } from "../../types/booking";
import { formatCurrency, formatDate, formatTime, getStatus } from "../../utils/formatter";

type BookingTableProps = {
  bookings: BookingDetails[];
};

export function BookingTable({ bookings }: BookingTableProps) {
  const navigate = useNavigate();

  // if theres no bookings, show a message
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 font-semibold text-foreground">Client</th>
            <th className="px-4 py-3 font-semibold text-foreground">Start Date</th>
            <th className="px-4 py-3 font-semibold text-foreground">End Date</th>
            <th className="px-4 py-3 font-semibold text-foreground">Time</th>
            <th className="px-4 py-3 font-semibold text-foreground">Booking Cost</th>
            <th className="px-4 py-3 font-semibold text-foreground">Add-ons</th>
            <th className="px-4 py-3 font-semibold text-foreground">Total</th>
            <th className="px-4 py-3 font-semibold text-foreground">Remaining</th>
            <th className="px-4 py-3 font-semibold text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((item) => {
            const status = getStatus(item);
            const amenitiesTotal = (item.booking.extraAmenities || []).reduce(
              (sum, amenity) => sum + amenity.total,
              0
            );
            const totalWithAmenities = item.booking.totalAmount + amenitiesTotal;
            return (
              <tr
                key={item.booking.id}
                onClick={() =>
                  item.booking.id != null &&
                  navigate(`/booking/${item.booking.id}`, { state: item })
                }
                className="border-b border-border last:border-b-0 bg-background hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-foreground">{item.client.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(item.booking.startDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(item.booking.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatTime(item.booking.startDate)} - {formatTime(item.booking.endDate)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(item.booking.totalAmount)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(amenitiesTotal)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(totalWithAmenities)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(item.remainingAmount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      status === "paid"
                        ? "badge-paid"
                        : status === "cancelled"
                        ? "badge-cancelled"
                        : "badge-partial"
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

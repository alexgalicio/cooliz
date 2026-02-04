import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { cancelBooking } from "../services/storage";
import { AddPaymentModal } from "../components/payment/AddPaymentModal";
import { CancelConfirmationModal } from "../components/booking/CancelConfirmationModal";
import { Ban, ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { BookingDetails } from "../types/booking";
import { formatCurrency, formatDate, getStatus } from "../utils/formatter";

function BookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state as BookingDetails | undefined;
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // if no booking passed, show a message
  if (!item) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Booking not found.
          </div>
        </div>
      </MainLayout>
    );
  }

  // function to get confirmation message based on payment status
  function getCancelMessage() {
    if (!item) return "";
    const status = getStatus(item);
    
    if (status === "paid") {
      return "Cancel this booking? Since it's fully paid, 50% will be refunded.";
    } else if (status === "partial") {
      return "Cancel this booking? Since it's partially paid, no refund will be given.";
    }
    return "Cancel this booking? This will mark the event as cancelled.";
  }

  // function to cancel booking
  async function handleCancelConfirm() {
    if (!item?.booking.id) {
      return { success: false, message: "Booking ID not found." };
    }

    try {
      const result = await cancelBooking(item.booking.id);
      
      let message = "";
      if (result.refunded) {
        message = `Booking cancelled. Refund of ${formatCurrency(result.refundAmount)} will be processed.`;
      } else {
        message = "Booking cancelled successfully.";
      }
            
      return { success: true, message };
    } catch (err: unknown) {
      return { 
        success: false, 
        message: "Failed to cancel: " + (err instanceof Error ? err.message : String(err))
      };
    }
  }

  // get status if paid/partial
  const status = getStatus(item);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/bookings")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-2 -m-2 rounded-lg hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              disabled={item.booking.status === "cancelled"}
              className="btn-destructive flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ban className="h-4 w-4" />
              {item.booking.status === "cancelled" ? "Event Cancelled" : "Cancel Event"}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{item.client.name}</h1>
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
          </div>
        </div>

        {/* client info */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Client</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <h3 className="text-muted-foreground">Name</h3>
                <p className="font-medium text-foreground">{item.client.name}</p>
              </div>
              {item.client.phone && (
                <div>
                  <h3 className="text-muted-foreground">Phone</h3>
                  <p className="text-foreground">{item.client.phone}</p>
                </div>
              )}
              {item.client.email && (
                <div>
                  <h3 className="text-muted-foreground">Email</h3>
                  <p className="text-foreground">{item.client.email}</p>
                </div>
              )}
            </dl>
          </div>

          {/* event details */}
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Event Details</h3>
            <dl className="space-y-2 text-sm">
              {item.booking.eventType && (
                <div>
                  <h3 className="text-muted-foreground">Type</h3>
                  <p className="font-medium text-foreground">{item.booking.eventType}</p>
                </div>
              )}
              <div>
                <h3 className="text-muted-foreground">Start</h3>
                <p className="text-foreground">{formatDate(item.booking.startDate)}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground">End</h3>
                <p className="text-foreground">{formatDate(item.booking.endDate)}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground">Total</h3>
                <p className="font-medium text-foreground">
                  {formatCurrency(item.booking.totalAmount)}
                </p>
              </div>
              <div>
                <h3 className="text-muted-foreground">Remaining</h3>
                <p className="font-medium text-foreground">
                  {formatCurrency(item.remainingAmount)}
                </p>
              </div>
            </dl>
          </div>
        </div>

        {/* payment history */}
        <div className="rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Payment History</h3>
            {item.remainingAmount > 0 && item.booking.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setAddPaymentModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add payment
              </button>
            )}
          </div>
          {item.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {item.payments.map((p, idx) => (
                    <tr key={p.id ?? `p-${idx}`} className="border-b border-border last:border-b-0">
                      <td className="py-2 text-foreground">{formatCurrency(p.amount)}</td>
                      <td className="py-2 text-foreground">
                        {p.created_at ? formatDate(p.created_at) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          )}
        </div>

        {/* payment modal */}
        <AddPaymentModal
          open={addPaymentModalOpen}
          onClose={() => setAddPaymentModalOpen(false)}
          item={item}
          onSuccess={(updated) =>
            navigate(location.pathname, { state: updated, replace: true })
          }
        />

        {/* cancel confirmation modal */}
        <CancelConfirmationModal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
          message={getCancelMessage()}
        />
      </div>
    </MainLayout>
  );
}

export default BookingDetail;

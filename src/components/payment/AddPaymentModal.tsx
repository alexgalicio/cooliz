import { addPayment } from "../../services/storage";
import { X } from "lucide-react";
import type { BookingDetails } from "../../types/booking";
import { formatCurrency } from "../../utils/formatter";

type AddPaymentModalProps = {
  open: boolean;        // is modal open
  onClose: () => void;  // fucntion to close modal
  item: BookingDetails; // booking info
  onSuccess: (updated: BookingDetails) => void; // 
};

export function AddPaymentModal({
  open,
  onClose,
  item,
  onSuccess,
}: AddPaymentModalProps) {
  // if modal not open, dont show anything
  if (!open) return null; 

  async function handlePayRemaining() {
    // make sure booking has id
    if (!item.booking.id) return;

    try {
      // add payment to the db
      await addPayment({
        bookingId: item.booking.id,
        amount: item.remainingAmount,
        paymentType: "partial",
      });

      // make new booking object with the payment 
      const updated: BookingDetails = {
        ...item, // keep everything same
        payments: [
          ...item.payments, // keep old payment
          {
            bookingId: item.booking.id,
            amount: item.remainingAmount,
            paymentType: "partial" as const,
            created_at: new Date().toISOString(),
          },
        ],
        remainingAmount: 0, // balance now 0
      };

      onClose();
      onSuccess(updated);
    } catch (err) {
      alert(
        "Failed to add payment: " +
        (err instanceof Error ? err.message : String(err))
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose} // clicking outside modal closes it
    >
      <div
        className="rounded-xl border border-border bg-background p-6 shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // clicking inside modal should not close it
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Add Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* content */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Client</p>
            <p className="font-medium text-foreground">{item.client.name}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(item.booking.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining Balance:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(item.remainingAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Payment Amount:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(item.remainingAmount)}
              </span>
            </div>
          </div>

          {/* buttons */}
          {item.remainingAmount > 0 ? (
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn-outline w-full" onClick={onClose}>Cancel</button>
              <button
                type="button"
                onClick={handlePayRemaining}
                className="btn-primary w-full"
              >
                Pay Remaining
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No balance remaining.</p>
          )}
        </div>
      </div>
    </div>
  );
}

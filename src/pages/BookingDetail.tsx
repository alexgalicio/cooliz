import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { cancelBooking, updateBookingExtraAmenities } from "../services/storage";
import { AddPaymentModal } from "../components/payment/AddPaymentModal";
import { CancelConfirmationModal } from "../components/booking/CancelConfirmationModal";
import { Ban, ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { BookingDetails } from "../types/booking";
import { formatCurrency, formatDate, getStatus } from "../utils/formatter";

const amenityOptions = [
  "Chairs",
  "Tables",
  "Kitchen Items",
  "Sound System",
  "Lighting",
  "Canopy / Tent",
  "Other",
];

type AmenityInput = {
  id: string;
  item: string;
  price: string;
  quantity: string;
};

function BookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state as BookingDetails | undefined;
  const [details, setDetails] = useState<BookingDetails | null>(item ?? null);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [amenities, setAmenities] = useState<AmenityInput[]>(() => {
    if (!item?.booking.extraAmenities || item.booking.extraAmenities.length === 0) {
      return [{ id: crypto.randomUUID(), item: "", price: "", quantity: "" }];
    }

    return item.booking.extraAmenities.map((amenity) => ({
      id: crypto.randomUUID(),
      item: amenity.item,
      price: amenity.price.toString(),
      quantity: amenity.quantity.toString(),
    }));
  });
  const [amenitiesSaving, setAmenitiesSaving] = useState(false);
  const [savedAmenitiesKey, setSavedAmenitiesKey] = useState(() => {
    const initialAmenities = item?.booking.extraAmenities ?? [];
    return JSON.stringify(initialAmenities);
  });

  // if no booking passed, show a message
  if (!details) {
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
    if (!details) return "";
    const status = getStatus(details);
    
    if (status === "paid") {
      return "Cancel this booking? Since it's fully paid, 50% will be refunded.";
    } else if (status === "partial") {
      return "Cancel this booking? Since it's partially paid, no refund will be given.";
    }
    return "Cancel this booking? This will mark the event as cancelled.";
  }

  // function to cancel booking
  async function handleCancelConfirm() {
    if (!details?.booking.id) {
      return { success: false, message: "Booking ID not found." };
    }

    try {
      const result = await cancelBooking(details.booking.id);
      
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
  const status = getStatus(details);
  const amenitiesTotal = (details.booking.extraAmenities || []).reduce(
    (sum, amenity) => sum + amenity.total,
    0
  );
  const totalDue = details.booking.totalAmount + amenitiesTotal;

  const updateAmenity = (id: string, field: keyof AmenityInput, value: string) => {
    setAmenities((prev) =>
      prev.map((amenity) =>
        amenity.id === id ? { ...amenity, [field]: value } : amenity
      )
    );
  };

  const addAmenityRow = () => {
    setAmenities((prev) => [
      ...prev,
      { id: crypto.randomUUID(), item: "", price: "", quantity: "" },
    ]);
  };

  const removeAmenityRow = (id: string) => {
    setAmenities((prev) => prev.filter((amenity) => amenity.id !== id));
  };

  const normalizeAmenities = () => {
    return amenities
      .map((amenity) => {
        const itemValue = amenity.item.trim();
        const price = Number(amenity.price);
        const quantity = Number(amenity.quantity);
        const hasAnyValue = itemValue || amenity.price || amenity.quantity;

        if (!hasAnyValue) {
          return null;
        }

        if (!itemValue) {
          throw new Error("Please choose or enter an amenity item.");
        }

        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Amenity price must be a number 0 or greater.");
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Amenity quantity must be a number greater than 0.");
        }

        return {
          item: itemValue,
          price,
          quantity,
          total: price * quantity,
        };
      })
      .filter((amenity) => amenity !== null);
  };

  const normalizeAmenitiesForCompare = () => {
    return amenities
      .map((amenity) => {
        const itemValue = amenity.item.trim();
        const price = Number(amenity.price);
        const quantity = Number(amenity.quantity);

        if (!itemValue || !Number.isFinite(price) || !Number.isFinite(quantity)) {
          return null;
        }

        return {
          item: itemValue,
          price,
          quantity,
          total: price * quantity,
        };
      })
      .filter((amenity) => amenity !== null);
  };

  const currentAmenitiesKey = JSON.stringify(normalizeAmenitiesForCompare());
  const amenitiesUnchanged = currentAmenitiesKey === savedAmenitiesKey;

  const amenitiesSubtotal = amenities.reduce((sum, amenity) => {
    const price = Number(amenity.price);
    const quantity = Number(amenity.quantity);

    if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
      return sum;
    }

    return sum + price * quantity;
  }, 0);

  async function handleAmenitiesSave() {
    if (!details?.booking.id) return;

    let payload: Array<{ item: string; price: number; quantity: number; total: number }> = [];

    try {
      payload = normalizeAmenities() as Array<{ item: string; price: number; quantity: number; total: number }>;
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Invalid amenities"));
      return;
    }

    setAmenitiesSaving(true);
    try {
      const newAmenitiesTotal = payload.reduce((sum, item) => sum + item.total, 0);
      const totalPaid = details.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const newRemaining = details.booking.totalAmount + newAmenitiesTotal - totalPaid;

      await updateBookingExtraAmenities(details.booking.id, payload.length > 0 ? payload : []);
      const updated: BookingDetails = {
        ...details,
        booking: {
          ...details.booking,
          extraAmenities: payload.length > 0 ? payload : [],
          totalAmount: details.booking.totalAmount,
        },
        remainingAmount: newRemaining,
      };
      setDetails(updated);
      setSavedAmenitiesKey(JSON.stringify(updated.booking.extraAmenities ?? []));
      navigate(location.pathname, { state: updated, replace: true });
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Failed to save amenities"));
    } finally {
      setAmenitiesSaving(false);
    }
  }

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
              disabled={details.booking.status === "cancelled"}
              className="btn-destructive flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ban className="h-4 w-4" />
              {details.booking.status === "cancelled" ? "Event Cancelled" : "Cancel Event"}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{details.client.name}</h1>
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
                <p className="font-medium text-foreground">{details.client.name}</p>
              </div>
              {details.client.phone && (
                <div>
                  <h3 className="text-muted-foreground">Phone</h3>
                  <p className="text-foreground">{details.client.phone}</p>
                </div>
              )}
              {details.client.email && (
                <div>
                  <h3 className="text-muted-foreground">Email</h3>
                  <p className="text-foreground">{details.client.email}</p>
                </div>
              )}
            </dl>
          </div>

          {/* event details */}
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Event Details</h3>
            <dl className="space-y-2 text-sm">
              {details.booking.eventType && (
                <div>
                  <h3 className="text-muted-foreground">Type</h3>
                  <p className="font-medium text-foreground">{details.booking.eventType}</p>
                </div>
              )}
              <div>
                <h3 className="text-muted-foreground">Start</h3>
                <p className="text-foreground">{formatDate(details.booking.startDate)}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground">End</h3>
                <p className="text-foreground">{formatDate(details.booking.endDate)}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground">Total</h3>
                <p className="font-medium text-foreground">
                  {formatCurrency(totalDue)}
                </p>
              </div>
              <div>
                <h3 className="text-muted-foreground">Remaining</h3>
                <p className="font-medium text-foreground">
                  {formatCurrency(details.remainingAmount)}
                </p>
              </div>
            </dl>
          </div>
        </div>

        {/* extra amenities */}
        <div className="rounded-xl border border-border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Extra Amenities</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-outline"
                onClick={addAmenityRow}
                disabled={details.booking.status === "cancelled"}
              >
                Add Item
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAmenitiesSave}
                disabled={amenitiesSaving || details.booking.status === "cancelled" || amenitiesUnchanged}
              >
                {amenitiesSaving ? "Saving..." : amenitiesUnchanged ? "Saved" : "Save Amenities"}
              </button>
            </div>
          </div>

          <datalist id="booking-amenities-list">
            {amenityOptions.map((amenity) => (
              <option key={amenity} value={amenity} />
            ))}
          </datalist>

          <div className="space-y-4">
            {amenities.map((amenity, index) => {
              const price = Number(amenity.price);
              const quantity = Number(amenity.quantity);
              const total = Number.isFinite(price) && Number.isFinite(quantity)
                ? price * quantity
                : 0;

              return (
                <div key={amenity.id} className="grid gap-3 md:grid-cols-12 items-end">
                  <div className="space-y-2 md:col-span-4">
                    <h4>Item</h4>
                    <input
                      list="booking-amenities-list"
                      value={amenity.item}
                      onChange={(e) => updateAmenity(amenity.id, "item", e.target.value)}
                      type="text"
                      placeholder={index === 0 ? "Chairs" : "Select or type"}
                      disabled={details.booking.status === "cancelled"}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <h4>Price per Unit</h4>
                    <input
                      value={amenity.price}
                      onChange={(e) => updateAmenity(amenity.id, "price", e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={details.booking.status === "cancelled"}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <h4>Quantity</h4>
                    <input
                      value={amenity.quantity}
                      onChange={(e) => updateAmenity(amenity.id, "quantity", e.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      disabled={details.booking.status === "cancelled"}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <h4>Total</h4>
                    <input
                      value={total ? total.toFixed(2) : ""}
                      readOnly
                      type="text"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      className="btn-outline w-full"
                      onClick={() => removeAmenityRow(amenity.id)}
                      disabled={amenities.length === 1 || details.booking.status === "cancelled"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 text-sm">
            <span className="text-muted-foreground">Amenities Subtotal</span>
            <span className="font-semibold text-foreground">{amenitiesSubtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* payment history */}
        <div className="rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Payment History</h3>
            {details.remainingAmount > 0 && details.booking.status !== "cancelled" && (
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
          {details.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {details.payments.map((p, idx) => (
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
          item={details}
          onSuccess={(updated) => {
            setDetails(updated);
            navigate(location.pathname, { state: updated, replace: true });
          }}
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

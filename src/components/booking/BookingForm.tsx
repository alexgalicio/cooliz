import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addPayment, createBooking, createClient, isBookingSlotAvailable } from "../../services/storage";

const eventTypes = [
  'Reunion',
  'Birthday',
  'Wedding',
  'Baptism',
  'Christmas Party',
  'Staycation',
  'Swimming',
  'Other',
];

const amenityOptions = [
  'Chairs',
  'Tables',
  'Kitchen Items',
  'Sound System',
  'Lighting',
  'Canopy / Tent',
  'Other',
];

type AmenityInput = {
  id: string;
  item: string;
  price: string;
  quantity: string;
};

function BookingForm() {
  const navigate = useNavigate();
  const [paymentOption, setPaymentOption] = useState<"full" | "partial">("full");
  const [extraAmenities, setExtraAmenities] = useState<AmenityInput[]>([
    { id: crypto.randomUUID(), item: "", price: "", quantity: "" },
  ]);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    eventType: "",
    startDateTime: "",
    endDateTime: "",
    totalAmount: "",
    initialPayment: "",
  });

  const updateAmenity = (id: string, field: keyof AmenityInput, value: string) => {
    setExtraAmenities((prev) =>
      prev.map((amenity) =>
        amenity.id === id ? { ...amenity, [field]: value } : amenity
      )
    );
  };

  const addAmenityRow = () => {
    setExtraAmenities((prev) => [
      ...prev,
      { id: crypto.randomUUID(), item: "", price: "", quantity: "" },
    ]);
  };

  const removeAmenityRow = (id: string) => {
    setExtraAmenities((prev) => prev.filter((amenity) => amenity.id !== id));
  };

  const normalizeAmenities = () => {
    return extraAmenities
      .map((amenity) => {
        const item = amenity.item.trim();
        const price = Number(amenity.price);
        const quantity = Number(amenity.quantity);
        const hasAnyValue = item || amenity.price || amenity.quantity;

        if (!hasAnyValue) {
          return null;
        }

        if (!item) {
          throw new Error("Please choose or enter an amenity item.");
        }

        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Amenity price must be a number 0 or greater.");
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Amenity quantity must be a number greater than 0.");
        }

        return {
          item,
          price,
          quantity,
          total: price * quantity,
        };
      })
      .filter((amenity) => amenity !== null);
  };

  const amenitiesSubtotal = extraAmenities.reduce((sum, amenity) => {
    const price = Number(amenity.price);
    const quantity = Number(amenity.quantity);

    if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
      return sum;
    }

    return sum + price * quantity;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // required fields
    if (!formData.clientName || !formData.startDateTime || !formData.endDateTime || !formData.totalAmount) {
      alert("Please fill in all the required fields.");
      return;
    }

    // validate ph phone number 09XXXXXXXXX or +639XXXXXXXXX
    const phone = formData.clientPhone.trim();
    if (phone) {
      const phPatternLocal = /^09\d{9}$/;
      const phPatternIntl = /^\+639\d{9}$/;
      if (!phPatternLocal.test(phone) && !phPatternIntl.test(phone)) {
        alert("Please enter a valid Philippine mobile number (e.g. 09123456789 or +639123456789).");
        return;
      }
    }

    // validate amount
    const baseTotalAmount = Number(formData.totalAmount);
    if (!Number.isFinite(baseTotalAmount) || baseTotalAmount <= 0) {
      alert("Total amount must be a number greater than 0.");
      return;
    }

    let amenitiesPayload: Array<{ item: string; price: number; quantity: number; total: number }> = [];

    try {
      amenitiesPayload = normalizeAmenities() as Array<{ item: string; price: number; quantity: number; total: number }>;
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Invalid amenities"));
      return;
    }

    const amenitiesTotal = amenitiesPayload.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = baseTotalAmount + amenitiesTotal;

    let initialPayment = totalAmount;
    if (paymentOption === "partial") {
      if (!formData.initialPayment) {
        alert("Please enter an initial payment amount.");
        return;
      }
      initialPayment = Number(formData.initialPayment);
      if (!Number.isFinite(initialPayment) || initialPayment <= 0) {
        alert("Initial payment must be a number greater than 0.");
        return;
      }
      if (initialPayment > totalAmount) {
        alert("Initial payment cannot be greater than the total amount.");
        return;
      }
    }

    // date/time validation
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Please enter valid start and end date/time values.");
      return;
    }
    if (end <= start) {
      alert("End date & time must be after the start date & time.");
      return;
    }

    // check for overlapping bookings
    const slotAvailable = await isBookingSlotAvailable(formData.startDateTime, formData.endDateTime);
    if (!slotAvailable) {
      alert("This date and time range is already booked. Please choose another schedule.");
      return;
    }

    try {
      // create client
      const clientId = await createClient({
        name: formData.clientName,
        phone: formData.clientPhone,
        email: formData.clientEmail,
      });

      // create booking
      const bookingId = await createBooking({
        clientId,
        eventType: formData.eventType,
        startDate: formData.startDateTime,
        endDate: formData.endDateTime,
        totalAmount,
        extraAmenities: amenitiesPayload,
      });

      // create payment
      await addPayment({
        bookingId,
        amount: paymentOption === "full" ? totalAmount : initialPayment,
        paymentType: paymentOption,
      });

      navigate("/bookings");
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Unknown error"));
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit} >
      {/* client info */}
      <div className="rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Client Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <h4>Client Name <span className="required-field">*</span></h4>
            <input
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              type="text" placeholder="Enter client name" />
          </div>
          <div className="space-y-2">
            <h4>Phone Number</h4>
            <input
              value={formData.clientPhone}
              onChange={(e) =>
                setFormData({ ...formData, clientPhone: e.target.value })
              }
              type="text" placeholder="Enter phone number" />
          </div>
          <div className="space-y-2">
            <h4>Email Address</h4>
            <input
              value={formData.clientEmail}
              onChange={(e) =>
                setFormData({ ...formData, clientEmail: e.target.value })
              }
              type="email" placeholder="Enter email address" />
          </div>
        </div>
      </div>

      {/* event details */}
      <div className="rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Event Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <h4>Event Type</h4>
            <select
              value={formData.eventType}
              onChange={(e) =>
                setFormData({ ...formData, eventType: e.target.value })
              }
              className="flex w-full">
              <option value="">Select event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <h4>Start Date & Time <span className="required-field">*</span></h4>
            <input
              value={formData.startDateTime}
              onChange={(e) =>
                setFormData({ ...formData, startDateTime: e.target.value })
              }
              type="datetime-local" />
          </div>
          <div className="space-y-2">
            <h4>End Date & Time <span className="required-field">*</span></h4>
            <input
              value={formData.endDateTime}
              onChange={(e) =>
                setFormData({ ...formData, endDateTime: e.target.value })
              }
              type="datetime-local" />
          </div>
        </div>
      </div>

      {/* payment details */}
      <div className="rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4>Total Amount <span className="required-field">*</span></h4>
            <input
              value={formData.totalAmount}
              onChange={(e) =>
                setFormData({ ...formData, totalAmount: e.target.value })
              }
              type="text" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <h4>Payment Option</h4>
            <div className="flex gap-3">
              <button
                type="button"
                className={`${paymentOption === "full" ? "btn-primary" : "btn-outline"} w-full`}
                onClick={() => setPaymentOption("full")}
              >
                Pay Full
              </button>

              <button
                type="button"
                className={`${paymentOption === "partial" ? "btn-primary" : "btn-outline"} w-full`}
                onClick={() => setPaymentOption("partial")}
              >
                Pay Partial
              </button>
            </div>
          </div>

          {paymentOption === "partial" && (
            <div className="space-y-2">
              <h4>Initial Payment <span className="required-field">*</span></h4>
              <input
                type="text"
                value={formData.initialPayment}
                onChange={(e) =>
                  setFormData({ ...formData, initialPayment: e.target.value })
                }
                placeholder="0.00" />
            </div>
          )}

        </div>
      </div>

      {/* extra amenities */}
      <div className="rounded-xl border border-border p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Extra Amenities</h3>
          <button type="button" className="btn-outline" onClick={addAmenityRow}>
            Add Item
          </button>
        </div>

        <datalist id="amenities-list">
          {amenityOptions.map((amenity) => (
            <option key={amenity} value={amenity} />
          ))}
        </datalist>

        <div className="space-y-4">
          {extraAmenities.map((amenity, index) => {
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
                    list="amenities-list"
                    value={amenity.item}
                    onChange={(e) => updateAmenity(amenity.id, "item", e.target.value)}
                    type="text"
                    placeholder={index === 0 ? "Chairs" : "Select or type"}
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
                    disabled={extraAmenities.length === 1}
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

      {/* action buttons */}
      <div className="flex gap-2">
        <button
          className="btn-outline"
          type="button"
          onClick={() => navigate("/bookings")}>
          Cancel
        </button>
        <button className="btn-primary" type="submit">
          Create Booking
        </button>
      </div>
    </form>
  )
}

export default BookingForm;
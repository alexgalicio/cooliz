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

function BookingForm() {
  const navigate = useNavigate();
  const [paymentOption, setPaymentOption] = useState<"full" | "partial">("full");

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
    const totalAmount = Number(formData.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      alert("Total amount must be a number greater than 0.");
      return;
    }

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
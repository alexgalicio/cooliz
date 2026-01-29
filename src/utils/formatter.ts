import { BookingDetails } from "../types/booking";

// format date like Jan 1, 2026
export function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

// format time like 7:30 AM
export function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return s;
  }
}

// format number into ph currency like 12000 -> ₱1,200
export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0, // no demimal place
    maximumFractionDigits: 0, // no demimal place
  }).format(n);
}

// determine the payment status of booking
export function getStatus(item: BookingDetails): "pending" | "partial" | "paid" {
  if (item.remainingAmount <= 0) return "paid";
  if (item.payments.length > 0) return "partial";
  return "pending"; // just incase no payments yet
}
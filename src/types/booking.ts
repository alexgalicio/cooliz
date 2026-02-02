export interface Client {
  id?: number;      // optional since id is auto generated in sql
  name: string;
  phone?: string;
  email?: string;
}

export interface Booking {
  id?: number;
  clientId: number;
  eventType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status?: "active" | "cancelled";
}

export interface Payment {
  id?: number;
  bookingId: number;
  amount: number;
  paymentType: "full" | "partial";
  created_at?: string;
}

export interface BookingDetails {
  booking: Booking;
  client: Client;
  payments: Payment[];
  remainingAmount: number;
}

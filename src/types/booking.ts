export interface Client {
  id?: number;      // optional since id is auto generated in sql
  name: string;
  phone?: string;
  email?: string;
}

export interface ExtraAmenity {
  item: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Booking {
  id?: number;
  clientId: number;
  eventType: string;
  numberOfPerson?: number | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status?: "active" | "cancelled";
  extraAmenities?: ExtraAmenity[] | null;
}

export interface Payment {
  id?: number;
  bookingId: number;
  amount: number;
  paymentType: "full" | "partial" | "refund";
  created_at?: string;
}

export interface BookingDetails {
  booking: Booking;
  client: Client;
  payments: Payment[];
  remainingAmount: number;
}

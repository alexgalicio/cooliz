import Database from "@tauri-apps/plugin-sql";
import { Booking, BookingDetails, Client, Payment } from "../types/booking";

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await Database.load("sqlite:cooliz.db");
  }
  return db;
}

// create client
export async function createClient(client: Client): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    "INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)",
    [client.name, client.phone, client.email]
  );
  return result.lastInsertId!;
}

// create booking
export async function createBooking(booking: Booking): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    `INSERT INTO bookings 
      (client_id, event_type, start_date, end_date, total_amount)
     VALUES (?, ?, ?, ?, ?)`,
    [
      booking.clientId,
      booking.eventType,
      booking.startDate,
      booking.endDate,
      booking.totalAmount,
    ]
  );
  return result.lastInsertId!;
}

// add payment
export async function addPayment(payment: Payment) {
  const database = await getDb();
  await database.execute(
    `INSERT INTO payments (booking_id, amount, payment_type)
     VALUES (?, ?, ?)`,
    [payment.bookingId, payment.amount, payment.paymentType]
  );
}

export async function getAllBookings() {
  const db = await getDb();

  // get all bookings with client info
  const bookingsRaw: any[] = await db.select(
    `
    SELECT 
      b.id AS booking_id,
      b.client_id,
      b.event_type,
      b.start_date,
      b.end_date,
      b.total_amount,
      b.created_at,
      c.name AS client_name,
      c.phone AS client_phone,
      c.email AS client_email
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    ORDER BY b.created_at DESC
    `
  );

  // for each booking, get its payments
  const results: BookingDetails[] = [];

  for (const row of bookingsRaw) {
    const payments: Payment[] = await db.select(
      `SELECT id, booking_id, amount, payment_type, created_at 
       FROM payments 
       WHERE booking_id = ?`,
      [row.booking_id]
    );

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = row.total_amount - totalPaid;

    results.push({
      booking: {
        id: row.booking_id,
        clientId: row.client_id,
        eventType: row.event_type,
        startDate: row.start_date,
        endDate: row.end_date,
        totalAmount: row.total_amount,
      },
      client: {
        id: row.client_id,
        name: row.client_name,
        phone: row.client_phone,
        email: row.client_email,
      },
      payments,
      remainingAmount,
    });
  }

  return results;
}

// check if a time range overlaps any existing booking
export async function isBookingSlotAvailable(startDate: string, endDate: string): Promise<boolean> {
  const db = await getDb();
  const rows: Array<{ count: number }> = await db.select(
    `SELECT COUNT(*) as count
     FROM bookings
     WHERE start_date < ? AND end_date > ?`,
    [endDate, startDate]
  );
  const count = rows[0]?.count ?? 0;
  return count === 0;
}

// delete booking and its payments
export async function deleteBooking(bookingId: number) {
  const db = await getDb();
  await db.execute("DELETE FROM payments WHERE booking_id = ?", [bookingId]);
  await db.execute("DELETE FROM bookings WHERE id = ?", [bookingId]);
}

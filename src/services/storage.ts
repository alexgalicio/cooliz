import Database from "@tauri-apps/plugin-sql";
import { Booking, BookingDetails, Client, Payment } from "../types/booking";
import { Expense } from "../types/expense";

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
  const extraAmenities = booking.extraAmenities ? JSON.stringify(booking.extraAmenities) : null;
  const result = await database.execute(
    `INSERT INTO bookings 
      (client_id, event_type, start_date, end_date, total_amount, status, extra_amenities)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      booking.clientId,
      booking.eventType,
      booking.startDate,
      booking.endDate,
      booking.totalAmount,
      booking.status || 'active',
      extraAmenities,
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

export async function updateBookingExtraAmenities(
  bookingId: number,
  extraAmenities: Booking["extraAmenities"]
) {
  const database = await getDb();
  const payload = extraAmenities ? JSON.stringify(extraAmenities) : null;

  await database.execute(
    `UPDATE bookings
     SET extra_amenities = ?
     WHERE id = ?`,
    [payload, bookingId]
  );
}

export async function getAllBookings() {
  const db = await getDb();

  // get all bookings with client info (including cancelled)
  const bookingsRaw: any[] = await db.select(
    `
    SELECT 
      b.id AS booking_id,
      b.client_id,
      b.event_type,
      b.start_date,
      b.end_date,
      b.total_amount,
      b.status,
      b.extra_amenities,
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
    let extraAmenities = null;
    let amenitiesTotal = 0;

    if (row.extra_amenities) {
      try {
        extraAmenities = JSON.parse(row.extra_amenities);
        if (Array.isArray(extraAmenities)) {
          amenitiesTotal = extraAmenities.reduce(
            (sum: number, item: { total?: number }) => sum + (item.total || 0),
            0
          );
        }
      } catch {
        extraAmenities = null;
      }
    }

    const totalAmountWithAmenities = row.total_amount + amenitiesTotal;
    const remainingAmount = totalAmountWithAmenities - totalPaid;

    results.push({
      booking: {
        id: row.booking_id,
        clientId: row.client_id,
        eventType: row.event_type,
        startDate: row.start_date,
        endDate: row.end_date,
        totalAmount: totalAmountWithAmenities,
        status: row.status,
        extraAmenities: extraAmenities,
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
     WHERE start_date < ? AND end_date > ? AND status != 'cancelled'`,
    [endDate, startDate]
  );
  const count = rows[0]?.count ?? 0;
  return count === 0;
}

// cancel booking (soft delete) with refund logic
export async function cancelBooking(bookingId: number) {
  const db = await getDb();
  
  // Get booking details
  const booking: any[] = await db.select(
    "SELECT total_amount FROM bookings WHERE id = ?",
    [bookingId]
  );
  
  if (booking.length === 0) {
    throw new Error("Booking not found");
  }
  
  // Calculate total paid
  const payments: Array<{ total: number | null }> = await db.select(
    "SELECT SUM(amount) as total FROM payments WHERE booking_id = ?",
    [bookingId]
  );
  
  const totalPaid = payments[0]?.total || 0;
  const totalAmount = booking[0].total_amount;
  const remainingAmount = totalAmount - totalPaid;
  
  // If fully paid (no remaining amount), refund 50%
  if (remainingAmount <= 0 && totalPaid > 0) {
    const refundAmount = totalPaid * 0.5;
    
    // Add refund as negative payment
    await db.execute(
      `INSERT INTO payments (booking_id, amount, payment_type)
       VALUES (?, ?, ?)`,
      [bookingId, -refundAmount, "refund"]
    );
  }
  // If partial payment, no refund (do nothing)
  
  // Mark booking as cancelled
  await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
  
  return {
    refunded: remainingAmount <= 0 && totalPaid > 0,
    refundAmount: remainingAmount <= 0 && totalPaid > 0 ? totalPaid * 0.5 : 0,
  };
}

// get all payments with booking and client info
export async function getAllPayments() {
  const db = await getDb();
  
  const paymentsRaw: any[] = await db.select(
    `
    SELECT 
      p.id AS payment_id,
      p.booking_id,
      p.amount,
      p.payment_type,
      p.created_at,
      b.event_type,
      b.start_date,
      b.total_amount,
      c.name AS client_name,
      c.phone AS client_phone
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN clients c ON b.client_id = c.id
    ORDER BY p.created_at DESC
    `
  );

  return paymentsRaw.map((row) => ({
    id: row.payment_id,
    bookingId: row.booking_id,
    amount: row.amount,
    paymentType: row.payment_type,
    created_at: row.created_at,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    eventType: row.event_type,
    startDate: row.start_date,
    totalAmount: row.total_amount,
  }));
}

export async function addExpense(expense: Expense) {
  const database = await getDb();
  await database.execute(
    `INSERT INTO expenses (category, description, amount, expense_date)
     VALUES (?, ?, ?, ?)`,
    [expense.category, expense.description, expense.amount, expense.expenseDate]
  );
}

export async function getAllExpenses() {
  const db = await getDb();
  return db.select(
    `SELECT id, category, description, amount, expense_date, created_at
     FROM expenses
     ORDER BY expense_date DESC, created_at DESC`
  );
}

export async function getExpensesTotal(startDate?: string, endDate?: string): Promise<number> {
  const db = await getDb();

  let query = "SELECT SUM(amount) as total FROM expenses";
  const params: string[] = [];

  if (startDate && endDate) {
    query += " WHERE expense_date >= ? AND expense_date <= ?";
    params.push(startDate, endDate);
  }

  const rows: Array<{ total: number | null }> = await db.select(query, params.length ? params : undefined);
  return rows[0]?.total || 0;
}

export async function getExpensesByRange(startDate?: string, endDate?: string) {
  const db = await getDb();

  let query = `SELECT id, category, description, amount, expense_date, created_at
               FROM expenses`;
  const params: string[] = [];

  if (startDate && endDate) {
    query += " WHERE expense_date >= ? AND expense_date <= ?";
    params.push(startDate, endDate);
  }

  query += " ORDER BY expense_date DESC, created_at DESC";

  return db.select(query, params.length ? params : undefined);
}

// get monthly stats for dashboard
export async function getMonthlyStats() {
  const db = await getDb();
  
  // Get first and last day of current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Total bookings this month (excluding cancelled)
  const bookingsCount: Array<{ count: number }> = await db.select(
    `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE start_date >= ? AND start_date <= ? AND status != 'cancelled'`,
    [firstDay, lastDay]
  );

  // Total revenue this month (sum of all payments including refunds)
  // This accounts for: regular payments (+) and refunds (-)
  const revenueResult: Array<{ total: number | null }> = await db.select(
    `SELECT SUM(p.amount) as total 
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     WHERE b.start_date >= ? AND b.start_date <= ?`,
    [firstDay, lastDay]
  );
  
  const totalRevenue = revenueResult[0]?.total || 0;
  const amenitiesRows: Array<{ extra_amenities: string | null }> = await db.select(
    `SELECT extra_amenities
     FROM bookings
     WHERE start_date >= ? AND start_date <= ? AND status != 'cancelled'`,
    [firstDay, lastDay]
  );
  const amenitiesTotal = amenitiesRows.reduce((sum, row) => {
    if (!row.extra_amenities) return sum;
    try {
      const amenities = JSON.parse(row.extra_amenities) as Array<{ total?: number }>;
      return sum + amenities.reduce((amenitySum, item) => amenitySum + (item.total || 0), 0);
    } catch {
      return sum;
    }
  }, 0);

  // Pending payments (bookings with remaining amount > 0, excluding cancelled)
  const bookings: any[] = await db.select(
    `SELECT b.id, b.total_amount, b.extra_amenities 
     FROM bookings b
     WHERE b.start_date >= ? AND b.start_date <= ? AND b.status != 'cancelled'`,
    [firstDay, lastDay]
  );

  let pendingAmount = 0;
  let fullyPaidCount = 0;

  for (const booking of bookings) {
    const payments: Array<{ total: number | null }> = await db.select(
      `SELECT SUM(amount) as total FROM payments WHERE booking_id = ?`,
      [booking.id]
    );
    
    const totalPaid = payments[0]?.total || 0;
    let amenitiesTotal = 0;

    if (booking.extra_amenities) {
      try {
        const amenities = JSON.parse(booking.extra_amenities) as Array<{ total?: number }>;
        amenitiesTotal = amenities.reduce((sum, item) => sum + (item.total || 0), 0);
      } catch {
        amenitiesTotal = 0;
      }
    }

    const totalWithAmenities = booking.total_amount + amenitiesTotal;
    const remaining = totalWithAmenities - totalPaid;
    
    if (remaining > 0) {
      pendingAmount += remaining;
    } else {
      fullyPaidCount++;
    }
  }

  return {
    totalBookings: bookingsCount[0]?.count || 0,
    totalRevenue: totalRevenue + amenitiesTotal,
    pendingPayments: pendingAmount,
    fullyPaid: fullyPaidCount,
  };
}

// get monthly revenue forecast (last 6 months)
export async function getMonthlyRevenueForecast() {
  const db = await getDb();
  const monthsData = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    // Get total revenue (sum of all payments) for this month
    const revenueResult: Array<{ total: number | null }> = await db.select(
      `SELECT SUM(p.amount) as total 
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.start_date >= ? AND b.start_date <= ?`,
      [firstDay, lastDay]
    );
    const amenitiesRows: Array<{ extra_amenities: string | null }> = await db.select(
      `SELECT extra_amenities
       FROM bookings
       WHERE start_date >= ? AND start_date <= ? AND status != 'cancelled'`,
      [firstDay, lastDay]
    );
    const amenitiesTotal = amenitiesRows.reduce((sum, row) => {
      if (!row.extra_amenities) return sum;
      try {
        const amenities = JSON.parse(row.extra_amenities) as Array<{ total?: number }>;
        return sum + amenities.reduce((amenitySum, item) => amenitySum + (item.total || 0), 0);
      } catch {
        return sum;
      }
    }, 0);
    
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const revenue = (revenueResult[0]?.total || 0) + amenitiesTotal;
    
    monthsData.push({
      month: monthName,
      revenue: revenue,
    });
  }
  
  return monthsData;
}

// get sales report data with date filtering
export async function getSalesReport(startDate?: string, endDate?: string) {
  const db = await getDb();
  
  let query = `
    SELECT 
      b.id AS booking_id,
      b.event_type,
      b.start_date,
      b.end_date,
      b.total_amount,
      b.extra_amenities,
      b.status,
      b.created_at,
      c.name AS client_name,
      c.phone AS client_phone,
      c.email AS client_email
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
  `;
  
  const params: string[] = [];
  
  if (startDate && endDate) {
    query += ` WHERE b.start_date >= ? AND b.start_date <= ?`;
    params.push(startDate, endDate);
  }
  
  query += ` ORDER BY b.created_at DESC`;
  
  const bookingsRaw: any[] = await db.select(query, params.length > 0 ? params : undefined);
  
  const results = [];
  
  for (const row of bookingsRaw) {
    // Get payments for this booking
    const payments: Array<{ total: number | null }> = await db.select(
      `SELECT SUM(amount) as total FROM payments WHERE booking_id = ?`,
      [row.booking_id]
    );
    
    const totalPaid = payments[0]?.total || 0;
    let amenitiesTotal = 0;

    if (row.extra_amenities) {
      try {
        const amenities = JSON.parse(row.extra_amenities) as Array<{ total?: number }>;
        amenitiesTotal = amenities.reduce((sum, item) => sum + (item.total || 0), 0);
      } catch {
        amenitiesTotal = 0;
      }
    }
    const totalAmountWithAmenities = row.total_amount + amenitiesTotal;
    const remainingAmount = totalAmountWithAmenities - totalPaid;
    
    results.push({
      bookingId: row.booking_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      eventType: row.event_type,
      startDate: row.start_date,
      endDate: row.end_date,
      totalAmount: totalAmountWithAmenities,
      totalPaid: totalPaid,
      amenitiesTotal: amenitiesTotal,
      remainingAmount: remainingAmount,
      status: row.status,
      createdAt: row.created_at,
    });
  }
  
  return results;
}

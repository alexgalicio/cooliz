import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { getAllPayments } from "../services/storage";
import { formatCurrency, formatDate } from "../utils/formatter";

function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Track and manage all payments</p>
        </div>

        {/* payment history */}
        <div className="rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No payments found.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-semibold text-foreground">Client</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Event Type</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Event Date</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Amount Paid</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Total Amount</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border last:border-b-0 bg-background hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">{payment.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{payment.eventType || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(payment.startDate)}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(payment.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Payments;
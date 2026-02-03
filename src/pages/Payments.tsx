import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { getAllPayments } from "../services/storage";
import { formatCurrency, formatDate } from "../utils/formatter";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const totalItems = payments.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = payments.slice(startIndex, startIndex + pageSize);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Track and manage all payments</p>
        </div>

        {/* payment history */}
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              {payments.length === 0 ? (
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
                    {paginated.map((payment) => (
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

            {/* pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Showing{" "}
                  {startIndex + 1}-
                  {Math.min(startIndex + pageSize, totalItems)} of {totalItems} payments
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline px-2 py-1"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-outline px-2 py-1"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Payments;
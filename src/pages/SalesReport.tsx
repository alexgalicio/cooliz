import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { getExpensesByRange, getExpensesTotal, getSalesReport } from "../services/storage";
import { formatCurrency, formatDate } from "../utils/formatter";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

function SalesReport() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startMonth, setStartMonth] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  });
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [exportOption, setExportOption] = useState<"summary" | "revenue" | "expenses">("summary");
  const pageSize = 10;

  useEffect(() => {
    const { startIso, endIso, expenseStart, expenseEnd } = getRangeForMonths(startMonth, endMonth);
    loadReport(startIso, endIso, expenseStart, expenseEnd);
  }, []);

  async function loadReport(start?: string, end?: string, expenseStart?: string, expenseEnd?: string) {
    setLoading(true);
    try {
      const [data, expenseTotal] = await Promise.all([
        getSalesReport(start, end),
        getExpensesTotal(expenseStart, expenseEnd),
      ]);
      setReportData(data);
      setExpensesTotal(expenseTotal);
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
    }
  }

  function getRangeForMonths(start: string, end: string) {
    if (!start || !end) {
      return {
        startIso: undefined,
        endIso: undefined,
        expenseStart: undefined,
        expenseEnd: undefined,
      };
    }

    const startDate = new Date(`${start}-01`);
    const endDate = new Date(`${end}-01`);
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    const startStr = normalizedStart.toISOString().split("T")[0];
    const endStr = normalizedEnd.toISOString().split("T")[0];

    return {
      startIso: normalizedStart.toISOString(),
      endIso: new Date(endStr + "T23:59:59").toISOString(),
      expenseStart: startStr,
      expenseEnd: endStr,
    };
  }

  function handleMonthRangeChange(nextStart: string, nextEnd: string) {
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    const { startIso, endIso, expenseStart, expenseEnd } = getRangeForMonths(nextStart, nextEnd);
    loadReport(startIso, endIso, expenseStart, expenseEnd);
  }

  function setThisMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthValue = `${now.getFullYear()}-${month}`;
    handleMonthRangeChange(monthValue, monthValue);
  }

  function setAllTime() {
    handleMonthRangeChange("", "");
  }

  async function exportToCSV() {
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const headers = [
        "Booking ID",
        "Client Name",
        "Phone",
        "Email",
        "Event Type",
        "Start Date",
        "End Date",
        "Total Amount",
        "Total Paid",
        "Remaining",
        "Amenities Total",
        "Status",
        "Created At"
      ];

      const { expenseStart, expenseEnd } = getRangeForMonths(startMonth, endMonth);
      const expenseRows = await getExpensesByRange(expenseStart, expenseEnd) as Array<{
        id: number;
        category: string;
        description?: string;
        amount: number;
        expense_date: string;
      }>;

      const rangeLabel = startMonth && endMonth ? `${startMonth} to ${endMonth}` : "All Time";
      const summarySection = [
        "Summary",
        `Range,${rangeLabel}`,
        `Total Bookings,${reportData.length}`,
        `Total Revenue,${totalRevenue}`,
        `Total Expenses,${expensesTotal}`,
        `Net Income,${netIncome}`,
        `Pending Payments,${totalPending}`,
      ];

      const salesSection = [
        "Sales",
        headers.join(","),
        ...reportData.map(row => [
          row.bookingId,
          `"${row.clientName}"`,
          `"${row.clientPhone || ""}"`,
          `"${row.clientEmail || ""}"`,
          `"${row.eventType || ""}"`,
          `"${formatDate(row.startDate)}"`,
          `"${formatDate(row.endDate)}"`,
          row.totalAmount,
          row.totalPaid,
          row.remainingAmount,
          row.amenitiesTotal || 0,
          row.status,
          `"${formatDate(row.createdAt)}"`
        ].join(",")),
      ];

      const expenseSection = [
        "Expenses",
        ["Date", "Category", "Description", "Amount"].join(","),
        ...expenseRows.map((expense) => [
          `"${formatDate(expense.expense_date)}"`,
          `"${expense.category}"`,
          `"${expense.description || ""}"`,
          expense.amount,
        ].join(",")),
      ];

      const csvRows = (() => {
        if (exportOption === "revenue") {
          return [
            "Summary",
            `Range,${rangeLabel}`,
            `Total Revenue,${totalRevenue}`,
          ];
        }

        if (exportOption === "expenses") {
          return [
            "Summary",
            `Range,${rangeLabel}`,
            `Total Expenses,${expensesTotal}`,
          ];
        }

        return [
          ...summarySection,
          "",
          ...salesSection,
          "",
          ...expenseSection,
        ];
      })();

      const csvContent = csvRows.join("\n");

      // Use Tauri's dialog to save file
      const filePath = await save({
        defaultPath: `sales-report-${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }]
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);
        alert("Report exported successfully!");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  const totalRevenue = reportData.reduce(
    (sum, row) => sum + row.totalPaid - (row.refundedAmount || 0),
    0
  );
  const totalRefunded = reportData.reduce(
    (sum, row) => sum + (row.refundedAmount || 0),
    0
  );
  const totalPending = reportData.reduce((sum, row) => sum + row.remainingAmount, 0);
  const netIncome = totalRevenue - expensesTotal;

  const totalItems = reportData.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = reportData.slice(startIndex, startIndex + pageSize);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Sales Report</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">View and export your sales data</p>
        </div>

        {/* filters */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Month</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => handleMonthRangeChange(e.target.value, endMonth)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Month</label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => handleMonthRangeChange(startMonth, e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={setThisMonth} className="btn-outline flex-1">
                This Month
              </button>
              <button onClick={setAllTime} className="btn-outline flex-1">
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* export */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="flex gap-2">
            <select
              className="flex-1"
              value={exportOption}
              onChange={(e) => setExportOption(e.target.value as "summary" | "revenue" | "expenses")}
            >
              <option value="summary">Overall Summary</option>
              <option value="revenue">Total Revenue</option>
              <option value="expenses">Total Expenses</option>
            </select>
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* summary */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold text-foreground mt-1">{reportData.length}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Refunded</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalRefunded)}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(expensesTotal)}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Net Income</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(netIncome)}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        {/* table */}
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              {reportData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No sales data found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 font-semibold text-foreground">Client</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Event Type</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Event Date</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Total Amount</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Paid</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Remaining</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((row) => (
                        <tr
                          key={row.bookingId}
                          className="border-b border-border last:border-b-0 bg-background hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-foreground">{row.clientName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row.eventType || "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row.startDate)}
                          </td>
                          <td className="px-4 py-3 text-foreground font-medium">
                            {formatCurrency(row.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {formatCurrency(row.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {formatCurrency(row.remainingAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`badge ${row.status === "cancelled"
                                ? "badge-cancelled"
                                : row.remainingAmount <= 0
                                  ? "badge-paid"
                                  : "badge-partial"
                                }`}
                            >
                              {row.status === "cancelled" ? "cancelled" : row.remainingAmount <= 0 ? "paid" : "partial"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Showing{" "}
                  {startIndex + 1}-
                  {Math.min(startIndex + pageSize, totalItems)} of {totalItems} records
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

export default SalesReport;

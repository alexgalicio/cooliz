import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { getSalesReport } from "../services/storage";
import { formatCurrency, formatDate } from "../utils/formatter";
import { Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

function SalesReport() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport(start?: string, end?: string) {
    setLoading(true);
    try {
      const data = await getSalesReport(start, end);
      setReportData(data);
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange() {
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + "T23:59:59").toISOString();
      loadReport(start, end);
    }
  }

  function setThisMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startStr = firstDay.toISOString().split('T')[0];
    const endStr = lastDay.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    
    loadReport(firstDay.toISOString(), new Date(endStr + "T23:59:59").toISOString());
  }

  function setLastMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const startStr = firstDay.toISOString().split('T')[0];
    const endStr = lastDay.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    
    loadReport(firstDay.toISOString(), new Date(endStr + "T23:59:59").toISOString());
  }

  function setAllTime() {
    setStartDate("");
    setEndDate("");
    loadReport();
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
        "Status",
        "Created At"
      ];

      const csvRows = [
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
          row.status,
          `"${formatDate(row.createdAt)}"`
        ].join(","))
      ];

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

  const totalRevenue = reportData.reduce((sum, row) => sum + row.totalPaid, 0);
  const totalPending = reportData.reduce((sum, row) => sum + row.remainingAmount, 0);

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="btn-primary"
                disabled={!startDate || !endDate}
              >
                Apply Filter
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={setThisMonth} className="btn-outline">
              This Month
            </button>
            <button onClick={setLastMonth} className="btn-outline">
              Last Month
            </button>
            <button onClick={setAllTime} className="btn-outline">
              All Time
            </button>
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center gap-2 ml-auto"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold text-foreground mt-1">{reportData.length}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        {/* table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : reportData.length === 0 ? (
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
                  {reportData.map((row) => (
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
                          className={`badge ${
                            row.status === "cancelled"
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
      </div>
    </MainLayout>
  );
}

export default SalesReport;

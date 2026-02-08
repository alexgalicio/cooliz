import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { getAllBookings } from "../services/storage";
import { BookingTable } from "../components/booking/BookingTable";
import { BookingDetails } from "../types/booking";
import { getStatus } from "../utils/formatter";

function Bookings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false; // prevent state update if the component unmounts
    getAllBookings()
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err) => {
        if (!cancelled) alert("Failed to load bookings: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = bookings.filter((item) => {
    const q = search.trim().toLowerCase();
    const bookingDate = item.booking.startDate.slice(0, 10);
    const matchesSearch = !q || item.client.name.toLowerCase().includes(q);
    const matchesStartDate = !startDate || bookingDate >= startDate;
    const matchesEndDate = !endDate || bookingDate <= endDate;
    const status = getStatus(item);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const sorted = filtered;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, startDate, endDate]);

  const totalItems = sorted.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = sorted.slice(startIndex, startIndex + pageSize);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">Manage all your resort bookings</p>
          </div>
          <button onClick={() => navigate("/newBooking")}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>

        {/* filters */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <Search className="absolute left-3 top-[46px] h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search client name"
                className="pl-10 input-elegant"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
              <input
                type="date"
                className="input-elegant"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
              <input
                type="date"
                className="input-elegant"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-elegant"
              >
                <option value="all">All Status</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading bookings…
          </div>
        ) : (
          <div className="space-y-4">
            <BookingTable bookings={paginated} />

            {/* pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Showing{" "}
                  {startIndex + 1}-
                  {Math.min(startIndex + pageSize, totalItems)} of {totalItems} bookings
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
  )
}

export default Bookings;
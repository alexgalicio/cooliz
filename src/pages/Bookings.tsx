import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { getAllBookings } from "../services/storage";
import { BookingTable } from "../components/booking/BookingTable";
import { BookingDetails } from "../types/booking";
import { getStatus } from "../utils/formatter";

function Bookings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);

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
    const q = search.toLowerCase();
    const matchesSearch =
      !q || // if searchs empty, match all
      item.client.name.toLowerCase().includes(q); // match client name

    const status = getStatus(item); // get booking status
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search client name"
              className="pl-10 input-elegant"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading bookings…
          </div>
        ) : (
          <BookingTable bookings={filtered} />
        )}
      </div>
    </MainLayout>
  )
}

export default Bookings;
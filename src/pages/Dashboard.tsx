import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { UpcomingBookings } from "../components/booking/UpcomingBookings";
import StatsCard from "../components/dashboard/StatsCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { BookingCalendar } from "../components/dashboard/BookingCalendar";
import { getMonthlyStats, getMonthlyRevenueForecast, getAllBookings } from "../services/storage";
import { formatCurrency } from "../utils/formatter";
import { Calendar, DollarSign, Clock, CheckCircle } from "lucide-react";
import { BookingDetails } from "../types/booking";

function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    fullyPaid: 0,
  });
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [statsData, revenueChartData, bookingsData] = await Promise.all([
        getMonthlyStats(),
        getMonthlyRevenueForecast(),
        getAllBookings()
      ]);
      setStats(statsData);
      setRevenueData(revenueChartData);
      setBookings(bookingsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Welcome back! Here's your resort overview
          </p>
        </div>

        {/* stats card */}
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading statistics...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Bookings This Month"
              value={stats.totalBookings}
              icon={<Calendar />}
              variant="blue"
            />
            <StatsCard
              title="Total Revenue This Month"
              value={formatCurrency(stats.totalRevenue)}
              icon={<DollarSign />}
              variant="green"
            />
            <StatsCard
              title="Pending Payments"
              value={formatCurrency(stats.pendingPayments)}
              icon={<Clock />}
              variant="red"
            />
            <StatsCard
              title="Fully Paid This Month"
              value={stats.fullyPaid}
              icon={<CheckCircle />}
              variant="violet"
            />
          </div>
        )}

        {/* revenue chart and calendar */}
        {!loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueChart data={revenueData} />
            <BookingCalendar bookings={bookings} />
          </div>
        )}

        {/* upcoming bookings */}
        <UpcomingBookings />
      </div>
    </MainLayout>
  );
}

export default Dashboard;

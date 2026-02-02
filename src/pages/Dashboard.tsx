import { Calendar, CalendarDays, CheckSquare, Clock, CreditCard } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import { MainLayout } from "../components/layout/MainLayout";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Welcome back! Here's your resort overview</p>
        </div>

        {/* stats cards */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Bookings"
            value={6}
            icon={<Calendar className="w-6 h-6" />}
            variant="blue"
          />
          <StatsCard
            title="Total Revenue"
            value="₱35,000"
            icon={<CreditCard className="w-6 h-6" />}
            variant="green"
          />
          <StatsCard
            title="Pending Payments"
            value="₱27,000"
            icon={<Clock className="w-6 h-6" />}
            variant="red"
          />
          <StatsCard
            title="Fully Paid"
            value={3}
            icon={<CheckSquare className="w-6 h-6" />}
            variant="violet"
          />
        </div>

        {/* graph and calendar */}

        {/* upcoming bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">Upcoming Bookings</h2>
            <button
              onClick={() => navigate('/bookings')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>

          <div className="rounded-xl border border-border p-8 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No upcoming bookings</p>
            <button
              onClick={() => navigate('/newBooking')}
              className="mt-3 text-primary hover:underline text-sm"
            >
              Create your first booking
            </button>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard;
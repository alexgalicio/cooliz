import { MainLayout } from "../components/layout/MainLayout";
import { UpcomingBookings } from "../components/booking/UpcomingBookings";

function Dashboard() {
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

        {/* graph and calendar */}

        {/* upcoming bookings */}
        <UpcomingBookings />
      </div>
    </MainLayout>
  );
}

export default Dashboard;

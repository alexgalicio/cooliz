import BookingForm from "../components/booking/BookingForm";
import { MainLayout } from "../components/layout/MainLayout";

function NewBooking() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">New Booking</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Create a new reservation for your resort</p>
        </div>

        {/* booking form */}
        <BookingForm />
      </div>
    </MainLayout>
  )
}

export default NewBooking;
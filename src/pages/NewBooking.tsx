import { useLocation } from "react-router-dom";
import BookingForm from "../components/booking/BookingForm";
import { MainLayout } from "../components/layout/MainLayout";
import { BookingDetails } from "../types/booking";

function NewBooking() {
  const location = useLocation();
  const editingBooking = location.state as BookingDetails | undefined;
  const isEditing = Boolean(editingBooking?.booking.id);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            {isEditing ? "Edit Booking" : "New Booking"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            {isEditing
              ? "Update the existing reservation details"
              : "Create a new reservation for your resort"}
          </p>
        </div>

        {/* booking form */}
        <BookingForm initialBooking={editingBooking} />
      </div>
    </MainLayout>
  )
}

export default NewBooking;
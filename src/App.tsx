import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Payments from "./pages/Payments";
import SalesReport from "./pages/SalesReport";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import Dashboard from "./pages/Dashboard";
import NewBooking from "./pages/NewBooking";
import Expenses from "./pages/Expenses";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/bookings' element={<Bookings />} />
        <Route path='/booking/:id' element={<BookingDetail />} />
        <Route path='/newBooking' element={<NewBooking />} />
        <Route path='/payments' element={<Payments />} />
        <Route path='/salesReport' element={<SalesReport />} />
        <Route path='/expenses' element={<Expenses />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

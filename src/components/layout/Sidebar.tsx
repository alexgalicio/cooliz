import { Calendar, ChartLine, CreditCard, LayoutDashboard, Plus, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: Plus, label: "New Booking", path: "/newBooking" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: ChartLine, label: "Sales Report", path: "/salesReport" },
]

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* logo */}
          <div className="flex h-16 lg:h-20 items-center justify-between border-b border-sidebar-border px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
                <img src="/images/cooliz.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-display text-base lg:text-lg font-semibold text-sidebar-foreground">Cooliz</h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-sidebar-accent lg:hidden"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>

          {/* navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar;
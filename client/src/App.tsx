import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layouts
import Layout from "./components/Layout";
import CustomerLayout from "./components/CustomerLayout";
import AdminLayout from "./components/AdminLayout";

// Guest / Customer Pages
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Locations } from "./pages/Locations";
import { Menu } from "./pages/Menu";
import { Offers } from "./pages/Offers";
import { Auth } from "./pages/Auth";
import { Checkout } from "./pages/Checkout";
import { Payment } from "./pages/Payment";
import { Profile } from "./pages/Profile";
import { Orders } from "./pages/Orders";

// Staff POS Pages
import { StaffMenu } from "./pages/StaffMenu";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminReports } from "./pages/admin/AdminReports";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminEditOrder from "./pages/admin/AdminEditOrder";
import AdminStockMenu from "./pages/admin/AdminStockMenu";
import AdminViewStockRequest from "./pages/admin/AdminViewStockRequest";
import AdminStockOrders from "./pages/admin/AdminStockOrders";
import AdminCreateStockRequest from "./pages/admin/AdminCreateStockRequest";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEditUser from "./pages/admin/AdminEditUser";
import AdminCategory from "./pages/admin/AdminCategory";

// Manager Pages
import ManagerDailyStock from "./pages/manager/ManagerDailyStock";
import ManagerEditDailyLog from "./pages/manager/ManagerEditDailyLog";
import ManagerStockHistory from "./pages/manager/ManagerStockHistory";
import ManagerViewDailyLog from "./pages/manager/ManagerViewDailyLog";

// Protection Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-orange-500"></i>
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const staffRoles = ["manager", "admin", "store_manager", "staff", "cashier"];
  const adminManagerRoles = ["manager", "admin", "store_manager"];
  const adminOnly = ["admin"];
  const managerOnly = ["store_manager", "admin", "manager"];

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Main Outer App Frame */}
            <Route element={<Layout />}>
              
              {/* Customer Layout Routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/location" element={<Locations />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/offers" element={<Offers />} />
                
                {/* Protected Customer Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/:id"
                  element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Login / Registration (independent layout) */}
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />

              {/* Staff POS Menu (independent layout matching original EJS) */}
              <Route
                path="/staff/menu"
                element={
                  <ProtectedRoute allowedRoles={staffRoles}>
                    <StaffMenu />
                  </ProtectedRoute>
                }
              />

              {/* Administrative Layout for Admin and Manager views */}
              <Route element={<AdminLayout />}>
                
                {/* Dashboard & Reports */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />

                {/* Orders Management */}
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={staffRoles}>
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={staffRoles}>
                      <AdminEditOrder />
                    </ProtectedRoute>
                  }
                />

                {/* Stocks & Stock Requests */}
                <Route
                  path="/admin/stock"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminStockOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stock/create"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminCreateStockRequest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stock/request/:id"
                  element={
                    <ProtectedRoute allowedRoles={staffRoles}>
                      <AdminViewStockRequest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stock/menu"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminStockMenu />
                    </ProtectedRoute>
                  }
                />

                {/* Inventory & Categories */}
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminInventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/category"
                  element={
                    <ProtectedRoute allowedRoles={adminManagerRoles}>
                      <AdminCategory />
                    </ProtectedRoute>
                  }
                />

                {/* Locations Administration */}
                <Route
                  path="/admin/locations"
                  element={
                    <ProtectedRoute allowedRoles={adminOnly}>
                      <AdminLocations />
                    </ProtectedRoute>
                  }
                />

                {/* Users Management */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={adminOnly}>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={adminOnly}>
                      <AdminEditUser />
                    </ProtectedRoute>
                  }
                />

                {/* Manager Daily Stock Logs */}
                <Route
                  path="/manager/daily-stock"
                  element={
                    <ProtectedRoute allowedRoles={managerOnly}>
                      <ManagerDailyStock />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/daily-stock/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={managerOnly}>
                      <ManagerEditDailyLog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/daily-stock/history"
                  element={
                    <ProtectedRoute allowedRoles={managerOnly}>
                      <ManagerStockHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/daily-stock/view/:id"
                  element={
                    <ProtectedRoute allowedRoles={managerOnly}>
                      <ManagerViewDailyLog />
                    </ProtectedRoute>
                  }
                />

              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layouts (Static imports are fine for base layout skeletons)
import Layout from "./components/Layout";
import CustomerLayout from "./components/CustomerLayout";
import AdminLayout from "./components/AdminLayout";
import ScrollToTop from "./components/ScrollToTop";

// Guest / Customer Pages (Lazy Loaded)
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const Locations = lazy(() => import("./pages/Locations").then(m => ({ default: m.Locations })));
const Menu = lazy(() => import("./pages/Menu").then(m => ({ default: m.Menu })));
const Offers = lazy(() => import("./pages/Offers").then(m => ({ default: m.Offers })));
const Auth = lazy(() => import("./pages/Auth").then(m => ({ default: m.Auth })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const Payment = lazy(() => import("./pages/Payment").then(m => ({ default: m.Payment })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Orders = lazy(() => import("./pages/Orders").then(m => ({ default: m.Orders })));

// Staff POS Pages (Lazy Loaded)
const StaffMenu = lazy(() => import("./pages/StaffMenu").then(m => ({ default: m.StaffMenu })));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminReports = lazy(() => import("./pages/admin/AdminReports").then(m => ({ default: m.AdminReports })));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminEditOrder = lazy(() => import("./pages/admin/AdminEditOrder"));
const AdminStockMenu = lazy(() => import("./pages/admin/AdminStockMenu"));
const AdminViewStockRequest = lazy(() => import("./pages/admin/AdminViewStockRequest"));
const AdminStockOrders = lazy(() => import("./pages/admin/AdminStockOrders"));
const AdminCreateStockRequest = lazy(() => import("./pages/admin/AdminCreateStockRequest"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminEditUser = lazy(() => import("./pages/admin/AdminEditUser"));
const AdminCategory = lazy(() => import("./pages/admin/AdminCategory"));

// Manager Pages (Lazy Loaded)
const ManagerDailyStock = lazy(() => import("./pages/manager/ManagerDailyStock"));
const ManagerEditDailyLog = lazy(() => import("./pages/manager/ManagerEditDailyLog"));
const ManagerStockHistory = lazy(() => import("./pages/manager/ManagerStockHistory"));
const ManagerViewDailyLog = lazy(() => import("./pages/manager/ManagerViewDailyLog"));

// Protection Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 text-indigo-600 font-sans">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
    <p className="text-sm font-semibold tracking-wide animate-pulse text-gray-500 dark:text-zinc-400">Loading experience...</p>
  </div>
);

function App() {
  const staffRoles = ["manager", "admin", "store_manager", "staff", "cashier"];
  const adminManagerRoles = ["manager", "admin", "store_manager"];
  const adminOnly = ["admin"];
  const managerOnly = ["store_manager", "admin", "manager"];
  
  const posRoles = ["manager", "admin", "store_manager", "staff"];
  const orderRoles = ["manager", "admin", "store_manager", "cashier"];

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
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
                      <ProtectedRoute allowedRoles={["user"]}>
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
                    <ProtectedRoute allowedRoles={posRoles}>
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
                      <ProtectedRoute allowedRoles={orderRoles}>
                        <AdminOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders/edit/:id"
                    element={
                      <ProtectedRoute allowedRoles={orderRoles}>
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
                      <ProtectedRoute allowedRoles={orderRoles}>
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
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

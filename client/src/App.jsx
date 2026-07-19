import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import Login from './pages/Login.jsx';
import CustomerLogin from './pages/CustomerLogin.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import Shops from './pages/Shops.jsx';
import Products from './pages/Products.jsx';
import CreateProduct from './pages/CreateProduct.jsx';
import Suppliers from './pages/Suppliers.jsx';
import CreateSupplier from './pages/CreateSupplier.jsx';
import Stocks from './pages/Stocks.jsx';
import CreateStock from './pages/CreateStock.jsx';
import Deliveries from './pages/Deliveries.jsx';
import CreateDelivery from './pages/CreateDelivery.jsx';
import CreateShop from './pages/CreateShop.jsx';
import Payments from './pages/Payments.jsx';
import CreatePayment from './pages/CreatePayment.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import AreaMapping from './pages/AreaMapping.jsx';
import CreateArea from './pages/CreateArea.jsx';

// Private Layout wrapper guarding authenticated routes
const AppLayout = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-bold select-none animate-pulse">
        Initializing Distributor Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (window.location.pathname.startsWith('/customer')) {
      return <Navigate to="/customer-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // If user is a customer, and we are not on a customer page, redirect to customer dashboard
  if (user.role === 'customer' && !window.location.pathname.startsWith('/customer')) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // If user is admin, and they navigate to a customer page, redirect to admin home
  if (user.role !== 'customer' && window.location.pathname.startsWith('/customer')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto bg-slate-950/40 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Login guard redirecting away if already authenticated
const LoginGuard = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

const CustomerLoginGuard = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <CustomerLogin />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Gate */}
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/customer-login" element={<CustomerLoginGuard />} />

            {/* Protected Workspace Outlet */}
            <Route path="/" element={<AppLayout />}>
              {/* Admin Routes */}
              <Route index element={<Dashboard />} />
              <Route path="shops" element={<Shops />} />
              <Route path="shops/new" element={<CreateShop />} />
              <Route path="shops/:id/edit" element={<CreateShop />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<CreateProduct />} />
              <Route path="products/:id/edit" element={<CreateProduct />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/new" element={<CreateSupplier />} />
              <Route path="suppliers/:id/edit" element={<CreateSupplier />} />
              <Route path="stocks" element={<Stocks />} />
              <Route path="stocks/new" element={<CreateStock />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="deliveries/new" element={<CreateDelivery />} />
              <Route path="deliveries/:id/dispatch" element={<CreateDelivery />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/new" element={<CreatePayment />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="areas" element={<AreaMapping />} />
              <Route path="areas/new" element={<CreateArea />} />
              <Route path="areas/:id/edit" element={<CreateArea />} />
              
              {/* Customer Routes */}
              <Route path="customer/dashboard" element={<CustomerDashboard />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

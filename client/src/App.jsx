import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import Login from './pages/Login.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Shops from './pages/Shops.jsx';
import Products from './pages/Products.jsx';
import IncomingStock from './pages/IncomingStock.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

// Private Layout wrapper guarding authenticated routes
const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
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
    return <Navigate to="/login" replace />;
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
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Login />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Gate */}
            <Route path="/login" element={<LoginGuard />} />

            {/* Protected Workspace Outlet */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="shops" element={<Shops />} />
              <Route path="products" element={<Products />} />
              <Route path="stock" element={<IncomingStock />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
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

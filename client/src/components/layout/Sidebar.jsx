import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  LayoutDashboard,
  Store,
  Package,
  Import,
  Truck,
  IndianRupee,
  FileBarChart,
  Settings,
  LogOut,
  X,
  MapPin
} from 'lucide-react';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: 'Shops', path: '/shops', icon: <Store className="h-4.5 w-4.5" /> },
    { name: 'Products', path: '/products', icon: <Package className="h-4.5 w-4.5" /> },
    { name: 'Incoming Stock', path: '/stock', icon: <Import className="h-4.5 w-4.5" /> },
    { name: 'Deliveries', path: '/deliveries', icon: <Truck className="h-4.5 w-4.5" /> },
    { name: 'Payments', path: '/payments', icon: <IndianRupee className="h-4.5 w-4.5" /> },
    { name: 'Reports', path: '/reports', icon: <FileBarChart className="h-4.5 w-4.5" /> },
    { name: 'Area Codes', path: '/areas', icon: <MapPin className="h-4.5 w-4.5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-4.5 w-4.5" /> }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-sm tracking-widest shadow-lg shadow-indigo-600/20">
                DIS
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 leading-none">Distributor Hub</h1>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Inventory & Bills</span>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 lg:hidden cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => isOpen && toggleSidebar()} // Close mobile drawer
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-900/60 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700 uppercase">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-200 truncate leading-snug">{user?.name || 'Administrator'}</h4>
              <p className="text-[10px] font-semibold text-slate-500 capitalize leading-none">{user?.role || 'admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 border border-transparent hover:border-rose-950/30 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

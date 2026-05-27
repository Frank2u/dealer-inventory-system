import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, CalendarDays, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync theme to document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Get Page Title from Route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/shops')) return 'Retail Shop Database';
    if (path.startsWith('/products')) return 'Product Inventory';
    if (path.startsWith('/stock')) return 'Incoming Stock Log';
    if (path.startsWith('/deliveries')) return 'Delivery Invoices';
    if (path.startsWith('/payments')) return 'Payments Collected';
    if (path.startsWith('/reports')) return 'Business Intelligence Reports';
    if (path.startsWith('/settings')) return 'Application Settings';
    return 'Distributor Management';
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <header className="h-16 border-b border-slate-900 bg-slate-950/20 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none">
      
      {/* Page Title & Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-sm lg:text-base font-bold text-slate-100 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Stats, Date & Theme Toggle */}
      <div className="flex items-center gap-5">
        
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-semibold">
          <CalendarDays className="h-4 w-4 text-indigo-400" />
          <span>{formatDate(currentTime)}</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/40 hover:border-slate-800 transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-indigo-500" />
          )}
        </button>
        
      </div>
    </header>
  );
};

export default Header;

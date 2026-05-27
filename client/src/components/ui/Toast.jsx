import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

  const toast = { success, error, warning, info };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
            error: <AlertOctagon className="h-5 w-5 text-rose-400" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
            info: <Info className="h-5 w-5 text-indigo-400" />
          };

          const borderColors = {
            success: 'border-emerald-500/20 bg-slate-900/90',
            error: 'border-rose-500/20 bg-slate-900/90',
            warning: 'border-amber-500/20 bg-slate-900/90',
            info: 'border-indigo-500/20 bg-slate-900/90'
          };

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 border rounded-xl shadow-2xl glassmorphism pointer-events-auto animate-fade-in ${borderColors[t.type]}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
              <div className="flex-1 text-sm font-medium text-slate-200 leading-relaxed pr-2">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-0.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

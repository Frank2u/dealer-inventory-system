import React from 'react';

export const Select = React.forwardRef(({
  className = '',
  label,
  error,
  options = [],
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-400 select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full bg-slate-900/60 border ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'
          } rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {children || options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Custom Chevron Indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs text-rose-500 font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;

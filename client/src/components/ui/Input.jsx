import React from 'react';

export const Input = React.forwardRef(({
  className = '',
  label,
  error,
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-400 select-none">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full bg-slate-900/60 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'
        } rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-rose-500 font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

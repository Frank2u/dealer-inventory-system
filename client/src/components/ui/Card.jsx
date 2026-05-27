import React from 'react';

export const Card = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-5 border-b border-slate-900/50 flex flex-col gap-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className = '', children, ...props }) => {
  return (
    <h3 className={`text-base font-bold text-slate-100 tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className = '', children, ...props }) => {
  return (
    <p className={`text-xs text-slate-400 font-medium ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-5 bg-slate-900/10 border-t border-slate-900/50 flex justify-end items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

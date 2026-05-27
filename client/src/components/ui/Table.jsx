import React from 'react';

export const Table = ({ className = '', children, ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-900 bg-slate-950/20">
      <table className={`w-full text-sm text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ className = '', children, ...props }) => {
  return (
    <thead className={`text-xs font-semibold text-slate-400 uppercase bg-slate-950/40 border-b border-slate-900 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ className = '', children, ...props }) => {
  return (
    <tbody className={`divide-y divide-slate-900/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ className = '', children, ...props }) => {
  return (
    <tr className={`hover:bg-slate-900/40 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHead = ({ className = '', children, ...props }) => {
  return (
    <th className={`px-4 py-3 font-semibold text-slate-400 select-none ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ className = '', children, ...props }) => {
  return (
    <td className={`px-4 py-3 text-slate-300 font-medium whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
};
